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
  Truck,
  PlusCircle,
  Eye,
  Printer
} from 'lucide-react';

const PurchaseOrders = () => {
  const { currentUser } = useAuth();
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewingPO, setViewingPO] = useState(null);

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
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 dark:text-slate-500 font-semibold text-xs tracking-wider animate-pulse">COMPILING LOGS...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-[pulse-subtle_2s_ease-out_1]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Purchase Orders</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">Manage vendor procurement, place orders, and intake product stock.</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-5 py-3 bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black rounded-2xl text-xs shadow-lg shadow-indigo-600/25 transition-all cursor-pointer flex items-center space-x-2 transform active:scale-97 border border-indigo-400/30"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Create Purchase Order</span>
        </button>
      </div>

      {/* PO logs table */}
      <div className="glass-panel border border-slate-200/40 dark:border-slate-800/40 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50/50 border-b border-slate-200/40 text-slate-405 uppercase font-bold tracking-wider dark:bg-slate-950/40 dark:border-slate-850/40">
              <tr>
                <th className="px-6 py-4.5">PO Number</th>
                <th className="px-6 py-4.5">Supplier</th>
                <th className="px-6 py-4.5">Order Date</th>
                <th className="px-6 py-4.5">Total Amount</th>
                <th className="px-6 py-4.5">Status</th>
                <th className="px-6 py-4.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 dark:divide-slate-855">
              {purchaseOrders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-16 text-slate-400 font-bold uppercase tracking-wider">
                    No purchase orders placed yet. Click "Create PO" to initiate procurement.
                  </td>
                </tr>
              ) : (
                purchaseOrders.map((po) => {
                  let statusBadge = 'bg-slate-105 text-slate-655 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800';
                  if (po.status === 'Received') statusBadge = 'bg-emerald-550/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400 shadow-neon-emerald/10';
                  if (po.status === 'Cancelled') statusBadge = 'bg-rose-550/10 text-rose-600 border-rose-500/20 dark:text-rose-400 shadow-neon-rose/10';
                  if (po.status === 'Ordered') statusBadge = 'bg-blue-550/10 text-blue-600 border-blue-500/20 dark:text-blue-400 shadow-neon-indigo/10';

                  return (
                    <tr 
                      key={po._id} 
                      onClick={() => setViewingPO(po)}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-850/40 transition-colors cursor-pointer group select-none"
                      title="Click to view purchase order items & details"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-mono font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white px-2 py-1 rounded-md border border-indigo-200/20 dark:border-indigo-900/30 transition-colors">
                            {po.poNumber}
                          </span>
                          <Eye className="w-3.5 h-3.5 text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </td>
                      <td className="px-6 py-4 font-extrabold text-slate-850 dark:text-white text-sm">{po.supplierId?.name || 'Unknown Supplier'}</td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                        <span className="flex items-center text-xs font-bold">
                          <Calendar className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
                          {new Date(po.orderedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-black text-slate-805 dark:text-white text-sm">৳{po.totalAmount.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] px-2.5 py-1 rounded-lg border font-black tracking-wide ${statusBadge}`}>
                          {po.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                        {po.status === 'Ordered' ? (
                          <div className="inline-flex space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateStatus(po._id, 'Received');
                              }}
                              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded-xl shadow-md shadow-emerald-500/10 transition-all cursor-pointer inline-flex items-center transform active:scale-97"
                            >
                              <Check className="w-3.5 h-3.5 mr-1" />
                              Receive
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateStatus(po._id, 'Cancelled');
                              }}
                              className="px-3.5 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 text-[10px] font-bold rounded-xl transition-all cursor-pointer inline-flex items-center dark:bg-slate-900 dark:border-slate-805 dark:hover:bg-rose-950/20 transform active:scale-97"
                            >
                              <X className="w-3.5 h-3.5 mr-1" />
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold flex items-center justify-end uppercase tracking-wider">
                            <FileText className="w-3.5 h-3.5 mr-1 text-slate-450" />
                            Archived {po.receivedDate && `(${new Date(po.receivedDate).toLocaleDateString([], { month: 'short', day: 'numeric' })})`}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl border border-slate-100 dark:bg-slate-900 dark:border-slate-800 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 dark:border-slate-850">
              <h3 className="text-xl font-black text-slate-850 dark:text-white flex items-center">
                <Truck className="w-5 h-5 mr-2 text-indigo-500" />
                Place Purchase Order
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-405 hover:text-slate-655 dark:hover:text-slate-202 cursor-pointer p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="bg-rose-950/60 border border-rose-808 text-red-200 px-4 py-3 rounded-2xl text-xs font-bold animate-pulse">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs text-slate-705 dark:text-slate-300">
              <div>
                <label className="block font-bold mb-1.5">Select Supplier *</label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {suppliers.map((s) => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <label className="block font-bold">Ordered Items *</label>
                
                {poItems.map((item, idx) => (
                  <div key={idx} className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-150/50 dark:border-slate-850">
                    <div className="flex-1">
                      <select
                        value={item.productId}
                        onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    {poItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(idx)}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/5 dark:hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddItemRow}
                  className="px-3.5 py-2 text-[10px] text-indigo-650 hover:text-indigo-800 font-bold border border-indigo-250 border-dashed rounded-xl transition-colors cursor-pointer flex items-center"
                >
                  <PlusCircle className="w-4 h-4 mr-1.5" />
                  Add Another Item
                </button>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-slate-100 dark:border-slate-850">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-705 font-bold rounded-xl text-center cursor-pointer dark:bg-slate-800 dark:text-slate-305 dark:hover:bg-slate-750"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-bold rounded-xl text-center cursor-pointer shadow-lg shadow-indigo-500/20 active:scale-98 transition-all"
                >
                  Place Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Purchase Order Details Modal */}
      {viewingPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-[fade-in_0.2s_ease-out]">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl border border-slate-100 dark:border-slate-800 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 dark:border-slate-850">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-xl font-black text-slate-850 dark:text-white font-mono">{viewingPO.poNumber}</h3>
                    <span className={`text-[9px] px-2.5 py-0.5 rounded-lg border font-black tracking-wide ${
                      viewingPO.status === 'Received' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400' :
                      viewingPO.status === 'Cancelled' ? 'bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400' :
                      'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400'
                    }`}>
                      {viewingPO.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Ordered on {new Date(viewingPO.orderedDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingPO(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Supplier & Order Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/60 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-150/60 dark:border-slate-850">
              <div className="space-y-1.5 text-xs">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Supplier Information</p>
                <p className="font-extrabold text-slate-850 dark:text-white text-sm flex items-center">
                  <Truck className="w-4 h-4 mr-1.5 text-indigo-500" />
                  {viewingPO.supplierId?.name || 'Unknown Supplier'}
                </p>
                {viewingPO.supplierId?.contactPerson && (
                  <p className="text-slate-500 dark:text-slate-400">Contact: {viewingPO.supplierId.contactPerson}</p>
                )}
                {viewingPO.supplierId?.phone && (
                  <p className="text-slate-500 dark:text-slate-400">Phone: {viewingPO.supplierId.phone}</p>
                )}
              </div>

              <div className="space-y-1.5 text-xs">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Fulfillment Status</p>
                <p className="font-bold text-slate-700 dark:text-slate-300">
                  Status: <strong className="text-slate-900 dark:text-white">{viewingPO.status}</strong>
                </p>
                {viewingPO.receivedDate && (
                  <p className="text-emerald-600 dark:text-emerald-400 font-bold">
                    Stock Intake Date: {new Date(viewingPO.receivedDate).toLocaleDateString()}
                  </p>
                )}
                <p className="text-slate-400 text-[10px] mt-1">Total items in order: {viewingPO.items?.length || 0}</p>
              </div>
            </div>

            {/* Items Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Ordered Product Items</h4>
              <div className="border border-slate-200/60 dark:border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-slate-400 uppercase font-extrabold tracking-wider border-b border-slate-200/60 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Product Name</th>
                      <th className="px-4 py-3">SKU</th>
                      <th className="px-4 py-3 text-right">Quantity</th>
                      <th className="px-4 py-3 text-right">Unit Price</th>
                      <th className="px-4 py-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                    {viewingPO.items?.map((item, idx) => {
                      const prodName = item.productId?.name || 'Product Item';
                      const sku = item.productId?.sku || 'N/A';
                      const lineTotal = item.purchasePrice * item.quantityOrdered;
                      return (
                        <tr key={idx} className="hover:bg-slate-50/40 dark:hover:bg-slate-850/20">
                          <td className="px-4 py-3 font-extrabold text-slate-800 dark:text-white">{prodName}</td>
                          <td className="px-4 py-3 font-mono text-[10px] text-slate-500">{sku}</td>
                          <td className="px-4 py-3 text-right font-black text-indigo-600 dark:text-indigo-400">{item.quantityOrdered} units</td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-600 dark:text-slate-400">৳{item.purchasePrice.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right font-black text-slate-850 dark:text-white">৳{lineTotal.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total Cost Breakdown */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-850">
              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Invoice</span>
              </button>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Purchase Order Cost</p>
                  <p className="text-2xl font-black text-slate-850 dark:text-white">৳{viewingPO.totalAmount.toFixed(2)}</p>
                </div>

                {viewingPO.status === 'Ordered' && (
                  <button
                    onClick={() => {
                      const poId = viewingPO._id;
                      setViewingPO(null);
                      handleUpdateStatus(poId, 'Received');
                    }}
                    className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/20 active:scale-98 transition-all flex items-center space-x-1 cursor-pointer"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    <span>Receive Stock Intake</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrders;
