import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  X, 
  Mail, 
  Phone, 
  MapPin, 
  User,
  Users
} from 'lucide-react';

const Suppliers = () => {
  const { currentUser } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    status: 'Active',
  });
  const [formError, setFormError] = useState('');

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await API.get('/suppliers');
      setSuppliers(res.data);
    } catch (err) {
      console.error('Failed to fetch suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const openAddModal = () => {
    setEditingSupplier(null);
    setFormData({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      status: 'Active',
    });
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contactPerson: supplier.contactPerson || '',
      phone: supplier.phone,
      email: supplier.email || '',
      address: supplier.address || '',
      status: supplier.status,
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const { name, phone } = formData;
    if (!name || !phone) {
      setFormError('Supplier name and phone are required.');
      return;
    }

    try {
      if (editingSupplier) {
        await API.put(`/suppliers/${editingSupplier._id}`, formData);
      } else {
        await API.post('/suppliers', formData);
      }
      setModalOpen(false);
      fetchSuppliers();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to save supplier details.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this supplier?')) return;
    try {
      await API.delete(`/suppliers/${id}`);
      fetchSuppliers();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to deactivate supplier.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 dark:text-slate-500 font-semibold text-xs tracking-wider animate-pulse">SOURCING VENDORS...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-[pulse-subtle_2s_ease-out_1]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Supplier Management</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">Manage vendor list, profiles, and supply chain directories.</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-5 py-3 bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black rounded-2xl text-xs shadow-lg shadow-indigo-600/25 transition-all cursor-pointer flex items-center space-x-2 transform active:scale-97 border border-indigo-400/30"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add Supplier</span>
        </button>
      </div>

      {/* Grid of cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suppliers.length === 0 ? (
          <div className="col-span-3 text-center py-16 bg-white/40 border border-slate-200/50 rounded-3xl text-slate-400 font-bold uppercase tracking-wider dark:bg-slate-900/40 dark:border-slate-800/40">
            No suppliers found. Click "Add Supplier" to register one.
          </div>
        ) : (
          suppliers.map((supplier) => {
            const isActive = supplier.status === 'Active';
            return (
              <div 
                key={supplier._id} 
                className={`glass-panel rounded-3xl shadow-sm overflow-hidden flex flex-col justify-between h-64 border border-slate-200/40 dark:border-slate-800/40 transition-all duration-300 hover:-translate-y-1 ${
                  isActive ? 'hover:shadow-neon-emerald hover:border-emerald-500/30' : 'opacity-60'
                }`}
              >
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1 max-w-[170px]">
                      <h3 className="font-extrabold text-lg text-slate-850 dark:text-white leading-tight truncate" title={supplier.name}>
                        {supplier.name}
                      </h3>
                      {supplier.contactPerson && (
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center">
                          <User className="w-3 h-3 mr-1 text-slate-400" />
                          {supplier.contactPerson}
                        </p>
                      )}
                    </div>
                    <span className={`text-[9px] px-2.5 py-1 rounded-lg border font-black tracking-wide ${
                      isActive 
                        ? 'bg-emerald-550/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400' 
                        : 'bg-slate-100 text-slate-500 border-slate-200/25 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700/50'
                    }`}>
                      {supplier.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs text-slate-655 dark:text-slate-350 font-medium">
                    <p className="flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-indigo-400" />
                      {supplier.phone}
                    </p>
                    {supplier.email && (
                      <p className="flex items-center">
                        <Mail className="w-4 h-4 mr-2 text-indigo-400" />
                        {supplier.email}
                      </p>
                    )}
                    {supplier.address && (
                      <p className="flex items-start">
                        <MapPin className="w-4 h-4 mr-2 text-indigo-400 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2 leading-relaxed">{supplier.address}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="px-6 py-4.5 bg-slate-50/50 border-t border-slate-200/40 flex justify-end space-x-2 dark:bg-slate-950/20 dark:border-slate-850/40">
                  <button
                    onClick={() => openEditModal(supplier)}
                    className="px-3.5 py-2 bg-white text-slate-700 hover:text-indigo-650 border border-slate-200 rounded-xl text-[10px] font-bold cursor-pointer transition-colors dark:bg-slate-900 dark:text-slate-300 dark:border-slate-750 dark:hover:text-indigo-400"
                  >
                    Edit Profile
                  </button>
                  {isActive && (
                    <button
                      onClick={() => handleDelete(supplier._id)}
                      className="px-3.5 py-2 bg-white text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl text-[10px] font-bold cursor-pointer transition-all dark:bg-slate-900 dark:border-slate-750 dark:hover:bg-rose-950"
                    >
                      Deactivate
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Dialog Form */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 dark:border-slate-850">
              <h3 className="text-xl font-black text-slate-850 dark:text-white flex items-center">
                <Users className="w-5 h-5 mr-2 text-indigo-500" />
                {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
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
              <div className="space-y-3.5">
                <div>
                  <label className="block font-bold mb-1.5">Supplier Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-205 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1.5">Contact Person</label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-205 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1.5">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-205 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-205 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1.5">Office Address</label>
                  <textarea
                    rows="2"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-205 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-850 dark:text-white"
                  />
                </div>
                {editingSupplier && (
                  <div>
                    <label className="block font-bold mb-1.5">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2.5 border border-slate-205 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                )}
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
                  {editingSupplier ? 'Save Changes' : 'Register Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;
