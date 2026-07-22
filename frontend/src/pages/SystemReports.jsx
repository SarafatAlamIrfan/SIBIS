import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { 
  BarChart3, 
  RefreshCw, 
  FileText, 
  DollarSign, 
  Package, 
  ArrowUpRight, 
  Printer, 
  Download, 
  Calendar,
  Layers,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SystemReports = () => {
  const { currentUser } = useAuth();
  const [reportType, setReportType] = useState('sales');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  
  // States to hold report data
  const [salesData, setSalesData] = useState({
    totalRevenue: 0,
    totalProfit: 0,
    salesCount: 0,
    averageTicket: 0,
    byPaymentMethod: {},
    transactions: []
  });

  const [inventoryData, setInventoryData] = useState({
    totalItems: 0,
    totalStockCount: 0,
    valuationCost: 0,
    valuationRetail: 0,
    potentialProfit: 0,
    lowStockCount: 0,
    outOfStockCount: 0
  });

  const [profitabilityData, setProfitabilityData] = useState([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsRes, salesRes] = await Promise.all([
        API.get('/products'),
        API.get('/sales')
      ]);

      const productList = productsRes.data || [];
      const salesList = salesRes.data || [];

      setProducts(productList);
      setSales(salesList);

      // 1. Compute Sales Report
      let revenue = 0;
      let profit = 0;
      const paymentBreakdown = { Cash: 0, Card: 0, 'Mobile Pay': 0 };
      
      salesList.forEach(sale => {
        revenue += sale.totalAmount;
        paymentBreakdown[sale.paymentMethod] = (paymentBreakdown[sale.paymentMethod] || 0) + sale.totalAmount;
        
        // Deduct cost from items to find profit
        sale.items.forEach(item => {
          const qty = item.quantity;
          const cost = item.purchasePriceAtSale || 0;
          const price = item.priceAtSale || 0;
          profit += (price - cost) * qty;
        });
      });

      setSalesData({
        totalRevenue: revenue,
        totalProfit: profit,
        salesCount: salesList.length,
        averageTicket: salesList.length ? (revenue / salesList.length) : 0,
        byPaymentMethod: paymentBreakdown,
        transactions: salesList
      });

      // 2. Compute Inventory Report
      let totalStock = 0;
      let costValue = 0;
      let retailValue = 0;
      let lowStock = 0;
      let outOfStock = 0;

      productList.forEach(p => {
        totalStock += p.currentStock;
        costValue += p.currentStock * p.purchasePrice;
        retailValue += p.currentStock * p.sellingPrice;
        
        if (p.currentStock <= p.minStockThreshold) lowStock++;
        if (p.currentStock <= 0) outOfStock++;
      });

      setInventoryData({
        totalItems: productList.length,
        totalStockCount: totalStock,
        valuationCost: costValue,
        valuationRetail: retailValue,
        potentialProfit: retailValue - costValue,
        lowStockCount: lowStock,
        outOfStockCount: outOfStock
      });

      // 3. Compute Profitability Report
      // Map sales qty per product
      const productQtyMap = {};
      salesList.forEach(sale => {
        sale.items.forEach(item => {
          const pId = item.productId?.toString();
          if (pId) {
            productQtyMap[pId] = (productQtyMap[pId] || 0) + item.quantity;
          }
        });
      });

      const profits = productList.map(p => {
        const margin = p.sellingPrice - p.purchasePrice;
        const marginPct = p.purchasePrice ? ((margin / p.purchasePrice) * 100) : 0;
        const totalSold = productQtyMap[p._id.toString()] || 0;
        const totalRevenue = totalSold * p.sellingPrice;
        const totalProfit = totalSold * margin;

        return {
          id: p._id,
          name: p.name,
          sku: p.sku,
          margin,
          marginPct,
          totalSold,
          totalRevenue,
          totalProfit
        };
      }).sort((a, b) => b.totalProfit - a.totalProfit);

      setProfitabilityData(profits);

    } catch (err) {
      console.error('Failed to load report data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExportCSV = () => {
    let headers = [];
    let rows = [];
    let filename = `sibis_report_${reportType}.csv`;

    if (reportType === 'sales') {
      headers = ['Invoice Number', 'Timestamp', 'Cashier ID', 'Payment Method', 'Payment Status', 'Total Amount'];
      rows = salesData.transactions.map(s => [
        s.invoiceNumber,
        new Date(s.createdAt).toLocaleString(),
        s.cashierId || '',
        s.paymentMethod,
        s.paymentStatus,
        s.totalAmount
      ]);
    } else if (reportType === 'inventory') {
      headers = ['Product Name', 'SKU', 'Category', 'Brand', 'Purchase Cost', 'Selling Price', 'Current Stock', 'Stock Value (Cost)', 'Stock Value (Retail)'];
      rows = products.map(p => [
        p.name,
        p.sku,
        p.category,
        p.brand || '',
        p.purchasePrice,
        p.sellingPrice,
        p.currentStock,
        p.currentStock * p.purchasePrice,
        p.currentStock * p.sellingPrice
      ]);
    } else {
      headers = ['Product Name', 'SKU', 'Margin Per Unit', 'Markup %', 'Units Sold', 'Total Revenue', 'Total Profit'];
      rows = profitabilityData.map(p => [
        p.name,
        p.sku,
        p.margin.toFixed(2),
        p.marginPct.toFixed(1) + '%',
        p.totalSold,
        p.totalRevenue.toFixed(2),
        p.totalProfit.toFixed(2)
      ]);
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-[fade-in_0.3s_ease-out]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-500/20">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              System Audit & Business Reports
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
              Generate store summaries, calculate profit margins, and export financial audit logs.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 print:hidden">
          <button
            onClick={handleExportCSV}
            className="px-4.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 dark:hover:bg-slate-800 border border-slate-200 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-4.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 dark:hover:bg-slate-800 border border-slate-200 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
          <button
            onClick={loadData}
            className="px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-md shadow-indigo-600/10 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-3xl shadow-sm flex space-x-2 print:hidden overflow-x-auto">
        {[
          { id: 'sales', name: 'Sales Performance', icon: DollarSign },
          { id: 'inventory', name: 'Inventory Assets', icon: Package },
          { id: 'profitability', name: 'Margin Profitability', icon: Layers }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id)}
              className={`px-4.5 py-3 rounded-2xl text-xs font-extrabold flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
                reportType === tab.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-950/25 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* Main Report View */}
      {loading ? (
        <div className="text-center py-24 text-slate-400 font-semibold animate-pulse">
          Compiling business database metrics...
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* SALES PERFORMANCE REPORT VIEW */}
          {reportType === 'sales' && (
            <>
              {/* Sales Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { title: 'Total Sales Revenue', value: `৳${salesData.totalRevenue.toFixed(2)}`, desc: 'Gross transactional income', color: 'text-indigo-600 bg-indigo-500/10 dark:text-indigo-400 border-indigo-500/20' },
                  { title: 'Cumulative Profit Margin', value: `৳${salesData.totalProfit.toFixed(2)}`, desc: 'Estimated margins return', color: 'text-emerald-600 bg-emerald-500/10 dark:text-emerald-400 border-emerald-500/20' },
                  { title: 'Total Transactions', value: salesData.salesCount, desc: 'Receipts count', color: 'text-purple-600 bg-purple-500/10 dark:text-purple-400 border-purple-500/20' },
                  { title: 'Average Ticket Value', value: `৳${salesData.averageTicket.toFixed(2)}`, desc: 'Receipt purchase average', color: 'text-amber-600 bg-amber-500/10 dark:text-amber-400 border-amber-500/20' },
                ].map((card, idx) => (
                  <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">{card.title}</p>
                      <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight mt-1">{card.value}</h3>
                    </div>
                    <span className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold mt-3 block">{card.desc}</span>
                  </div>
                ))}
              </div>

              {/* Transactions List */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="font-extrabold text-base text-slate-950 dark:text-white">Transaction Audit log</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-200/40 dark:border-slate-850/40 text-[9px] uppercase tracking-wider font-extrabold text-slate-400">
                        <th className="py-3 px-4">Invoice Number</th>
                        <th className="py-3 px-4">Timestamp</th>
                        <th className="py-3 px-4">Payment Method</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs">
                      {salesData.transactions.map((s) => (
                        <tr key={s._id} className="hover:bg-slate-50/30 dark:hover:bg-slate-950/10 transition-colors">
                          <td className="py-3.5 px-4 font-extrabold text-slate-800 dark:text-slate-200 font-mono">{s.invoiceNumber}</td>
                          <td className="py-3.5 px-4 text-slate-400 font-semibold">{new Date(s.createdAt).toLocaleString()}</td>
                          <td className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-350">{s.paymentMethod}</td>
                          <td className="py-3.5 px-4">
                            <span className="text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md">
                              {s.paymentStatus}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-black text-slate-900 dark:text-white text-sm">৳{s.totalAmount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* INVENTORY VALUATION VIEW */}
          {reportType === 'inventory' && (
            <>
              {/* Inventory metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { title: 'Current Stock Count', value: `${inventoryData.totalStockCount} units`, desc: `Across ${inventoryData.totalItems} distinct items` },
                  { title: 'Total Asset Cost', value: `৳${inventoryData.valuationCost.toFixed(2)}`, desc: 'Valuation at procurement cost' },
                  { title: 'Potential Retail Value', value: `৳${inventoryData.valuationRetail.toFixed(2)}`, desc: 'Valuation at shelf price' },
                  { title: 'Expected Gross Margin', value: `৳${inventoryData.potentialProfit.toFixed(2)}`, desc: 'Valuation profit potential' },
                ].map((card, idx) => (
                  <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">{card.title}</p>
                      <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight mt-1">{card.value}</h3>
                    </div>
                    <span className="text-[10px] text-slate-455 dark:text-slate-500 font-semibold mt-3 block">{card.desc}</span>
                  </div>
                ))}
              </div>

              {/* Alert items summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-3">
                  <h4 className="font-extrabold text-sm text-slate-850 dark:text-white flex items-center">
                    <span className="w-2 h-2 rounded-full bg-amber-500 mr-2 animate-pulse"></span>
                    Low Stock Products ({inventoryData.lowStockCount} items)
                  </h4>
                  <p className="text-xs text-slate-450 dark:text-slate-500 font-semibold">Listing products with stock levels at or below safety thresholds.</p>
                  <div className="max-h-60 overflow-y-auto pr-2 divide-y divide-slate-100 dark:divide-slate-800/40 text-xs">
                    {products.filter(p => p.currentStock <= p.minStockThreshold).map(p => (
                      <div key={p._id} className="py-2.5 flex justify-between">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{p.name}</span>
                        <span className="font-extrabold text-rose-500">{p.currentStock} units / threshold: {p.minStockThreshold}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-3">
                  <h4 className="font-extrabold text-sm text-slate-850 dark:text-white flex items-center">
                    <span className="w-2 h-2 rounded-full bg-rose-500 mr-2"></span>
                    Out of Stock Products ({inventoryData.outOfStockCount} items)
                  </h4>
                  <p className="text-xs text-slate-450 dark:text-slate-500 font-semibold">Items currently unavailable with zero units in stock.</p>
                  <div className="max-h-60 overflow-y-auto pr-2 divide-y divide-slate-100 dark:divide-slate-800/40 text-xs">
                    {products.filter(p => p.currentStock <= 0).map(p => (
                      <div key={p._id} className="py-2.5 flex justify-between">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{p.name}</span>
                        <span className="font-mono text-rose-600 bg-rose-500/10 dark:text-rose-450 px-2 py-0.5 rounded text-[10px] font-black uppercase">Out of Stock</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* MARGIN PROFITABILITY LEADERBOARD VIEW */}
          {reportType === 'profitability' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-4.5">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl text-white shadow-md">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-950 dark:text-white">Margin Profitability Leaderboard</h3>
                  <p className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider">Ranked by total profit generated from sales</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-200/40 dark:border-slate-850/40 text-[9px] uppercase tracking-wider font-extrabold text-slate-400">
                      <th className="py-3 px-4">Product Name</th>
                      <th className="py-3 px-4 text-center">Unit Margin</th>
                      <th className="py-3 px-4 text-center">Markup %</th>
                      <th className="py-3 px-4 text-center">Total Units Sold</th>
                      <th className="py-3 px-4 text-right">Total Revenue</th>
                      <th className="py-3 px-4 text-right">Net Profit Contribution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs">
                    {profitabilityData.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-950/10 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">
                          <p className="font-extrabold text-sm">{p.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">SKU: {p.sku}</p>
                        </td>
                        <td className="py-3.5 px-4 text-center font-extrabold text-slate-700 dark:text-slate-350">৳{p.margin.toFixed(2)}</td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-500 dark:text-slate-400">{p.marginPct.toFixed(1)}%</td>
                        <td className="py-3.5 px-4 text-center font-extrabold text-slate-900 dark:text-white text-sm">{p.totalSold} units</td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-600 dark:text-slate-400">৳{p.totalRevenue.toFixed(2)}</td>
                        <td className="py-3.5 px-4 text-right font-black text-emerald-500 text-sm">৳{p.totalProfit.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SystemReports;
