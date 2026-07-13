# Smart Inventory & Business Inventory System (SIBIS)

A smart, AI-powered web-based Inventory Management and Business Decision Support System designed for small grocery stores, pharmacies, minimarts, and local retail shops.

---

## 📌 Project Overview
Many small retail businesses still manage their inventory using registers (khata) or Excel sheets. This approach leads to several challenges:
*   Inability to track low-running stock in real-time.
*   Over-purchasing products, tying up working capital.
*   Losses due to product expiration.
*   Difficulty in identifying high-performing and low-performing products.
*   Relying on guesswork for stock reordering.

**SIBIS** addresses these challenges by combining a standard Inventory Management System with an AI-driven Decision Support System (a Smart Assistant).

---

## ⚙️ How the System Works (Full Workflow)
1.  **Customer Purchase:** A customer selects products to buy.
2.  **Point of Sale (POS):** The cashier completes the sale using the POS module.
3.  **Real-time Updates:** The sale is saved to the Sales Database, stock levels are automatically reduced, and sales history is updated. No manual stock adjustments are needed.
4.  **AI Analysis:** At the end of the day (or at scheduled times), the AI service analyzes the sales data.
5.  **Predictive Forecasting:** The AI forecasts future demand and creates smart reorder recommendations.
6.  **Dashboard Insights:** Reorder recommendations and business insights are displayed on the Owner's Dashboard.

---

## 🛠️ Main Modules

### 1. Authentication & Role-Based Access Control (RBAC)
*   **Roles:** Owner, Manager, Cashier, Inventory Staff.
*   **Permissions:** Custom dashboard views and features mapped to specific user roles to ensure security and division of labor.

### 2. Product & Inventory Management
*   Add, edit, and delete products.
*   Manage Categories, Brands, and Suppliers.
*   Track current stock levels.
*   Track Stock-In and Stock-Out operations.
*   Maintain full inventory history.

### 3. Sales (Point of Sale - POS)
*   Product search and scanning (with barcode scanning support).
*   Cart creation and management.
*   Invoice/Receipt generation.
*   Payment processing.
*   Real-time automatic inventory decrement.

### 4. Purchase Management
*   Create Purchase Orders (PO).
*   Select suppliers and manage procurement.
*   Automatically update stock levels when items are received.

### 5. Supplier Management
*   Maintain supplier details (Name, contact info, catalog).
*   Track purchase history per supplier.

### 6. Business Dashboard
A central hub for store owners to view the pulse of their business at a glance:
*   Today's Sales & Monthly Revenue.
*   Total Product Counts.
*   Alerts for Low Stock & Expiring Products.
*   Top Selling Products.
*   Recent system activities.
*   AI Recommendations & Insights.

### 7. Reports
*   Daily & Monthly Sales Reports.
*   Inventory Reports.
*   Profitability Reports.

### 8. Automated Notifications
*   Low-stock alerts.
*   Expiration alerts.
*   Reorder notices.

---

## 🤖 Smart AI Features
*The AI is implemented to solve actual pain points, converting raw data into actionable business intelligence.*

*   **AI Feature 1 — Demand Forecasting:** Analyzes historical sales data to predict future demand (e.g., *"Based on the last month, Rice is selling 8–10 bags daily. AI predicts 60 bags of Rice will be sold in the next 7 days."*).
*   **AI Feature 2 — Smart Reorder Recommendations:** Combines current stock levels with demand forecasts to recommend exact order quantities (e.g., *"Current Stock: 15 bags. Next week's predicted sales: 40 bags. AI recommends ordering 25 more bags."*).
*   **AI Feature 3 — Business Insights:** Highlights trends and highlights key issues on the dashboard:
    *   *"Rice sales increased by 15% compared to last week."*
    *   *"Milk will run out within 3 days."*
    *   *"Biscuits have not sold in the last 30 days."*
    *   *"Cooking Oil generated the highest profit this month."*

---

## 💻 Tech Stack (Proposed)

### Frontend
*   **Framework:** React.js
*   **Styling:** Tailwind CSS

### Backend
*   **Framework:** Node.js + Express.js
*   **Database:** MongoDB
*   **Authentication:** Firebase Auth

### AI Service
*   **Language & API:** Python + FastAPI
*   **Data Analysis & ML:** Scikit-learn, Pandas
