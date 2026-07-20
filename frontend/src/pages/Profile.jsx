import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import {
  User,
  Mail,
  Phone,
  Building2,
  Shield,
  KeyRound,
  Lock,
  Camera,
  Save,
  CheckCircle2,
  AlertOctagon,
  Sparkles,
  FileText,
  UserCheck,
  CreditCard,
  Package
} from 'lucide-react';

const Profile = () => {
  const { currentUser, updateUserProfile } = useAuth();

  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'security'

  // Profile Edit Form State
  const [profileData, setFormData] = useState({
    name: currentUser?.name || '',
    phone: currentUser?.phone || '',
    bio: currentUser?.bio || '',
    avatar: currentUser?.avatar || '',
  });

  const [avatarPreview, setAvatarPreview] = useState(currentUser?.avatar || '');

  // Password Change Form State
  const [passData, setPassData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // UI Alert States
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });
  const [passMessage, setPassMessage] = useState({ type: '', text: '' });

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Preset Avatars for quick selection
  const avatarPresets = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  ];

  // Image Upload Handler (Converts file to Base64 data URL)
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setProfileMessage({ type: 'error', text: 'Image file size must be smaller than 2MB.' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setAvatarPreview(base64String);
      setFormData((prev) => ({ ...prev, avatar: base64String }));
    };
    reader.readAsDataURL(file);
  };

  // Submit Profile Update
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileMessage({ type: '', text: '' });

    if (!profileData.name.trim()) {
      setProfileMessage({ type: 'error', text: 'Full name is required.' });
      return;
    }

    setSavingProfile(true);
    try {
      await updateUserProfile(profileData);
      setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setProfileMessage({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setSavingProfile(false);
    }
  };

  // Submit Password Change
  const handleSavePassword = async (e) => {
    e.preventDefault();
    setPassMessage({ type: '', text: '' });

    if (!passData.currentPassword || !passData.newPassword) {
      setPassMessage({ type: 'error', text: 'Current password and new password are required.' });
      return;
    }

    if (passData.newPassword !== passData.confirmPassword) {
      setPassMessage({ type: 'error', text: 'New password and confirm password do not match.' });
      return;
    }

    if (passData.newPassword.length < 6) {
      setPassMessage({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }

    setSavingPassword(true);
    try {
      await API.put('/users/change-password', {
        currentPassword: passData.currentPassword,
        newPassword: passData.newPassword,
      });
      setPassMessage({ type: 'success', text: 'Your password has been changed successfully!' });
      setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPassMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update password.' });
    } finally {
      setSavingPassword(false);
    }
  };

  const roleBadges = {
    Owner: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50',
    Manager: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50',
    Cashier: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50',
    'Inventory Staff': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50',
    'System Admin': 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/50',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-[fade-in_0.3s_ease-out]">
      {/* Profile Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 rounded-3xl shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 dark:bg-indigo-900/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
          {/* Avatar Display & Upload Trigger */}
          <div className="relative group flex-shrink-0">
            <div className="w-28 h-28 rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-900 shadow-xl flex items-center justify-center">
              {avatarPreview ? (
                <img src={avatarPreview} alt={currentUser?.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-3xl font-black">
                  {currentUser?.name?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <label
              htmlFor="avatar-upload"
              className="absolute -bottom-2 -right-2 p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl shadow-lg cursor-pointer transition-all transform active:scale-95 flex items-center justify-center"
              title="Upload Profile Image"
            >
              <Camera className="w-4 h-4" />
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Member Meta Information */}
          <div className="space-y-2 text-center md:text-left flex-1">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                  {currentUser?.name}
                </h1>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">{currentUser?.email}</p>
              </div>

              <div className="flex items-center justify-center md:justify-end space-x-2">
                <span
                  className={`text-xs px-3 py-1 rounded-xl border font-black tracking-wide ${
                    roleBadges[currentUser?.role] || 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {currentUser?.role}
                </span>

                {currentUser?.storeId?.name && (
                  <span className="text-xs px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-extrabold flex items-center border border-slate-200 dark:border-slate-800">
                    <Building2 className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
                    {currentUser.storeId.name}
                  </span>
                )}
              </div>
            </div>

            {currentUser?.bio ? (
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium italic pt-1">
                "{currentUser.bio}"
              </p>
            ) : (
              <p className="text-xs text-slate-400 italic pt-1">No designation / bio added yet.</p>
            )}

            {/* Avatar Preset Quick Chooser */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center space-x-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Preset Avatars:
              </span>
              <div className="flex items-center space-x-1.5">
                {avatarPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setAvatarPreview(preset);
                      setFormData((prev) => ({ ...prev, avatar: preset }));
                    }}
                    className="w-7 h-7 rounded-full overflow-hidden border-2 border-transparent hover:border-indigo-500 transition-all cursor-pointer"
                  >
                    <img src={preset} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex border-b border-slate-100 dark:border-slate-800 space-x-6">
          <button
            onClick={() => setActiveTab('details')}
            className={`pb-3 text-xs font-black tracking-wider transition-all cursor-pointer flex items-center border-b-2 ${
              activeTab === 'details'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4 mr-2" />
            General Profile Details
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`pb-3 text-xs font-black tracking-wider transition-all cursor-pointer flex items-center border-b-2 ${
              activeTab === 'security'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-4 h-4 mr-2" />
            Security & Change Password
          </button>
        </div>

        {/* TAB 1: General Profile Details */}
        {activeTab === 'details' && (
          <form onSubmit={handleSaveProfile} className="space-y-5 text-xs font-semibold animate-[fade-in_0.2s_ease-out]">
            {profileMessage.text && (
              <div
                className={`p-3.5 rounded-2xl text-xs font-bold flex items-center border ${
                  profileMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
                }`}
              >
                {profileMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 mr-2 flex-shrink-0" />
                ) : (
                  <AlertOctagon className="w-4 h-4 mr-2 flex-shrink-0" />
                )}
                <span>{profileMessage.text}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-bold">Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Your Full Name"
                    value={profileData.name}
                    onChange={(e) => setFormData({ ...profileData, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-bold">Contact Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="+880 17..."
                    value={profileData.phone}
                    onChange={(e) => setFormData({ ...profileData, phone: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-bold">Designation / Bio Notes</label>
              <div className="relative">
                <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <textarea
                  rows={3}
                  placeholder="e.g. Senior POS Cashier & Shift Manager"
                  value={profileData.bio}
                  onChange={(e) => setFormData({ ...profileData, bio: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold resize-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <label className="text-slate-500 dark:text-slate-400 font-bold">Email Address (Read-only)</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    disabled
                    value={currentUser?.email || ''}
                    className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 dark:text-slate-400 font-bold">Assigned Role & Scope</label>
                <div className="relative">
                  <Shield className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    disabled
                    value={`${currentUser?.role} ${currentUser?.storeId?.name ? `(${currentUser.storeId.name})` : ''}`}
                    className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold rounded-xl text-xs tracking-wider shadow-lg shadow-indigo-600/20 active:scale-98 transition-all flex items-center cursor-pointer"
              >
                <Save className="w-4 h-4 mr-2" />
                <span>{savingProfile ? 'Saving Changes...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: Security & Change Password */}
        {activeTab === 'security' && (
          <form onSubmit={handleSavePassword} className="space-y-5 text-xs font-semibold max-w-lg animate-[fade-in_0.2s_ease-out]">
            {passMessage.text && (
              <div
                className={`p-3.5 rounded-2xl text-xs font-bold flex items-center border ${
                  passMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
                }`}
              >
                {passMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 mr-2 flex-shrink-0" />
                ) : (
                  <AlertOctagon className="w-4 h-4 mr-2 flex-shrink-0" />
                )}
                <span>{passMessage.text}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-bold">Current Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={passData.currentPassword}
                  onChange={(e) => setPassData({ ...passData, currentPassword: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-bold">New Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={passData.newPassword}
                  onChange={(e) => setPassData({ ...passData, newPassword: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-bold">Confirm New Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={passData.confirmPassword}
                  onChange={(e) => setPassData({ ...passData, confirmPassword: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={savingPassword}
                className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold rounded-xl text-xs tracking-wider shadow-lg shadow-indigo-600/20 active:scale-98 transition-all flex items-center cursor-pointer"
              >
                <KeyRound className="w-4 h-4 mr-2" />
                <span>{savingPassword ? 'Updating Password...' : 'Update Password'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Profile;
