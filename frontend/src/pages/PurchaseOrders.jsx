import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Check, 
  X, 
  Trash2, 
  Calendar, 
  FileText, 
  Truck 
} from 'lucide-react';

const PurchaseOrders = () => {
  const { currentUser } = useAuth();
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form states for creating PO
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [poItems, setPoItems] = useState([{ productId: '', quantityOrdered: 1, purchasePrice: 0.00 }]);
  const [formError, setFormError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [poRes, supRes, prodRes] = await Promise.all([
        API.get('/purchase-orders'),
        API.get('/suppliers'),
        API.get('/products'),
      ]);
      setPurchaseOrders(poRes.data);
      setSuppliers(supRes.data.filter(s => s.status === 'Active'));
      setProducts(prodRes.data);
      if (supRes.data.length > 0) {
        setSelectedSupplierId(supRes.data[0]._id);
      }
    } catch (err) {
      console.error('Failed to load PO page data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setPoItems([{ productId: products[0]?._id || '', quantityOrdered: 10, purchasePrice: products[0]?.purchasePrice || 0.00 }]);
    setFormError('');
    setModalOpen(true);
  };

  const handleAddItemRow = () => {
    setPoItems([...poItems, { productId: products[0]?._id || '', quantityOrdered: 10, purchasePrice: products[0]?.purchasePrice || 0.00 }]);
  };

  const handleRemoveItemRow = (idx) => {
    setPoItems(poItems.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx, field, value) => {
    const updated = poItems.map((item, i) => {
      if (i === idx) {
        let val = value;
        if (field === 'quantityOrdered') val = parseInt(value, 10) || 0;
        if (field === 'purchasePrice') val = parseFloat(value) || 0.00;
        
        // Auto fill cost price if product is changed
        if (field === 'productId') {
          const match = products.find(p => p._id === value);
          return {
            ...item,
            productId: value,
            purchasePrice: match ? match.purchasePrice : 0.00
          };
        }

        return { ...item, [field]: val };
      }
      return item;
    });
    setPoItems(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!selectedSupplierId) {
      setFormError('Please select a supplier.');
      return;
    }

    // Verify item entries
    for (const item of poItems) {
      if (!item.productId || item.quantityOrdered <= 0 || item.purchasePrice < 0) {
        setFormError('Please ensure all items have a valid product, quantity, and cost price.');
        return;
      }
    }

    try {
      await API.post('/purchase-orders', {
        supplierId: selectedSupplierId,
        items: poItems,
      });
      setModalOpen(false);
      loadData();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to place Purchase Order.');
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    const confirmMsg = newStatus === 'Received'
      ? 'Marking this PO as Received will add ordered quantities into product inventory stocks. Proceed?'
      : 'Are you sure you want to cancel this PO?';

    if (!window.confirm(confirmMsg)) return;

    try {
      await API.put(`/purchase-orders/${id}/status`, {
        status: newStatus,
        performedBy: currentUser._id,
      });
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update Purchase Order status.');
    }
  };

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
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Purchase Orders (PO)</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage vendor procurement, place orders, and intake product stock.</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-md transition-all cursor-pointer flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create PO
        </button>
      </div>

      {/* PO logs table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase text-xs font-semibold tracking-wider dark:bg-slate-950 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">PO Number</th>
                <th className="px-6 py-4">Supplier</th>
                <th className="px-6 py-4">Order Date</th>
                <th className="px-6 py-4">Total Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 dark:divide-slate-800">
              {purchaseOrders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-400">
                    No purchase orders placed yet. Click "Create PO" to initiate procurement.
                  </td>
                </tr>
              ) : (
                purchaseOrders.map((po) => {
                  let statusBadge = 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-350 dark:border-slate-700';
                  if (po.status === 'Received') statusBadge = 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-900';
                  if (po.status === 'Cancelled') statusBadge = 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-900';
                  
                  return (
                    <tr key={po._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-colors">
                      <td className="px-6 py-4 font-mono font-semibold text-xs text-indigo-600 dark:text-indigo-400">{po.poNumber}</td>
                      <td className="px-6 py-4 font-semibold text-slate-800 dark:text-white">{po.supplierId?.name || 'Unknown'}</td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                        <span className="flex items-center text-xs">
                          <Calendar className="w-3.5 h-3.5 mr-1" />
                          {new Date(po.orderedDate).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">${po.totalAmount.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${statusBadge}`}>
                          {po.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {po.status === 'Ordered' ? (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(po._id, 'Received')}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer inline-flex items-center"
                            >
                              <Check className="w-3.5 h-3.5 mr-1" />
                              Receive
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(po._id, 'Cancelled')}
                              className="px-3 py-1 bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 text-xs font-semibold rounded-lg transition-all cursor-pointer inline-flex items-center dark:bg-slate-900 dark:border-slate-700 dark:hover:bg-rose-950"
                            >
                              <X className="w-3.5 h-3.5 mr-1" />
                              Cancel
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400 flex items-center justify-end">
                            <FileText className="w-3.5 h-3.5 mr-1" />
                            Archived {po.receivedDate && `(${new Date(po.receivedDate).toLocaleDateString()})`}
                          </span>
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

      {/* Modal Dialog Form to Create PO */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl border border-slate-100 dark:bg-slate-900 dark:border-slate-800 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 dark:border-slate-800">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center">
                <Truck className="w-5 h-5 mr-2 text-indigo-500" />
                Place Purchase Order (PO)
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
              <div>
                <label className="block font-semibold mb-1.5">Select Supplier *</label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {suppliers.map((s) => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <label className="block font-semibold">Ordered Items *</label>
                
                {poItems.map((item, idx) => (
                  <div key={idx} className="flex items-center space-x-3 bg-slate-50 p-3 rounded-xl dark:bg-slate-950 dark:border dark:border-slate-850">
                    <div className="flex-1">
                      <select
                        value={item.productId}
                        onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      >
                        {products.map((p) => (
                          <option key={p._id} value={p._id}>{p.name} (SKU: {p.sku})</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-24">
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantityOrdered}
                        onChange={(e) => handleItemChange(idx, 'quantityOrdered', e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    <div className="w-28">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Cost"
                        value={item.purchasePrice}
                        onChange={(e) => handleItemChange(idx, 'purchasePrice', e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    {poItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddItemRow}
                  className="px-3 py-1.5 text-xs text-indigo-600 hover:text-indigo-850 font-bold border border-indigo-200 border-dashed rounded-lg transition-colors cursor-pointer flex items-center"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Another Item
                </button>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-center cursor-pointer dark:bg-slate-800 dark:text-slate-350 dark:hover:bg-slate-750"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-center cursor-pointer shadow-lg shadow-indigo-600/20"
                >
                  Place Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrders;
