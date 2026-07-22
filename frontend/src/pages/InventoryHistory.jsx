import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { 
  ClipboardList, 
  Search, 
  RefreshCw, 
  Clock, 
  User, 
  ArrowUpRight, 
  ArrowDownRight, 
  FileSpreadsheet, 
  Printer, 
  Info,
  Calendar
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const InventoryHistory = () => {
  const { currentUser } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await API.get('/products/inventory-history');
      setLogs(res.data);
    } catch (err) {
      console.error('Failed to load inventory history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const changeTypeStyles = {
    'Sale': 'bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400',
    'Purchase': 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400',
    'Stock In': 'bg-teal-500/10 text-teal-600 border-teal-500/20 dark:text-teal-400',
    'Stock Out': 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400',
    'Manual Adjustment': 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:text-indigo-400',
  };

  const filteredLogs = logs.filter((log) => {
    if (!log) return false;
    const matchesSearch = 
      (log.productId?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.productId?.sku || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.notes || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.performedBy?.name || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === 'All' || log.changeType === typeFilter;

    return matchesSearch && matchesType;
  });

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;
    
    const headers = ['Timestamp', 'Product Name', 'SKU', 'Change Type', 'Quantity Changed', 'Previous Stock', 'New Stock', 'Performed By', 'Notes'];
    const rows = filteredLogs.map(log => [
      new Date(log.createdAt).toLocaleString(),
      log.productId?.name || 'Unknown Item',
      log.productId?.sku || '',
      log.changeType,
      log.quantityChanged,
      log.previousStock,
      log.newStock,
      log.performedBy?.name || 'System',
      log.notes || ''
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sibis_inventory_history_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-[fade-in_0.3s_ease-out]">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-500/20">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Inventory History & Stock Log
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
              Complete historical stream of product inventory changes for audit and tracing.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportCSV}
            disabled={filteredLogs.length === 0}
            className="px-4.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 dark:hover:bg-slate-800 border border-slate-200 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-4.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 dark:hover:bg-slate-800 border border-slate-200 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-sm cursor-pointer transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
          <button
            onClick={fetchHistory}
            className="px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-md shadow-indigo-600/10 cursor-pointer transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by product name, SKU, user, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-2 self-start md:self-auto overflow-x-auto max-w-full">
          {['All', 'Sale', 'Purchase', 'Stock In', 'Stock Out', 'Manual Adjustment'].map((cat) => (
            <button
              key={cat}
              onClick={() => setTypeFilter(cat)}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                typeFilter === cat
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-20 text-slate-400 font-semibold animate-pulse">
            Retrieving inventory history records...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-20 text-slate-400 font-bold uppercase tracking-wider">
            No inventory log history found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-200/40 dark:border-slate-850/40 text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
                  <th className="py-4 px-6">Timestamp</th>
                  <th className="py-4 px-6">Product Details</th>
                  <th className="py-4 px-6">Change Type</th>
                  <th className="py-4 px-6 text-center">Movement</th>
                  <th className="py-4 px-6 text-center">Previous Stock</th>
                  <th className="py-4 px-6 text-center">New Stock</th>
                  <th className="py-4 px-6">User / Agent</th>
                  <th className="py-4 px-6">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs">
                {filteredLogs.map((log) => {
                  const dateStr = new Date(log.createdAt).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  const isPositive = log.quantityChanged > 0;
                  const BadgeClass = changeTypeStyles[log.changeType] || 'bg-slate-100 text-slate-700';

                  return (
                    <tr key={log._id} className="hover:bg-slate-50/30 dark:hover:bg-slate-950/10 transition-colors">
                      <td className="py-4.5 px-6 font-semibold text-slate-400 whitespace-nowrap">
                        <span className="flex items-center">
                          <Calendar className="w-3.5 h-3.5 mr-1.5 opacity-60" />
                          {dateStr}
                        </span>
                      </td>
                      <td className="py-4.5 px-6">
                        <p className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">
                          {log.productId?.name || 'Deleted Product'}
                        </p>
                        <p className="text-[10px] text-slate-450 dark:text-slate-500 font-mono mt-0.5">
                          SKU: {log.productId?.sku || 'N/A'}
                        </p>
                      </td>
                      <td className="py-4.5 px-6 whitespace-nowrap">
                        <span className={`text-[9px] px-2.5 py-0.5 rounded-lg border font-black tracking-wider ${BadgeClass}`}>
                          {log.changeType}
                        </span>
                      </td>
                      <td className="py-4.5 px-6 text-center font-black text-sm whitespace-nowrap">
                        <span className={`flex items-center justify-center font-black ${
                          isPositive ? 'text-emerald-500' : 'text-rose-500'
                        }`}>
                          {isPositive ? (
                            <ArrowUpRight className="w-4 h-4 mr-0.5" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4 mr-0.5" />
                          )}
                          {isPositive ? `+${log.quantityChanged}` : log.quantityChanged}
                        </span>
                      </td>
                      <td className="py-4.5 px-6 text-center font-bold text-slate-500 dark:text-slate-400">
                        {log.previousStock} units
                      </td>
                      <td className="py-4.5 px-6 text-center font-extrabold text-slate-800 dark:text-slate-200">
                        {log.newStock} units
                      </td>
                      <td className="py-4.5 px-6 font-bold text-slate-700 dark:text-slate-300">
                        <span className="flex items-center">
                          <User className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                          {log.performedBy?.name || 'System Process'}
                        </span>
                      </td>
                      <td className="py-4.5 px-6 text-slate-500 dark:text-slate-400 font-medium">
                        {log.notes || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryHistory;
