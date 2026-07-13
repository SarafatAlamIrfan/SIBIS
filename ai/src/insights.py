import pandas as pd
from datetime import datetime, timedelta
from src.database import get_db

def generate_business_insights():
    db = get_db()
    
    # 1. Fetch collections
    products = list(db.products.find())
    sales = list(db.sales.find())
    
    # Compute today's reference point
    now = datetime.now()
    thirty_days_ago = now - timedelta(days=30)
    seven_days_ago = now - timedelta(days=7)
    
    # Flatten sale items
    sales_flat = []
    for sale in sales:
        created_at = sale.get("createdAt")
        if not created_at:
            continue
        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
        
        # Make created_at timezone-naive for comparison
        created_at_naive = created_at.replace(tzinfo=None)
        
        for item in sale.get("items", []):
            sales_flat.append({
                "productId": str(item["productId"]),
                "quantity": item["quantity"],
                "price": item["priceAtSale"],
                "cost": item.get("priceAtSale", 0) - item.get("profitMargin", 0), # derive cost
                "profit": item.get("profitMargin", 0) * item["quantity"],
                "datetime": created_at_naive
            })
            
    df_sales = pd.DataFrame(sales_flat)
    
    insights = []
    insight_id = 1
    
    # Analyze products one by one
    for product in products:
        prod_id = str(product["_id"])
        prod_name = product["name"]
        current_stock = product.get("currentStock", 0)
        purchase_price = product.get("purchasePrice", 0)
        selling_price = product.get("sellingPrice", 0)
        
        # --- A. Stock Out Warnings ---
        if current_stock <= 0:
            insights.append({
                "id": insight_id,
                "type": "negative",
                "message": f"{prod_name} is out of stock! Consider placing a reorder immediately.",
                "icon": "AlertTriangle",
                "color": "text-rose-500 bg-rose-50 dark:bg-rose-950/30"
            })
            insight_id += 1
            continue
            
        # Compute daily velocity over the last 30 days
        if not df_sales.empty:
            df_prod_30 = df_sales[(df_sales["productId"] == prod_id) & (df_sales["datetime"] >= thirty_days_ago)]
            total_qty_30 = df_prod_30["quantity"].sum() if not df_prod_30.empty else 0
            daily_velocity = total_qty_30 / 30.0
        else:
            daily_velocity = 0
            
        if daily_velocity > 0:
            days_to_empty = current_stock / daily_velocity
            if days_to_empty <= 3:
                insights.append({
                    "id": insight_id,
                    "type": "warning",
                    "message": f"{prod_name} is running low and will run out within {round(days_to_empty)} days based on recent sales velocity.",
                    "icon": "AlertTriangle",
                    "color": "text-amber-500 bg-amber-50 dark:bg-amber-950/30"
                })
                insight_id += 1
                
        # --- B. Slow-moving items ---
        if not df_sales.empty:
            df_prod_30_all = df_sales[df_sales["productId"] == prod_id]
            has_sales_30 = not df_prod_30_all[df_prod_30_all["datetime"] >= thirty_days_ago].empty
        else:
            has_sales_30 = False
            
        if not has_sales_30:
            insights.append({
                "id": insight_id,
                "type": "negative",
                "message": f"{prod_name} has not sold a single unit in the last 30 days. Consider running a discount or promotion.",
                "icon": "TrendingDown",
                "color": "text-rose-500 bg-rose-50 dark:bg-rose-950/30"
            })
            insight_id += 1

    # --- C. Margin Analysis (Top Product) ---
    max_margin_prod = None
    max_margin = -1.0
    
    for product in products:
        margin = product.get("sellingPrice", 0) - product.get("purchasePrice", 0)
        if margin > max_margin:
            max_margin = margin
            max_margin_prod = product["name"]
            
    if max_margin_prod and max_margin > 0:
        insights.append({
            "id": insight_id,
            "type": "info",
            "message": f"{max_margin_prod} generates the highest profit margin (${max_margin:.2f} per unit) in your current catalog.",
            "icon": "DollarSign",
            "color": "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30"
        })
        insight_id += 1

    # --- D. Trend Growth Insights ---
    # Find product with highest sales volume in the last 7 days
    if not df_sales.empty:
        df_7 = df_sales[df_sales["datetime"] >= seven_days_ago]
        if not df_7.empty:
            top_sold = df_7.groupby("productId")["quantity"].sum().reset_index()
            top_sold = top_sold.sort_values("quantity", ascending=False)
            if not top_sold.empty:
                best_prod_id = top_sold.iloc[0]["productId"]
                best_prod_qty = top_sold.iloc[0]["quantity"]
                best_prod_match = next((p for p in products if str(p["_id"]) == best_prod_id), None)
                if best_prod_match:
                    insights.append({
                        "id": insight_id,
                        "type": "positive",
                        "message": f"{best_prod_match['name']} is your top selling product this week with {best_prod_qty} units sold.",
                        "icon": "TrendingUp",
                        "color": "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
                    })
                    insight_id += 1

    # If no insights were generated (e.g. empty DB), add standard placeholder guidelines
    if not insights:
        insights.append({
            "id": 1,
            "type": "info",
            "message": "Welcome to SIBIS AI Business Insights. Insights will appear once catalog items are sold.",
            "icon": "Lightbulb",
            "color": "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30"
        })
        
    return insights
