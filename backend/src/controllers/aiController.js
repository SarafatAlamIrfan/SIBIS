const Product = require('../models/Product');
const Sale = require('../models/Sale');

// @desc    Calculate REAL smart reorder recommendations based on MongoDB inventory & sales
// @route   GET /api/ai/recommendations
// @access  Public (Filtered by storeId in req.user)
exports.getRecommendations = async (req, res, next) => {
  try {
    const filter = {};
    if (req.user && req.user.storeId) {
      filter.storeId = req.user.storeId;
    }

    // 1. Fetch store products
    const products = await Product.find(filter);

    // 2. Fetch store sales in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const salesFilter = { createdAt: { $gte: thirtyDaysAgo } };
    if (req.user && req.user.storeId) {
      salesFilter.storeId = req.user.storeId;
    }
    const sales = await Sale.find(salesFilter);

    // Calculate total quantity sold per product over 30 days
    const productSalesMap = {};
    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        if (item.productId) {
          const pId = item.productId.toString();
          productSalesMap[pId] = (productSalesMap[pId] || 0) + item.quantity;
        }
      });
    });

    const recommendations = [];

    products.forEach((product) => {
      const pId = product._id.toString();
      const total30DaySales = productSalesMap[pId] || 0;
      const avgDailySales = total30DaySales / 30;
      // 14-day predicted demand
      const predictedDemand = Math.max(product.minStockThreshold, Math.ceil(avgDailySales * 14));

      // Trigger recommendation if current stock is <= threshold or < predicted demand
      if (product.currentStock <= product.minStockThreshold || product.currentStock < predictedDemand) {
        const suggestedQty = Math.max(10, (predictedDemand - product.currentStock) + product.minStockThreshold);
        recommendations.push({
          id: product._id,
          product: product.name,
          currentStock: product.currentStock,
          predictedDemand,
          suggestion: `Current stock (${product.currentStock}) is below safe threshold (${product.minStockThreshold}). Recommended reorder: ${suggestedQty} units.`,
        });
      }
    });

    res.status(200).json(recommendations);
  } catch (error) {
    next(error);
  }
};

// @desc    Calculate REAL daily business insights dynamically from MongoDB data
// @route   GET /api/ai/insights
// @access  Public (Filtered by storeId in req.user)
exports.getInsights = async (req, res, next) => {
  try {
    const filter = {};
    if (req.user && req.user.storeId) {
      filter.storeId = req.user.storeId;
    }

    const products = await Product.find(filter);
    const sales = await Sale.find(filter);

    const insights = [];

    if (products.length === 0) {
      return res.status(200).json([
        {
          id: 'no-products',
          type: 'info',
          message: 'No products added yet. Add inventory products to start receiving real-time business insights.',
          icon: 'Package',
          color: 'text-indigo-500 bg-indigo-500/10 dark:text-indigo-400 dark:bg-indigo-950/30',
        },
      ]);
    }

    // Calculate sales revenue & volume per product
    const productSalesMap = {};
    let totalStoreRevenue = 0;

    sales.forEach((sale) => {
      totalStoreRevenue += sale.totalAmount;
      sale.items.forEach((item) => {
        if (item.productId) {
          const pId = item.productId.toString();
          if (!productSalesMap[pId]) {
            productSalesMap[pId] = { qty: 0, revenue: 0 };
          }
          productSalesMap[pId].qty += item.quantity;
          productSalesMap[pId].revenue += item.priceAtSale * item.quantity;
        }
      });
    });

    // A. Top performing product
    let topProduct = null;
    let maxRev = -1;
    products.forEach((p) => {
      const pData = productSalesMap[p._id.toString()] || { revenue: 0, qty: 0 };
      if (pData.revenue > maxRev && pData.revenue > 0) {
        maxRev = pData.revenue;
        topProduct = { product: p, revenue: pData.revenue, qty: pData.qty };
      }
    });

    if (topProduct) {
      insights.push({
        id: 'top-product',
        type: 'positive',
        message: `"${topProduct.product.name}" is your top performing product generating ৳${topProduct.revenue.toFixed(2)} in total sales revenue (${topProduct.qty} units sold).`,
        icon: 'TrendingUp',
        color: 'text-emerald-500 bg-emerald-500/10 dark:text-emerald-400 dark:bg-emerald-950/30',
      });
    }

    // B. Low stock alert insight
    const lowStockProducts = products.filter((p) => p.currentStock <= p.minStockThreshold);
    if (lowStockProducts.length > 0) {
      const p = lowStockProducts[0];
      insights.push({
        id: 'low-stock-alert',
        type: 'warning',
        message: `"${p.name}" stock level (${p.currentStock}) is below minimum threshold (${p.minStockThreshold}). Reorder recommended.`,
        icon: 'AlertTriangle',
        color: 'text-amber-500 bg-amber-500/10 dark:text-amber-400 dark:bg-amber-950/30',
      });
    }

    // C. Unsold / Slow-moving stock insight
    const zeroSalesProduct = products.find(
      (p) => !productSalesMap[p._id.toString()] || productSalesMap[p._id.toString()].qty === 0
    );
    if (zeroSalesProduct) {
      insights.push({
        id: 'slow-stock-alert',
        type: 'negative',
        message: `"${zeroSalesProduct.name}" has recorded zero sales so far. Consider promotional pricing or placement.`,
        icon: 'TrendingDown',
        color: 'text-rose-500 bg-rose-500/10 dark:text-rose-400 dark:bg-rose-950/30',
      });
    }

    // D. Highest profit margin product
    let highestMarginProduct = null;
    let maxMargin = -1;
    products.forEach((p) => {
      const margin = p.sellingPrice - p.purchasePrice;
      if (margin > maxMargin) {
        maxMargin = margin;
        highestMarginProduct = { product: p, margin };
      }
    });

    if (highestMarginProduct && highestMarginProduct.margin > 0) {
      insights.push({
        id: 'high-margin',
        type: 'info',
        message: `"${highestMarginProduct.product.name}" offers your highest unit profit margin (৳${highestMarginProduct.margin.toFixed(2)} profit per unit).`,
        icon: 'DollarSign',
        color: 'text-indigo-500 bg-indigo-500/10 dark:text-indigo-400 dark:bg-indigo-950/30',
      });
    }

    res.status(200).json(insights);
  } catch (error) {
    next(error);
  }
};
