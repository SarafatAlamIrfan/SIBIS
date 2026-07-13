import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const NotAuthorized = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 space-y-6">
      <div className="p-4 bg-red-100 text-red-600 rounded-full border border-red-200 dark:bg-red-950 dark:text-red-200 dark:border-red-900 animate-bounce">
        <ShieldAlert className="w-12 h-12 stroke-[1.5]" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Access Denied</h2>
        <p className="text-sm text-slate-500 max-w-sm">
          Your account role does not have permission to view this section. Please contact your administrator if you believe this is in error.
        </p>
      </div>
      <Link
        to="/dashboard"
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md inline-flex items-center"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Return to Dashboard
      </Link>
    </div>
  );
};

export default NotAuthorized;
