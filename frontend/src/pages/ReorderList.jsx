import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  ShoppingBag, 
  Plus, 
  Trash2, 
  Truck, 
  Check, 
  AlertTriangle, 
  ArrowRight,
  RefreshCw,
  Layers,
  Sparkles
} from 'lucide-react';

const ReorderList = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [reorderItems, setReorderItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  // Load saved reorder list from localStorage & fetch latest DB product data
  const loadData = async () => {
    try {
      setLoading(true);
      const [prodRes, supRes] = await Promise.all([
        API.get('/products'),
        API.get('/suppliers'),
      ]);

      const allProducts = prodRes.data;
      setProducts(allProducts);
      setSuppliers(supRes.data.filter(s => s.status === 'Active'));

      // Retrieve saved raw items from localStorage: array of { productId, quantityOrdered }
      const savedListRaw = JSON.parse(localStorage.getItem('sibis_reorder_list') || '[]');
      
      // Match with live product data
      const mergedItems = savedListRaw.map((saved) => {
        const prod = allProducts.find(p => p._id === saved.productId);
        if (!prod) return null;
        return {
          productId: prod._id,
          product: prod,
          quantityOrdered: saved.quantityOrdered || Math.max(10, (prod.minStockThreshold * 2) - prod.currentStock),
          purchasePrice: prod.purchasePrice,
        };
      }).filter(Boolean);

      setReorderItems(mergedItems);
      setSelectedItems(mergedItems.map(item => item.productId));
    } catch (err) {
      console.error('Failed to load Reorder List data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Save current reorder items to localStorage
  const persistReorderItems = (items) => {
    setReorderItems(items);
    const rawList = items.map(item => ({
      productId: item.productId,
      quantityOrdered: item.quantityOrdered,
    }));
    localStorage.setItem('sibis_reorder_list', JSON.stringify(rawList));
  };

  // Add all low stock items automatically to the reorder list
  const handleAddAllLowStock = () => {
    const lowStockProducts = products.filter(p => p.currentStock <= p.minStockThreshold);
    if (lowStockProducts.length === 0) {
      setMessage({ type: 'info', text: 'No low-stock items detected in inventory.' });
      return;
    }

    const existingIds = new Set(reorderItems.map(item => item.productId));
    const newItems = [...reorderItems];

    lowStockProducts.forEach(prod => {
      if (!existingIds.has(prod._id)) {
        const suggestedQty = Math.max(10, (prod.minStockThreshold * 2) - prod.currentStock);
        newItems.push({
          productId: prod._id,
          product: prod,
          quantityOrdered: suggestedQty,
          purchasePrice: prod.purchasePrice,
        });
      }
    });

    persistReorderItems(newItems);
    setSelectedItems(newItems.map(i => i.productId));
    setMessage({ type: 'success', text: `Added ${lowStockProducts.length} low-stock items to your reorder list!` });
  };

  // Remove single item
  const handleRemoveItem = (id) => {
    const updated = reorderItems.filter(item => item.productId !== id);
    persistReorderItems(updated);
    setSelectedItems(selectedItems.filter(itemId => itemId !== id));
  };

  // Clear entire list
  const handleClearList = () => {
    if (!window.confirm('Clear all queued items from your reorder list?')) return;
    persistReorderItems([]);
    setSelectedItems([]);
  };

  // Update item quantity
  const handleQtyChange = (id, newQty) => {
    const qty = Math.max(1, parseInt(newQty, 10) || 1);
    const updated = reorderItems.map(item => {
      if (item.productId === id) {
        return { ...item, quantityOrdered: qty };
      }
      return item;
    });
    persistReorderItems(updated);
  };

  // Toggle item selection checkbox
  const handleToggleSelect = (id) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(i => i !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedItems.length === reorderItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(reorderItems.map(i => i.productId));
    }
  };

  // Convert selected items into official Purchase Orders grouped by Supplier
  const handleGeneratePurchaseOrders = async () => {
    const itemsToOrder = reorderItems.filter(i => selectedItems.includes(i.productId));
    if (itemsToOrder.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one item to generate a Purchase Order.' });
      return;
    }

    try {
      setSubmitting(true);
      setMessage(null);

      // Group items by supplierId
      const groupedBySupplier = {};
      itemsToOrder.forEach(item => {
        const supId = item.product.supplierId?._id || item.product.supplierId;
        if (!supId) return;
        if (!groupedBySupplier[supId]) {
          groupedBySupplier[supId] = [];
        }
        groupedBySupplier[supId].push({
          productId: item.productId,
          quantityOrdered: item.quantityOrdered,
          purchasePrice: item.purchasePrice,
        });
      });

      const supplierIds = Object.keys(groupedBySupplier);
      if (supplierIds.length === 0) {
        setMessage({ type: 'error', text: 'Selected products have no valid supplier assigned.' });
        return;
      }

      // Submit PO for each supplier group
      for (const supId of supplierIds) {
        await API.post('/purchase-orders', {
          supplierId: supId,
          items: groupedBySupplier[supId],
        });
      }

      // Remove ordered items from reorder list
      const remainingItems = reorderItems.filter(i => !selectedItems.includes(i.productId));
      persistReorderItems(remainingItems);
      setSelectedItems(remainingItems.map(i => i.productId));

      // Redirect to Purchase Orders with success notice
      navigate('/purchase-orders');
    } catch (err) {
      console.error('Failed to generate POs:', err);
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to place Purchase Orders.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate totals
  const activeReorderItems = reorderItems.filter(i => selectedItems.includes(i.productId));
  const totalCost = activeReorderItems.reduce((sum, item) => sum + (item.purchasePrice * item.quantityOrdered), 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 dark:text-slate-500 font-semibold text-xs tracking-wider animate-pulse">LOADING REORDER LIST...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-[pulse-subtle_2s_ease-out_1]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center space-x-2">
            <span>Reorder List & Planner</span>
            <span className="text-xs bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-extrabold px-3 py-1 rounded-full border border-indigo-200/20">
              {reorderItems.length} queued
            </span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">
            Draft items to order from suppliers before generating official Purchase Orders.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleAddAllLowStock}
            className="px-4 py-3 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 border border-amber-200/40 dark:border-amber-900/50 font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center transform active:scale-97"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Auto-Add Low Stock Items
          </button>
          
          <Link
            to="/products"
            className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Browse Products
          </Link>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl border text-xs font-bold flex justify-between items-center ${
          message.type === 'error' 
            ? 'bg-rose-950/60 border-rose-800 text-rose-200' 
            : message.type === 'success'
            ? 'bg-emerald-950/60 border-emerald-800 text-emerald-200'
            : 'bg-indigo-950/60 border-indigo-800 text-indigo-200'
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-current opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Main Table View */}
      <div className="glass-panel border border-slate-200/40 dark:border-slate-800/40 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between">
          <div className="flex items-center space-x-3 text-xs">
            <input 
              type="checkbox"
              checked={reorderItems.length > 0 && selectedItems.length === reorderItems.length}
              onChange={handleSelectAll}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
            />
            <span className="font-bold text-slate-700 dark:text-slate-300">
              Select All ({selectedItems.length}/{reorderItems.length} selected)
            </span>
          </div>

          {reorderItems.length > 0 && (
            <button
              onClick={handleClearList}
              className="text-xs text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 font-bold flex items-center space-x-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Reorder List</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50/50 border-b border-slate-200/40 text-slate-405 uppercase font-bold tracking-wider dark:bg-slate-950/40 dark:border-slate-850/40">
              <tr>
                <th className="px-6 py-4.5 w-12"></th>
                <th className="px-6 py-4.5">Product & SKU</th>
                <th className="px-6 py-4.5">Supplier</th>
                <th className="px-6 py-4.5">Current Stock Status</th>
                <th className="px-6 py-4.5">Order Quantity</th>
                <th className="px-6 py-4.5">Estimated Unit Cost</th>
                <th className="px-6 py-4.5">Line Total</th>
                <th className="px-6 py-4.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 dark:divide-slate-850">
              {reorderItems.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-20">
                    <div className="flex flex-col items-center space-y-3 max-w-sm mx-auto">
                      <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-full text-indigo-600 dark:text-indigo-400">
                        <ShoppingBag className="w-8 h-8" />
                      </div>
                      <h3 className="font-extrabold text-slate-800 dark:text-white text-base">Your Reorder List is Empty</h3>
                      <p className="text-xs text-slate-400 leading-relaxed font-medium">
                        Add products from the catalog or click "Auto-Add Low Stock Items" to quickly draft your purchase order.
                      </p>
                      <button
                        onClick={handleAddAllLowStock}
                        className="mt-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/20 cursor-pointer flex items-center"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Auto-Add Low Stock Items
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                reorderItems.map((item) => {
                  const prod = item.product;
                  const isSelected = selectedItems.includes(item.productId);
                  const isLowStock = prod.currentStock <= prod.minStockThreshold;
                  const lineTotal = item.purchasePrice * item.quantityOrdered;

                  return (
                    <tr 
                      key={item.productId}
                      className={`transition-colors ${isSelected ? 'bg-indigo-50/20 dark:bg-indigo-950/20' : 'hover:bg-slate-50/30 dark:hover:bg-slate-850/10'}`}
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(item.productId)}
                          className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="font-extrabold text-slate-850 dark:text-white text-sm leading-tight">{prod.name}</p>
                          <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded text-slate-500 border border-slate-200/20 dark:border-slate-850">
                            {prod.sku}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">
                        {prod.supplierId?.name || 'Unassigned Supplier'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1.5 text-xs font-bold">
                            <span className={isLowStock ? 'text-rose-500 animate-pulse' : 'text-slate-700 dark:text-slate-300'}>
                              {prod.currentStock} units
                            </span>
                            {isLowStock && (
                              <span className="text-[9px] bg-rose-500/10 text-rose-600 dark:text-rose-400 font-black px-1.5 py-0.5 rounded">
                                LOW
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400">Min threshold: {prod.minStockThreshold}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-1.5 w-32">
                          <button
                            onClick={() => handleQtyChange(item.productId, item.quantityOrdered - 1)}
                            className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center cursor-pointer"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.quantityOrdered}
                            onChange={(e) => handleQtyChange(item.productId, e.target.value)}
                            className="w-14 px-2 py-1 text-center font-bold border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:bg-slate-800 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                          <button
                            onClick={() => handleQtyChange(item.productId, item.quantityOrdered + 1)}
                            className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-650 dark:text-slate-350">
                        ৳{item.purchasePrice.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 font-black text-slate-850 dark:text-white text-sm">
                        ৳{lineTotal.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleRemoveItem(item.productId)}
                          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary & Purchase Order Conversion CTA */}
        {reorderItems.length > 0 && (
          <div className="p-6 bg-slate-50/80 dark:bg-slate-950/60 border-t border-slate-200/40 dark:border-slate-850 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-slate-600 dark:text-slate-400 text-xs">
              <p className="font-semibold">
                Selected for Order: <strong className="text-slate-900 dark:text-white font-extrabold">{activeReorderItems.length} items</strong>
              </p>
              <p className="text-[10px] text-slate-400">
                Purchase Orders will be automatically grouped by supplier upon generation.
              </p>
            </div>

            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Order Cost</p>
                <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">৳{totalCost.toFixed(2)}</p>
              </div>

              <button
                onClick={handleGeneratePurchaseOrders}
                disabled={submitting || activeReorderItems.length === 0}
                className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black rounded-2xl text-xs shadow-lg shadow-indigo-600/25 transition-all cursor-pointer flex items-center space-x-2 transform active:scale-97 border border-indigo-400/30 disabled:opacity-50"
              >
                <Truck className="w-4 h-4 stroke-[2.5]" />
                <span>{submitting ? 'Generating POs...' : 'Create Purchase Orders'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReorderList;
