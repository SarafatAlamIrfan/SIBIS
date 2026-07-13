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
  User 
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
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Supplier Management</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage vendor list, profiles, and supply chain directories.</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-md transition-all cursor-pointer flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Supplier
        </button>
      </div>

      {/* Grid of cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suppliers.length === 0 ? (
          <div className="col-span-3 text-center py-16 bg-white border border-slate-200 rounded-2xl text-slate-400 dark:bg-slate-900 dark:border-slate-800">
            No suppliers found. Click "Add Supplier" to register one.
          </div>
        ) : (
          suppliers.map((supplier) => (
            <div key={supplier._id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between h-64 dark:bg-slate-900 dark:border-slate-800">
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg text-slate-850 dark:text-white leading-tight">{supplier.name}</h3>
                    {supplier.contactPerson && (
                      <p className="text-xs text-slate-400 flex items-center">
                        <User className="w-3.5 h-3.5 mr-1" />
                        {supplier.contactPerson}
                      </p>
                    )}
                  </div>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${supplier.status === 'Active' ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400'}`}>
                    {supplier.status}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-350">
                  <p className="flex items-center text-xs">
                    <Phone className="w-4 h-4 mr-2 text-indigo-400" />
                    {supplier.phone}
                  </p>
                  {supplier.email && (
                    <p className="flex items-center text-xs">
                      <Mail className="w-4 h-4 mr-2 text-indigo-400" />
                      {supplier.email}
                    </p>
                  )}
                  {supplier.address && (
                    <p className="flex items-start text-xs">
                      <MapPin className="w-4 h-4 mr-2 text-indigo-400 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{supplier.address}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-2 dark:bg-slate-950 dark:border-slate-800">
                <button
                  onClick={() => openEditModal(supplier)}
                  className="px-3 py-1.5 bg-white text-slate-700 hover:text-indigo-600 border border-slate-200 rounded-lg text-xs font-semibold cursor-pointer transition-colors dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700 dark:hover:text-indigo-400"
                >
                  Edit Profile
                </button>
                {supplier.status === 'Active' && (
                  <button
                    onClick={() => handleDelete(supplier._id)}
                    className="px-3 py-1.5 bg-white text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg text-xs font-semibold cursor-pointer transition-all dark:bg-slate-900 dark:border-slate-700 dark:hover:bg-rose-950"
                  >
                    Deactivate
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Dialog Form */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 dark:border-slate-800">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
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
              <div className="space-y-3">
                <div>
                  <label className="block font-semibold mb-1.5">Supplier Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1.5">Contact Person</label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1.5">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1.5">Office Address</label>
                  <textarea
                    rows="2"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                {editingSupplier && (
                  <div>
                    <label className="block font-semibold mb-1.5">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                )}
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
                  Save Supplier
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
