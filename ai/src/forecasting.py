import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sklearn.linear_model import LinearRegression
from src.database import get_db
import logging

logger = logging.getLogger("sibis-ai-forecasting")

def generate_demand_forecast(store_id: str = None):
    """
    Connects to MongoDB, gathers sales records, fits Linear Regression demand models
    for each product, and outputs smart reordering suggestions.
    """
    db = get_db()
    
    product_filter = {}
    sales_filter = {}
    supplier_filter = {}
    if store_id:
        from bson import ObjectId
        try:
            store_obj_id = ObjectId(store_id)
            product_filter["storeId"] = store_obj_id
            sales_filter["storeId"] = store_obj_id
            supplier_filter["storeId"] = store_obj_id
        except Exception:
            product_filter["storeId"] = store_id
            sales_filter["storeId"] = store_id
            supplier_filter["storeId"] = store_id

    # 1. Fetch all collections
    products = list(db.products.find(product_filter))
    suppliers = {str(s["_id"]): s for s in db.suppliers.find(supplier_filter)}
    
    # Load all sales records to compute velocity and fit ML models
    sales = list(db.sales.find(sales_filter))
    
    # Flatten sale items for analysis
    sales_flat = []
    for sale in sales:
        created_at = sale.get("createdAt")
        if not created_at:
            continue
        # Convert datetime if string
        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
        
        for item in sale.get("items", []):
            sales_flat.append({
                "productId": str(item["productId"]),
                "quantity": item["quantity"],
                "price": item["priceAtSale"],
                "date": created_at.date(),
                "datetime": created_at
            })
            
    df_sales = pd.DataFrame(sales_flat)
    
    recommendations = []
    
    for product in products:
        prod_id = str(product["_id"])
        prod_name = product["name"]
        sku = product["sku"]
        current_stock = product.get("currentStock", 0)
        min_threshold = product.get("minStockThreshold", 10)
        
        # Get supplier name
        sup_id = str(product.get("supplierId"))
        supplier_name = suppliers.get(sup_id, {}).get("name", "Unknown Supplier")
        
        # Filter sales for this product
        predicted_demand = 0.0
        
        if not df_sales.empty:
            df_prod = df_sales[df_sales["productId"] == prod_id]
        else:
            df_prod = pd.DataFrame()
            
        if not df_prod.empty:
            # Aggregate quantities sold by day
            df_daily = df_prod.groupby("date")["quantity"].sum().reset_index()
            # Sort by date
            df_daily = df_daily.sort_values("date")
            
            # If we have enough data points (e.g. at least 5 different days of sales), fit Linear Regression
            if len(df_daily) >= 5:
                try:
                    # Convert dates to a numerical offset (days from start)
                    start_date = df_daily["date"].min()
                    df_daily["day_offset"] = (df_daily["date"] - start_date).dt.days
                    
                    # Prepare X and y
                    X = df_daily[["day_offset"]].values
                    y = df_daily["quantity"].values
                    
                    # Fit Linear Regression Model
                    model = LinearRegression()
                    model.fit(X, y)
                    
                    # Forecast the next 7 days
                    last_offset = df_daily["day_offset"].max()
                    next_offsets = np.array([[last_offset + i] for i in range(1, 8)])
                    
                    # Predict daily demand and sum it
                    predictions = model.predict(next_offsets)
                    # Clip predictions at 0 (cannot sell negative items)
                    predicted_demand = float(np.sum(np.clip(predictions, 0, None)))
                except Exception as e:
                    logger.warning(f"Linear regression fitting failed for product {prod_name}: {e}")
                    # Fall back to moving average
                    avg_daily = df_daily["quantity"].mean()
                    predicted_demand = float(avg_daily * 7)
            else:
                # Fall back: simple mean of daily quantities sold * 7
                avg_daily = df_daily["quantity"].mean()
                predicted_demand = float(avg_daily * 7)
        else:
            # Baseline default if no transactions exist (e.g. 5 units based on category limits)
            predicted_demand = 5.0

        # Round predicted demand to readable decimal
        predicted_demand = round(predicted_demand, 2)
        
        # 3. Apply Reordering Trigger Heuristics
        # Trigger reorder if current stock is below threshold OR cannot fulfill next 7-day predicted demand
        is_trigger = (current_stock <= min_threshold) or (current_stock < predicted_demand)
        
        if is_trigger:
            # Order quantity = predicted demand - current stock + safety threshold buffer
            suggested_order = int(np.ceil(max(0, predicted_demand - current_stock + min_threshold)))
            # If suggested order is zero but we triggered, default to min threshold buffer
            if suggested_order == 0:
                suggested_order = min_threshold
                
            recommendations.append({
                "id": prod_id,
                "product": prod_name,
                "sku": sku,
                "currentStock": current_stock,
                "predictedDemand": predicted_demand,
                "suggestion": f"Current stock is insufficient. Recommended ordering {suggested_order} units from {supplier_name} to fulfill predicted demand."
            })
            
    return recommendations
