import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  UserPlus,
  Shield,
  UserCheck,
  CreditCard,
  Package,
  Search,
  X,
  Lock,
  Mail,
  User,
  Building2,
  AlertOctagon,
  Trash2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Info
} from 'lucide-react';

const StaffManagement = () => {
  const { currentUser } = useAuth();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form State for creating staff
  const [formData, setFormData] = useState({
    name: '',
    role: 'Cashier',
    email: currentUser?.email || '',
    password: '',
  });

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await API.get('/users/staff');
      setStaffList(res.data);
    } catch (err) {
      console.error('Failed to load store staff:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');

    if (!formData.name || !formData.password) {
      setErrorMessage('Staff name and password are required.');
      setSubmitting(false);
      return;
    }

    try {
      await API.post('/users/staff', {
        name: formData.name,
        role: formData.role,
        email: formData.email || currentUser?.email,
        password: formData.password,
      });

      setModalOpen(false);
      setFormData({
        name: '',
        role: 'Cashier',
        email: currentUser?.email || '',
        password: '',
      });
      fetchStaff();
    } catch (err) {
      setErrorMessage(err.response?.data?.error || 'Failed to create staff account.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (staffId, currentStatus) => {
    try {
      await API.put(`/users/staff/${staffId}/status`, { isActive: !currentStatus });
      fetchStaff();
    } catch (err) {
      alert('Failed to update staff status.');
    }
  };

  const handleDeleteStaff = async (staffId, staffName) => {
    if (!window.confirm(`Are you sure you want to remove ${staffName} from your store staff?`)) {
      return;
    }

    try {
      await API.delete(`/users/staff/${staffId}`);
      fetchStaff();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete staff account.');
    }
  };

  const roleBadges = {
    Owner: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50',
    Manager: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50',
    Cashier: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50',
    'Inventory Staff': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50',
  };

  const roleIcons = {
    Owner: Shield,
    Manager: UserCheck,
    Cashier: CreditCard,
    'Inventory Staff': Package,
  };

  const filteredStaff = staffList.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'All' || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-8 animate-[fade-in_0.3s_ease-out]">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-500/20">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Store Staff & Team Members
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                Add and manage Managers, Cashiers, and Inventory Staff for {currentUser?.storeId?.name || 'your shop'}.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchStaff}
            className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => {
              setFormData({
                name: '',
                role: 'Cashier',
                email: currentUser?.email || '',
                password: '',
              });
              setModalOpen(true);
            }}
            className="px-5 py-3 bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black rounded-2xl text-xs shadow-lg shadow-indigo-600/25 transition-all cursor-pointer flex items-center space-x-2 transform active:scale-97 border border-indigo-400/30"
          >
            <UserPlus className="w-4 h-4 stroke-[3]" />
            <span>Add Staff Member</span>
          </button>
        </div>
      </div>

      {/* Info Banner on Shared Owner Email Login */}
      <div className="p-4 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 rounded-2xl flex items-start space-x-3 text-xs">
        <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-extrabold text-indigo-900 dark:text-indigo-200">
            Shared Owner Email Login Feature Enabled
          </p>
          <p className="text-indigo-700 dark:text-indigo-300">
            Staff members (Managers, Cashiers, Inventory Staff) can log in using your store owner email address (<span className="font-mono font-bold">{currentUser?.email}</span>) alongside their own individual passwords assigned below.
          </p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search staff by name, email, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-2 self-start md:self-auto overflow-x-auto max-w-full">
          {['All', 'Manager', 'Cashier', 'Inventory Staff'].map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                roleFilter === role
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Staff Members Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-400 uppercase font-black tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Staff Member Name</th>
                <th className="px-6 py-4">Assigned Role</th>
                <th className="px-6 py-4">Login Email Address</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-slate-400 font-semibold animate-pulse">
                    Loading staff members list...
                  </td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-16 text-slate-400 font-bold uppercase tracking-wider">
                    No staff members found matching your search.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => {
                  const RoleIcon = roleIcons[staff.role] || User;
                  const isCurrentOwner = staff._id === currentUser?._id;

                  return (
                    <tr key={staff._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-850/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-850 dark:text-white text-sm">
                              {staff.name} {isCurrentOwner && <span className="text-[10px] text-indigo-500 font-bold">(You - Owner)</span>}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-[10px] font-extrabold ${
                            roleBadges[staff.role] || 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          <RoleIcon className="w-3 h-3 mr-1.5" />
                          {staff.role}
                        </span>
                      </td>

                      <td className="px-6 py-4 font-mono text-slate-600 dark:text-slate-400 font-semibold">
                        {staff.email}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`text-[9px] px-2.5 py-1 rounded-lg border font-black tracking-wide ${
                            staff.isActive
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400'
                              : 'bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400'
                          }`}
                        >
                          {staff.isActive ? 'ACTIVE' : 'DEACTIVATED'}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right space-x-2">
                        {!isCurrentOwner && (
                          <>
                            <button
                              onClick={() => handleToggleStatus(staff._id, staff.isActive)}
                              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer border ${
                                staff.isActive
                                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/30'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/30'
                              }`}
                            >
                              {staff.isActive ? 'Deactivate' : 'Activate'}
                            </button>

                            <button
                              onClick={() => handleDeleteStaff(staff._id, staff.name)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/30 transition-colors cursor-pointer"
                              title="Delete Staff Account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
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

      {/* Add New Staff Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-[fade-in_0.2s_ease-out]">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-white">Add New Staff Member</h3>
                  <p className="text-xs text-slate-400">Create a Manager, Cashier, or Inventory Staff account.</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center">
                <AlertOctagon className="w-4 h-4 mr-2 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-bold">Staff Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahim Ahmed"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-bold">Assigned Staff Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold"
                >
                  <option value="Manager">Manager (Purchase Orders & Suppliers)</option>
                  <option value="Cashier">Cashier (POS Billing & Sales)</option>
                  <option value="Inventory Staff">Inventory Staff (Stock Intake & Catalogs)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-bold">Login Email Address *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="owner@store.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  💡 Note: Staff can log in using your store email address along with their assigned password.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-bold">Assign Staff Login Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. cashier123"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-slate-100 dark:border-slate-850">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-center cursor-pointer dark:bg-slate-800 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-bold rounded-xl text-center cursor-pointer shadow-lg shadow-indigo-500/20 active:scale-98 transition-all flex items-center justify-center"
                >
                  {submitting ? 'Creating...' : 'Create Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;
