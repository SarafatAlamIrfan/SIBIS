import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Plus,
  Edit3,
  Trash2,
  AlertTriangle,
  X,
  Check,
  Search,
  Tag,
  Archive,
  BarChart2,
  ShoppingBag,
  ArrowRight
} from 'lucide-react';

const Products = () => {
  const { currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const filterParam = searchParams.get('filter');

  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showLowStockOnly, setShowLowStockOnly] = useState(filterParam === 'low-stock');

  // Reorder List state
  const [reorderListIds, setReorderListIds] = useState(() => {
    const list = JSON.parse(localStorage.getItem('sibis_reorder_list') || '[]');
    return list.map(item => item.productId);
  });
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    if (filterParam === 'low-stock') {
      setShowLowStockOnly(true);
    }
  }, [filterParam]);

  const handleToggleReorder = (product) => {
    const list = JSON.parse(localStorage.getItem('sibis_reorder_list') || '[]');
    const exists = list.some(item => item.productId === product._id);

    let updated;
    if (exists) {
      updated = list.filter(item => item.productId !== product._id);
      setToastMessage({ type: 'info', text: `${product.name} removed from Reorder List.` });
    } else {
      const suggestedQty = Math.max(10, (product.minStockThreshold * 2) - product.currentStock);
      updated = [...list, { productId: product._id, quantityOrdered: suggestedQty }];
      setToastMessage({ type: 'success', text: `${product.name} added to Reorder List!`, link: '/reorder-list' });
    }

    localStorage.setItem('sibis_reorder_list', JSON.stringify(updated));
    setReorderListIds(updated.map(item => item.productId));

    // Auto dismiss toast after 4s
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    category: 'Grocery',
    brand: '',
    supplierId: '',
    purchasePrice: '',
    sellingPrice: '',
    currentStock: '0',
    minStockThreshold: '10',
    expirationDate: '',
  });
  const [formError, setFormError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodRes, supRes] = await Promise.all([
        API.get('/products'),
        API.get('/suppliers'),
      ]);
      setProducts(prodRes.data);
      setSuppliers(supRes.data.filter(s => s.status === 'Active'));
    } catch (err) {
      console.error('Failed to load products page data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: '',
      description: '',
      category: 'Grocery',
      brand: '',
      supplierId: suppliers[0]?._id || '',
      purchasePrice: '',
      sellingPrice: '',
      currentStock: '0',
      minStockThreshold: '10',
      expirationDate: '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      description: product.description || '',
      category: product.category,
      brand: product.brand || '',
      supplierId: product.supplierId?._id || product.supplierId || '',
      purchasePrice: product.purchasePrice.toString(),
      sellingPrice: product.sellingPrice.toString(),
      currentStock: product.currentStock.toString(),
      minStockThreshold: product.minStockThreshold.toString(),
      expirationDate: product.expirationDate ? product.expirationDate.split('T')[0] : '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const { name, sku, category, supplierId, purchasePrice, sellingPrice, currentStock, minStockThreshold } = formData;
    if (!name || !sku || !category || !supplierId || !purchasePrice || !sellingPrice || !currentStock || !minStockThreshold) {
      setFormError('Please fill in all required fields.');
      return;
    }

    const payload = {
      ...formData,
      purchasePrice: parseFloat(purchasePrice),
      sellingPrice: parseFloat(sellingPrice),
      currentStock: parseInt(currentStock, 10),
      minStockThreshold: parseInt(minStockThreshold, 10),
      expirationDate: formData.expirationDate || null,
    };

    try {
      if (editingProduct) {
        await API.put(`/products/${editingProduct._id}`, payload);
      } else {
        await API.post('/products', payload);
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to save product details.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await API.delete(`/products/${id}`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete product.');
    }
  };

  const categories = ['All', 'Grocery', 'Dairy', 'Pharmacy', 'Beverages', 'Snacks', 'Grains'];
  const lowStockCount = products.filter(p => p.currentStock <= p.minStockThreshold).length;

  // Filter products by category, low stock toggle, AND search query
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const isLowStock = p.currentStock <= p.minStockThreshold;
    const matchesLowStock = !showLowStockOnly || isLowStock;
    return matchesSearch && matchesCategory && matchesLowStock;
  });

  const getCategoryCount = (cat) => {
    if (cat === 'All') return products.length;
    return products.filter(p => p.category === cat).length;
  };

  const hasWriteAccess = ['Owner', 'Manager', 'Inventory Staff'].includes(currentUser.role);
  const hasDeleteAccess = ['Owner', 'Manager'].includes(currentUser.role);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 dark:text-slate-500 font-semibold text-xs tracking-wider animate-pulse">LOADING CATALOG...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-[pulse-subtle_2s_ease-out_1]">
      {/* Reorder List Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 p-4 rounded-2xl bg-slate-900/90 text-white dark:bg-white/90 dark:text-slate-900 shadow-2xl backdrop-blur-md border border-slate-700/50 dark:border-slate-200/50 flex items-center space-x-3 text-xs font-bold animate-[slide-in-right_0.3s_ease-out]">
          <span>{toastMessage.text}</span>
          {toastMessage.link && (
            <Link
              to={toastMessage.link}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors"
            >
              View List →
            </Link>
          )}
        </div>
      )}

      {/* Top Banner when items exist in Reorder List */}
      {reorderListIds.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/20 p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-bold text-indigo-700 dark:text-indigo-300">
            <ShoppingBag className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>{reorderListIds.length} product{reorderListIds.length > 1 ? 's' : ''} queued in your Reorder List</span>
          </div>
          <Link
            to="/reorder-list"
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center space-x-1 shadow-md shadow-indigo-600/15 transition-all transform active:scale-97"
          >
            <span>Review & Create Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Products & Stock</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">Manage catalog listings, prices, and monitor stock levels.</p>
        </div>
        {hasWriteAccess && (
          <button
            onClick={openAddModal}
            className="px-5 py-3 bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black rounded-2xl text-xs shadow-lg shadow-indigo-600/25 transition-all cursor-pointer flex items-center space-x-2 transform active:scale-97 border border-indigo-400/30"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Product</span>
          </button>
        )}
      </div>

      {/* Filter and Search Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/40 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm backdrop-blur-md">
        {/* Category pills & Low Stock Toggle */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-thin">
          <button
            onClick={() => {
              const nextState = !showLowStockOnly;
              setShowLowStockOnly(nextState);
              if (!nextState && filterParam === 'low-stock') {
                setSearchParams({});
              }
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 transform active:scale-97 border ${showLowStockOnly
                ? 'bg-rose-600 text-white border-rose-600 shadow-sm dark:bg-rose-500 dark:border-rose-500'
                : 'bg-white text-slate-700 border-slate-200/50 hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-400 dark:border-slate-800 hover:border-slate-300'
              }`}
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${showLowStockOnly ? 'text-white' : 'text-rose-500'}`} />
            <span>Low Stock Only</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-black ${showLowStockOnly ? 'bg-rose-700 text-white' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
              }`}>
              {lowStockCount}
            </span>
          </button>

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-1"></div>

          {categories.map((cat) => {
            const count = getCategoryCount(cat);
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 transform active:scale-97 border ${isActive
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm dark:bg-indigo-500 dark:border-indigo-500'
                    : 'bg-white text-slate-655 border-slate-200/50 hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-400 dark:border-slate-850 hover:border-slate-300'
                  }`}
              >
                <span>{cat}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-black ${isActive ? 'bg-indigo-700/80 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-550'
                  }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-405" />
          </div>
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-slate-805 bg-white placeholder-slate-405 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          />
        </div>
      </div>

      {/* Table view */}
      <div className="glass-panel border border-slate-200/40 dark:border-slate-800/40 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50/50 border-b border-slate-200/40 text-slate-405 uppercase font-bold tracking-wider dark:bg-slate-950/40 dark:border-slate-850/40">
              <tr>
                <th className="px-6 py-4.5">Product Details</th>
                <th className="px-6 py-4.5">SKU / Barcode</th>
                <th className="px-6 py-4.5">Category</th>
                <th className="px-6 py-4.5">Purchase / Sell Price</th>
                <th className="px-6 py-4.5">Stock Level Status</th>
                <th className="px-6 py-4.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 dark:divide-slate-850">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-16 text-slate-400 font-bold uppercase tracking-wider">
                    No products matching selection.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const isLowStock = product.currentStock <= product.minStockThreshold;
                  const stockPct = Math.min((product.currentStock / (product.minStockThreshold * 2 || 10)) * 100, 100);

                  return (
                    <tr key={product._id} className="hover:bg-slate-50/30 dark:hover:bg-slate-850/10 transition-colors">
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="font-extrabold text-slate-850 dark:text-white text-sm leading-tight">{product.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{product.brand || 'No Brand'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-950 px-2 py-1 rounded-md text-slate-500 border border-slate-200/20 dark:border-slate-850">
                          {product.sku}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-655 dark:text-slate-350">{product.category}</td>
                      <td className="px-6 py-4">
                        <div className="space-y-0.5 font-bold">
                          <p className="text-slate-400 dark:text-slate-500 text-[10px]">Cost: ৳{product.purchasePrice.toFixed(2)}</p>
                          <p className="text-slate-805 dark:text-slate-205 text-xs">Sell: <strong className="text-indigo-600 dark:text-indigo-400">৳{product.sellingPrice.toFixed(2)}</strong></p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1.5 w-44">
                          <div className="flex justify-between items-center text-[10px] font-bold">
                            <span className={isLowStock ? 'text-rose-500 animate-pulse' : 'text-slate-500'}>
                              {product.currentStock} units
                            </span>
                            <span className="text-slate-400">Min: {product.minStockThreshold}</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200/10">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${isLowStock
                                  ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]'
                                  : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                                }`}
                              style={{ width: `${stockPct}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right space-x-1.5">
                        {hasWriteAccess && (
                          <button
                            onClick={() => handleToggleReorder(product)}
                            title={reorderListIds.includes(product._id) ? "In Reorder List (Click to remove)" : "Add to Reorder List (+)"}
                            className={`p-2 rounded-xl transition-all cursor-pointer border ${reorderListIds.includes(product._id)
                                ? 'text-indigo-600 bg-indigo-50 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-400 dark:border-indigo-800 shadow-sm'
                                : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border-transparent hover:border-slate-200/30'
                              }`}
                          >
                            {reorderListIds.includes(product._id) ? (
                              <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            ) : (
                              <Plus className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        {hasWriteAccess && (
                          <button
                            onClick={() => openEditModal(product)}
                            title="Edit product"
                            className="p-2 text-slate-400 hover:text-indigo-650 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl transition-all cursor-pointer border border-transparent hover:border-slate-200/30"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                        {hasDeleteAccess && (
                          <button
                            onClick={() => handleDelete(product._id)}
                            title="Delete product"
                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/5 dark:hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer border border-transparent hover:border-slate-200/30"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Dialog Form */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl border border-slate-100 dark:bg-slate-900 dark:border-slate-800 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 dark:border-slate-850">
              <h3 className="text-xl font-black text-slate-850 dark:text-white flex items-center">
                <BarChart2 className="w-5 h-5 mr-2 text-indigo-500" />
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-405 hover:text-slate-655 dark:hover:text-slate-202 cursor-pointer p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="bg-rose-950/60 border border-rose-800 text-rose-200 px-4 py-3 rounded-2xl text-xs font-bold animate-pulse">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs text-slate-700 dark:text-slate-300">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block font-bold mb-1.5">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1.5">SKU / Barcode *</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1.5">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="Grocery">Grocery</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Pharmacy">Pharmacy</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Snacks">Snacks</option>
                    <option value="Grains">Grains</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1.5">Brand</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1.5">Supplier *</label>
                  <select
                    value={formData.supplierId}
                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    {suppliers.length === 0 && (
                      <option value="">No active suppliers available</option>
                    )}
                    {suppliers.map((s) => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1.5">Purchase Cost (৳) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1.5">Selling Price (৳) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1.5">Current Stock *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.currentStock}
                    onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1.5">Min Stock Threshold *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.minStockThreshold}
                    onChange={(e) => setFormData({ ...formData, minStockThreshold: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-bold mb-1.5">Expiration Date</label>
                  <input
                    type="date"
                    value={formData.expirationDate}
                    onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-bold mb-1.5">Description</label>
                  <textarea
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-slate-100 dark:border-slate-850">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-center cursor-pointer dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-750"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-bold rounded-xl text-center cursor-pointer shadow-lg shadow-indigo-500/20 active:scale-98 transition-all"
                >
                  {editingProduct ? 'Save Changes' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
