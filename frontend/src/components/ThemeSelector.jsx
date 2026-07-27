import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Sparkles, ChevronDown } from 'lucide-react';

const ThemeSelector = () => {
  const { mode, setMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const modes = [
    { id: 'light', name: 'Light Mode', icon: Sun, color: 'text-amber-500', desc: 'Clean & readable' },
    { id: 'dark', name: 'Dark Mode', icon: Moon, color: 'text-indigo-400', desc: 'Easy on the eyes' },
    { id: 'black', name: 'Deep Black', icon: Sparkles, color: 'text-fuchsia-400', desc: 'Premium OLED look' }
  ];

  const activeMode = modes.find(m => m.id === mode) || modes[0];
  const ActiveIcon = activeMode.icon;

  return (
    <div className="relative" ref={popoverRef}>
      {/* Theme Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 bg-white/40 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-800/80 transition-all duration-200 cursor-pointer flex items-center space-x-2.5 font-bold text-xs shadow-xs focus:outline-none"
        title="Switch Appearance Mode"
        aria-label="Appearance selector"
      >
        <ActiveIcon className={`w-4 h-4 ${activeMode.color}`} />
        <span className="hidden sm:inline">{activeMode.name}</span>
        <ChevronDown className="w-3.5 h-3.5 opacity-60" />
      </button>

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-60 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xl z-50 p-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-405">
            Select Appearance
          </div>
          <div className="space-y-1 mt-1">
            {modes.map((m) => {
              const Icon = m.icon;
              const isSelected = mode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    setMode(m.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-left cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 font-bold'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-350'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-indigo-100 dark:bg-indigo-900/40' : 'bg-slate-100/50 dark:bg-slate-800/50'}`}>
                    <Icon className={`w-4 h-4 ${m.color}`} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold leading-none">{m.name}</span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-1">{m.desc}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeSelector;
