import React from 'react';
import StoreCalendar from '../pages/StoreCalendar';
import { X } from 'lucide-react';

const CalendarModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 md:p-6 overflow-y-auto">
      <div className="bg-slate-50 dark:bg-slate-950 w-full max-w-6xl rounded-3xl overflow-hidden shadow-2xl relative border border-slate-200/40 dark:border-slate-850 max-h-[90vh] flex flex-col animate-[fade-in_0.3s_ease-out]">
        
        {/* Header bar */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200/40 dark:border-slate-850 bg-white dark:bg-slate-900 select-none">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
              Operations Calendar & AI Scheduler Overview
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Calendar Body */}
        <div className="p-6 overflow-y-auto flex-1 scrollbar-thin">
          <StoreCalendar hideHeader={true} />
        </div>
      </div>
    </div>
  );
};

export default CalendarModal;
