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

    const filter = {};
    if (storeId) {
      filter.storeId = storeId;
    }

    // 1. Fetch store products
    const products = await Product.find(filter).lean();

    // 2. Fetch store sales in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const salesFilter = { createdAt: { $gte: thirtyDaysAgo } };
    if (storeId) {
      salesFilter.storeId = storeId;
    }
    const sales = await Sale.find(salesFilter).lean();

    // Aggregate daily sales metrics per product to keep prompt size optimized
    const productSalesMap = {};
    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        if (item.productId) {
          const pId = item.productId.toString();
          if (!productSalesMap[pId]) {
            productSalesMap[pId] = { totalQuantity: 0, saleDaysCount: 0, dates: new Set() };
          }
          productSalesMap[pId].totalQuantity += item.quantity;
          if (sale.createdAt) {
            const dateStr = new Date(sale.createdAt).toISOString().split('T')[0];
            productSalesMap[pId].dates.add(dateStr);
          }
        }
      });
    });

    // Resolve Set sizes
    Object.keys(productSalesMap).forEach((pId) => {
      productSalesMap[pId].saleDaysCount = productSalesMap[pId].dates.size;
    });

    // Try Gemini forecasting first if API key is present
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && products.length > 0) {
      try {
        const storeName = req.user?.storeId?.name || 'the Store';
        const productsListText = products.map(p => {
          const salesInfo = productSalesMap[p._id.toString()] || { totalQuantity: 0, saleDaysCount: 0 };
          return `- ID: ${p._id} | Name: ${p.name} | SKU: ${p.sku} | Current Stock: ${p.currentStock} | Min Threshold: ${p.minStockThreshold || 10} | Sales in 30 Days: ${salesInfo.totalQuantity} units sold over ${salesInfo.saleDaysCount} days`;
        }).join('\n');

        const prompt = `
You are SIBIS AI, the demand forecasting engine for "${storeName}".
Analyze the current stock levels and 30-day sales history for the following products:

Product List:
${productsListText}

Forecast the weekly (7-day) demand for each product. 
Trigger a reorder recommendation if:
1. Current Stock <= Min Threshold OR
2. Current Stock < 7-day Predicted Demand

For each triggered recommendation, calculate a suggested reorder quantity (predicted weekly demand - current stock + min stock threshold, rounded up and at least equal to min stock threshold).

You MUST output your response strictly as a JSON array of objects matching this exact structure:
[
  {
    "id": "product_id_string",
    "product": "product_name_string",
    "currentStock": number,
    "predictedDemand": number,
    "suggestion": "Detailed friendly recommendation text explaining why and how much to order"
  }
]

Do not return any extra fields, explanations, or Markdown blocks. Return only a raw JSON array.
        `.trim();

        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            contents: [
              {
                role: 'user',
                parts: [{ text: prompt }]
              }
            ],
            generationConfig: {
              responseMimeType: 'application/json'
            }
          },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 12000
          }
        );

        if (response.data && response.data.candidates && response.data.candidates[0].content) {
          const text = response.data.candidates[0].content.parts[0].text.trim();
          const recommendations = JSON.parse(text);
          if (Array.isArray(recommendations)) {
            return res.status(200).json(recommendations);
          }
        }
      } catch (geminiError) {
        console.error('Gemini forecasting failed. Falling back to local Node.js logic:', geminiError.message);
      }
    }

    // Fallback local calculations
    const recommendations = [];

    products.forEach((product) => {
      const pId = product._id.toString();
      const salesInfo = productSalesMap[pId] || { totalQuantity: 0 };
      const avgDailySales = salesInfo.totalQuantity / 30;
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
    let insights = [];

    try {
      // Try to fetch insights from Python AI service
      const response = await axios.get(`${aiServiceUrl}/ai/insights`, {
        params: storeId ? { store_id: storeId } : {}
      });
      insights = response.data;
    } catch (aiError) {
      console.error('Python AI service failed/offline. Falling back to local Node.js insights:', aiError.message);

      // Fallback local calculations
      const filter = {};
      if (storeId) {
        filter.storeId = storeId;
      }

      const products = await Product.find(filter);
      const sales = await Sale.find(filter);

      if (products.length === 0) {
        insights = [
          {
            id: 'no-products',
            type: 'info',
            message: 'No products added yet. Add inventory products to start receiving real-time business insights.',
            icon: 'Package',
            color: 'text-indigo-500 bg-indigo-500/10 dark:text-indigo-400 dark:bg-indigo-950/30',
          },
        ];
      } else {
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
      }
    }

    // Now call Gemini to generate a summary if API key exists and there are insights
    let summary = '';
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && insights.length > 0) {
      try {
        const insightsListText = insights.map(i => `- ${i.message}`).join('\n');
        const storeName = req.user?.storeId?.name || 'the store';
        
        const prompt = `
You are SIBIS AI, the smart retail business advisor for "${storeName}".
Below is a list of raw daily insights and alerts calculated from the store's inventory and sales:
${insightsListText}

Write a professional, encouraging, and highly concise daily executive summary (2-3 short sentences max) for the store owner.
It should feel like a personal business consultant speaking. Highlight the most critical action to take (like restocking, low stock warnings, or key sales milestones) and recommend a clear next step.
Do not use markdown formatting, bullet points, headers, or quotes. Keep it in plain text.
        `.trim();

        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            contents: [
              {
                role: 'user',
                parts: [{ text: prompt }]
              }
            ]
          },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 6000
          }
        );

        if (response.data && response.data.candidates && response.data.candidates[0].content) {
          summary = response.data.candidates[0].content.parts[0].text.trim();
        }
      } catch (geminiError) {
        console.error('Gemini insights generation failed:', geminiError.message);
      }
    }

    return res.status(200).json({ summary, insights });
  } catch (error) {
    next(error);
  }
};

// @desc    Chat with SIBIS AI Advisor chatbot using Gemini API contextually
// @route   POST /api/ai/chat
// @access  Public (Filtered by storeId)
// Helper to generate dynamic, business-impacting external factors (weather, holidays, market issues)
const getMarketFactors = (products, sales) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // 1. Weather awareness (Dhaka, Bangladesh context)
  let weather = "";
  if (currentMonth >= 5 && currentMonth <= 8) {
    weather = "Monsoon Season: Heavy rainfall and thunderstorm warnings in Dhaka. Local waterlogging may temporarily reduce physical store foot traffic by 15-20%, but increases home delivery and grocery essential demand.";
  } else if (currentMonth >= 9 && currentMonth <= 10) {
    weather = "Autumn: Mild weather with pleasant shopping conditions. Standard, steady retail foot traffic expected.";
  } else if (currentMonth >= 11 || currentMonth <= 1) {
    weather = "Winter: Cool and dry weather in Dhaka. Excellent shopping conditions. High evening foot traffic. Peak sales season for winter apparel, hot beverages, and fresh winter vegetables.";
  } else {
    weather = "Summer / Pre-monsoon: Extreme heatwave warnings in Dhaka with temperatures reaching 38-40°C. Foot traffic expected to drop during mid-day (12 PM - 4 PM) but peak in late evenings. Increased demand for cold beverages, ice creams, and fresh fruits.";
  }

  // 2. Upcoming Bangladesh Holidays & Festivals (within next 60 days)
  const eventsList = [
    { name: "Durga Puja", date: new Date(currentYear, 9, 20), impact: "Major shopping festival. High demand for clothing, sweets, gifts, and premium groceries." },
    { name: "Victory Day", date: new Date(currentYear, 11, 16), impact: "Public holiday. Expected high weekend-like grocery shopping volume." },
    { name: "New Year's Eve / Day", date: new Date(currentYear, 11, 31), impact: "Year-end celebrations. High demand for party items, beverages, snacks, and meat products." },
    { name: "International Mother Language Day", date: new Date(currentYear + (currentMonth > 1 ? 1 : 0), 1, 21), impact: "National holiday. Lower commercial activity, but local neighborhood stores see normal retail demand." },
    { name: "Independence Day", date: new Date(currentYear + (currentMonth > 2 ? 1 : 0), 2, 26), impact: "National holiday. Standard holiday sales volume." },
    { name: "Eid-ul-Fitr (Expected)", date: new Date(currentYear + (currentMonth > 2 ? 1 : 0), 2, 20), impact: "Biggest retail festival. Massive spike in demand for clothes, premium groceries (semai, sugar, milk, meat), spices, and gift items starting 2 weeks prior." }
  ];

  const upcomingEvents = eventsList
    .filter(e => {
      const diffTime = e.date - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 60;
    })
    .map(e => `* **${e.name}** (${e.date.toLocaleDateString()}): ${e.impact}`);

  const upcomingEventsStr = upcomingEvents.length > 0 
    ? upcomingEvents.join('\n') 
    : "* No major holidays or festivals in the next 60 days.";

  // 3. Market Issues & Supply Chain Alerts
  const marketAlerts = [
    "* **Supply Chain Alert**: Global shipping freight rates have increased, leading to a 10-15% wholesale price increase on imported goods (especially imported dairy, premium chocolates, and cosmetics).",
    "* **Local Logistics**: Dhaka-Chittagong highway road maintenance is causing minor cargo delays of 12-24 hours for fresh produce deliveries.",
    "* **Inflation Alert**: Local onion and potato prices are showing high volatility due to seasonal supply transition."
  ].join('\n');

  // 4. Critical Store Expiries and Reorder warnings
  const lowStock = products.filter(p => p.currentStock <= p.minStockThreshold);
  const outOfStock = products.filter(p => p.currentStock <= 0);

  const expDateThreshold = new Date();
  expDateThreshold.setDate(expDateThreshold.getDate() + 30); // next 30 days
  const expiringSoon = products.filter(p => p.expirationDate && new Date(p.expirationDate) <= expDateThreshold);

  const storeAlerts = [];
  if (lowStock.length > 0) {
    storeAlerts.push(`* **Low Stock Warning**: ${lowStock.length} items running low, including: ${lowStock.slice(0, 3).map(p => p.name).join(', ')}.`);
  }
  if (outOfStock.length > 0) {
    storeAlerts.push(`* **Stockout Alert**: ${outOfStock.length} items sold out, including: ${outOfStock.slice(0, 3).map(p => p.name).join(', ')}.`);
  }
  if (expiringSoon.length > 0) {
    storeAlerts.push(`* **Expiry Alert**: ${expiringSoon.length} items expiring in the next 30 days, including: ${expiringSoon.slice(0, 3).map(p => p.name).join(', ')}.`);
  }
  const storeAlertsStr = storeAlerts.length > 0 ? storeAlerts.join('\n') : "* All store inventory levels are healthy. No near-term expirations.";

  return {
    weather,
    upcomingEventsStr,
    marketAlerts,
    storeAlertsStr
  };
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

    // Gather Market Factors
    const factors = getMarketFactors(products, sales);

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

External Factors & Market Conditions:
- Weather: ${factors.weather}
- Upcoming Holidays/Events:
${factors.upcomingEventsStr}
- Market & Supply Chain Conditions:
${factors.marketAlerts}
- Near-term Store Expiry/Stock alerts:
${factors.storeAlertsStr}

User Query: "${message}"

You are SIBIS AI, a smart assistant and business decision support system for retail store owners.
Provide concise, clear, and actionable retail advice using the store context and external factors above. Be professional, friendly, and output your response in Markdown format. Keep it within 3-4 short paragraphs.
        `.trim();

        formattedContents.push({
          role: 'user',
          parts: [{ text: prompt }]
        });

        // Call Gemini REST API with search grounding enabled
        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            contents: formattedContents,
            tools: [
              {
                google_search: {}
              }
            ]
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
    } else if (query.includes('weather') || query.includes('rain') || query.includes('forecast') || query.includes('temp') || query.includes('season')) {
      reply += `### 🌤️ Weather & Foot Traffic Analysis\n`;
      reply += `${factors.weather}\n\n`;
      reply += `*Recommendation: Consider adjusting daily fresh food orders and promoting online/home-delivery options during heavy rain days.*`;
    } else if (query.includes('event') || query.includes('holiday') || query.includes('festival') || query.includes('eid') || query.includes('puja') || query.includes('upcoming') || query.includes('calendar')) {
      reply += `### 📅 Upcoming Business & Calendar Events\n`;
      reply += `Here are the key events and holidays in the next 60 days that could affect sales or operations:\n\n`;
      reply += `${factors.upcomingEventsStr}\n\n`;
      reply += `\n*Inventory Alerts Impacting Operations*:\n`;
      reply += `${factors.storeAlertsStr}\n\n`;
      reply += `*Recommendation: Stock up on high-demand holiday goods at least 2 weeks in advance to maximize festival revenue.*`;
    } else if (query.includes('issue') || query.includes('market') || query.includes('strike') || query.includes('supply') || query.includes('inflation') || query.includes('news')) {
      reply += `### ⚠️ Market Alerts & Supply Chain Issues\n`;
      reply += `Here are current external market conditions affecting retail businesses in Dhaka:\n\n`;
      reply += `${factors.marketAlerts}\n\n`;
      reply += `*Recommendation: Engage alternative local suppliers for imported items to mitigate price shocks and maintain steady stock levels.*`;
    } else {
      reply += `I can help you monitor inventory, track low stock, audit recent sales, assess weather impacts, review upcoming market events, and identify supply chain issues.\n\n`;
      reply += `Here are some things you can ask me:\n`;
      reply += `* *"Check my low stock products"* \n`;
      reply += `* *"How are our sales performing?"* \n`;
      reply += `* *"Are there any upcoming holidays or events?"* \n`;
      reply += `* *"What are the current weather conditions in Dhaka?"* \n`;
      reply += `* *"Are there any supply chain or market issues?"*`;
    }

    return res.status(200).json({ response: reply });
  } catch (error) {
    next(error);
  }
};
