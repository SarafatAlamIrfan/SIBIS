const axios = require('axios');
const Product = require('../models/Product');
const Sale = require('../models/Sale');

// @desc    Calculate REAL smart reorder recommendations based on MongoDB inventory & sales
// @route   GET /api/ai/recommendations
// @access  Public (Filtered by storeId in req.user)
exports.getRecommendations = async (req, res, next) => {
  try {
    const storeId = req.user && req.user.storeId
      ? (req.user.storeId._id || req.user.storeId).toString()
      : null;

    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';

    try {
      // Try to fetch recommendations from Python AI service
      const response = await axios.get(`${aiServiceUrl}/ai/forecast`, {
        params: storeId ? { store_id: storeId } : {}
      });
      return res.status(200).json(response.data);
    } catch (aiError) {
      console.error('Python AI service failed/offline. Falling back to local Node.js calculations:', aiError.message);

      // Fallback local calculations
      const filter = {};
      if (storeId) {
        filter.storeId = storeId;
      }

      // 1. Fetch store products
      const products = await Product.find(filter);

      // 2. Fetch store sales in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const salesFilter = { createdAt: { $gte: thirtyDaysAgo } };
      if (storeId) {
        salesFilter.storeId = storeId;
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

      return res.status(200).json(recommendations);
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Calculate REAL daily business insights dynamically from MongoDB data
// @route   GET /api/ai/insights
// @access  Public (Filtered by storeId in req.user)
exports.getInsights = async (req, res, next) => {
  try {
    const storeId = req.user && req.user.storeId
      ? (req.user.storeId._id || req.user.storeId).toString()
      : null;

    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';

    try {
      // Try to fetch insights from Python AI service
      const response = await axios.get(`${aiServiceUrl}/ai/insights`, {
        params: storeId ? { store_id: storeId } : {}
      });
      return res.status(200).json(response.data);
    } catch (aiError) {
      console.error('Python AI service failed/offline. Falling back to local Node.js insights:', aiError.message);

      // Fallback local calculations
      const filter = {};
      if (storeId) {
        filter.storeId = storeId;
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

      return res.status(200).json(insights);
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Chat with SIBIS AI Advisor chatbot using Gemini API contextually
// @route   POST /api/ai/chat
// @access  Public (Filtered by storeId)
exports.chatWithAi = async (req, res, next) => {
  try {
    const { message, chatHistory } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const storeId = req.user && req.user.storeId
      ? (req.user.storeId._id || req.user.storeId).toString()
      : null;

    const filter = {};
    if (storeId) {
      filter.storeId = storeId;
    }

    // 1. Gather Store Context
    const products = await Product.find(filter);
    
    // Low stock
    const lowStock = products.filter(p => p.currentStock <= p.minStockThreshold);
    // Out of stock
    const outOfStock = products.filter(p => p.currentStock <= 0);
    
    // Fetch last 5 sales
    const sales = await Sale.find(filter).sort({ createdAt: -1 }).limit(5);
    const totalSalesVolume = sales.reduce((sum, s) => sum + s.totalAmount, 0);

    const storeName = req.user?.storeId?.name || 'the Store';
    
    // Format context summary
    const storeContext = `
Active Store: ${storeName}
Total Unique Products: ${products.length}
Low Stock Products (${lowStock.length} items): ${lowStock.slice(0, 5).map(p => `${p.name} (Stock: ${p.currentStock}/${p.minStockThreshold})`).join(', ')}
Out of Stock Products (${outOfStock.length} items): ${outOfStock.slice(0, 5).map(p => p.name).join(', ')}
Recent Sales Count: ${sales.length}
Recent Sales Value: ৳${totalSalesVolume.toFixed(2)}
    `.trim();

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        // Build history structure for Gemini
        const formattedContents = [];
        
        // Add conversation history if provided
        if (chatHistory && Array.isArray(chatHistory)) {
          chatHistory.forEach(h => {
            formattedContents.push({
              role: h.sender === 'user' ? 'user' : 'model',
              parts: [{ text: h.text }]
            });
          });
        }
        
        // Add context to prompt
        const prompt = `
System Context for SIBIS AI:
${storeContext}

User Query: "${message}"

You are SIBIS AI, a smart assistant and business decision support system for retail store owners.
Provide concise, clear, and actionable retail advice using the store context above. Be professional, friendly, and output your response in Markdown format. Keep it within 3-4 short paragraphs.
        `.trim();

        formattedContents.push({
          role: 'user',
          parts: [{ text: prompt }]
        });

        // Call Gemini REST API
        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            contents: formattedContents
          },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 8000
          }
        );

        if (response.data && response.data.candidates && response.data.candidates[0].content) {
          const aiResponse = response.data.candidates[0].content.parts[0].text;
          return res.status(200).json({ response: aiResponse });
        }
      } catch (geminiError) {
        console.error('Gemini API call failed, falling back to rule-based parser:', geminiError.message);
      }
    }

    // 2. Intelligent Rule-Based Fallback Agent
    let reply = `Hello! I am **SIBIS AI**, your retail business assistant. I'm currently running in local analyzer mode. Let me give you an update on **${storeName}**:\n\n`;
    
    const query = message.toLowerCase();
    
    if (query.includes('stock') || query.includes('inventory') || query.includes('product')) {
      reply += `### 📦 Inventory Summary\n`;
      reply += `* **Catalog Size**: ${products.length} products listed.\n`;
      if (lowStock.length > 0) {
        reply += `* **⚠️ Low Stock Alert**: There are **${lowStock.length}** products running low.\n`;
        lowStock.slice(0, 3).forEach(p => {
          reply += `  * *${p.name}* (Current stock: **${p.currentStock}**, min threshold: **${p.minStockThreshold}**)\n`;
        });
      } else {
        reply += `* **✅ Stock levels**: All inventory items are currently healthy and above safety thresholds!\n`;
      }
      if (outOfStock.length > 0) {
        reply += `* **🚨 Out of Stock**: **${outOfStock.length}** products are completely sold out: *${outOfStock.slice(0, 3).map(p => p.name).join(', ')}*.\n`;
      }
      reply += `\n*Recommendation: Go to the **Products & Stock** tab or check the **Reorder List** to draft purchase orders for these items.*`;
    } else if (query.includes('sale') || query.includes('revenue') || query.includes('profit') || query.includes('money') || query.includes('trans')) {
      reply += `### 💰 Sales Performance Summary\n`;
      reply += `* **Recent Sales Volume**: Verified **${sales.length}** recent transactions in this session.\n`;
      reply += `* **Revenue generated**: **৳${totalSalesVolume.toFixed(2)}** in total sales volume across these purchases.\n`;
      if (sales.length > 0) {
        reply += `* **Recent Receipt ID**: \`${sales[0].invoiceNumber}\` (Amount: ৳${sales[0].totalAmount})\n`;
      }
      reply += `\n*Recommendation: Open the **System Reports** page to generate detailed margin analysis and peak sales periods.*`;
    } else {
      reply += `I can help you monitor inventory, track low stock, audit recent sales, and suggest reordering guidelines.\n\n`;
      reply += `Here are some things you can ask me:\n`;
      reply += `* *"Check my low stock products"* \n`;
      reply += `* *"How are our sales performing?"* \n`;
      reply += `* *"Suggest promotional advice for expiring inventory"*`;
    }

    return res.status(200).json({ response: reply });
  } catch (error) {
    next(error);
  }
};
