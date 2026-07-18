import React, { useState, useEffect } from 'react';
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
  BarChart2
} from 'lucide-react';

const Products = () => {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

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

  // Filter products by category AND search query
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
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
        <div className="w-10 h-10 border-4 border-indigo-650 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 dark:text-slate-500 font-semibold text-xs tracking-wider animate-pulse">LOADING CATALOG...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-[pulse-subtle_2s_ease-out_1]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-850 dark:text-white">Products & Stock</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">Manage catalog listings, prices, and monitor stock levels.</p>
        </div>
        {hasWriteAccess && (
          <button
            onClick={openAddModal}
            className="px-4 py-3 bg-gradient-to-r from-indigo-600 to-violet-605 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-650/20 hover:shadow-indigo-650/30 transition-all cursor-pointer flex items-center transform active:scale-97"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </button>
        )}
      </div>

      {/* Filter and Search Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/40 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm backdrop-blur-md">
        {/* Category pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-thin">
          {categories.map((cat) => {
            const count = getCategoryCount(cat);
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 transform active:scale-97 border ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm dark:bg-indigo-500 dark:border-indigo-500'
                    : 'bg-white text-slate-655 border-slate-200/50 hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-400 dark:border-slate-850 hover:border-slate-300'
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-black ${
                  isActive ? 'bg-indigo-700/80 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-550'
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
                              className={`h-full rounded-full transition-all duration-500 ${
                                isLowStock 
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
                            onClick={() => openEditModal(product)}
                            className="p-2 text-slate-400 hover:text-indigo-650 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl transition-all cursor-pointer border border-transparent hover:border-slate-200/30"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                        {hasDeleteAccess && (
                          <button
                            onClick={() => handleDelete(product._id)}
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
