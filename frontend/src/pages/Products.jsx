import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  X, 
  Check 
} from 'lucide-react';

const Products = () => {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    category: '',
    brand: '',
    supplierId: '',
    purchasePrice: '',
    sellingPrice: '',
    currentStock: '',
    minStockThreshold: '',
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
      // Filter out inactive suppliers for product creation
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

    // Field validation
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

  const hasWriteAccess = ['Owner', 'Manager', 'Inventory Staff'].includes(currentUser.role);
  const hasDeleteAccess = ['Owner', 'Manager'].includes(currentUser.role);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Products & Inventory</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage catalog listings, prices, and monitor stock levels.</p>
        </div>
        {hasWriteAccess && (
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-md transition-all cursor-pointer flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </button>
        )}
      </div>

      {/* Table view */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase text-xs font-semibold tracking-wider dark:bg-slate-950 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Product Name</th>
                <th className="px-6 py-4">SKU / Barcode</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Purchase / Sell Price</th>
                <th className="px-6 py-4">Current Stock</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 dark:divide-slate-800">
              {products.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-400">
                    No products added yet. Click "Add Product" to get started.
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const isLowStock = product.currentStock <= product.minStockThreshold;
                  return (
                    <tr key={product._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-850 dark:text-white">
                        {product.name}
                        {isLowStock && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Low Stock
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">{product.sku}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-350">{product.category}</td>
                      <td className="px-6 py-4 font-semibold text-slate-850 dark:text-slate-200">
                        ${product.purchasePrice.toFixed(2)} / ${product.sellingPrice.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-bold ${isLowStock ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}`}>
                          {product.currentStock}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {hasWriteAccess && (
                          <button
                            onClick={() => openEditModal(product)}
                            className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/50 cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                        {hasDeleteAccess && (
                          <button
                            onClick={() => handleDelete(product._id)}
                            className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl border border-slate-100 dark:bg-slate-900 dark:border-slate-800 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 dark:border-slate-800">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="bg-red-950 border border-red-800 text-red-200 px-4 py-3 rounded-lg text-sm">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-sm text-slate-700 dark:text-slate-300">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block font-semibold mb-1.5">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1.5">SKU / Barcode *</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1.5">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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
                  <label className="block font-semibold mb-1.5">Brand</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1.5">Supplier *</label>
                  <select
                    value={formData.supplierId}
                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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
                  <label className="block font-semibold mb-1.5">Purchase Cost ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1.5">Selling Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1.5">Current Stock *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.currentStock}
                    onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1.5">Min Stock Threshold *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.minStockThreshold}
                    onChange={(e) => setFormData({ ...formData, minStockThreshold: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-semibold mb-1.5">Expiration Date</label>
                  <input
                    type="date"
                    value={formData.expirationDate}
                    onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-semibold mb-1.5">Description</label>
                  <textarea
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-center cursor-pointer dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-750"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-center cursor-pointer shadow-lg shadow-indigo-600/20"
                >
                  Save Product
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
