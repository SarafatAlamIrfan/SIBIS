import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  AlertTriangle, 
  Sparkles, 
  RefreshCw,
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const StoreCalendar = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsRes, salesRes] = await Promise.all([
        API.get('/products'),
        API.get('/sales')
      ]);
      setProducts(productsRes.data || []);
      setSales(salesRes.data || []);
    } catch (err) {
      console.error('Failed to load calendar events data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute Calendar Events
  const events = [];

  // 1. Expiration dates
  products.forEach(p => {
    if (p.expirationDate) {
      events.push({
        id: `expire-${p._id}`,
        date: new Date(p.expirationDate),
        title: `Expiry: ${p.name}`,
        desc: `Product "${p.name}" (SKU: ${p.sku}) is scheduled to expire. Current stock: ${p.currentStock} units.`,
        type: 'expiry',
        product: p,
        color: 'bg-rose-500/10 text-rose-600 border-rose-500/30 hover:bg-rose-500/20'
      });
    }
  });

  // 2. AI Reorder suggestions based on sales velocity
  // Calculate sales velocity (daily average over 30 days)
  const salesQtyMap = {};
  sales.forEach(sale => {
    sale.items.forEach(item => {
      const pId = item.productId?.toString();
      if (pId) {
        salesQtyMap[pId] = (salesQtyMap[pId] || 0) + item.quantity;
      }
    });
  });

  products.forEach(p => {
    const totalQty = salesQtyMap[p._id.toString()] || 0;
    const velocity = totalQty / 30; // units per day

    if (velocity > 0 && p.currentStock > 0) {
      // Days to empty
      const daysToEmpty = p.currentStock / velocity;
      if (daysToEmpty <= 20) {
        // Expected empty date
        const emptyDate = new Date();
        emptyDate.setDate(emptyDate.getDate() + Math.round(daysToEmpty));

        // Suggested reorder date (safety threshold buffer: empty date minus 5 days)
        const reorderDate = new Date(emptyDate);
        reorderDate.setDate(reorderDate.getDate() - 5);

        events.push({
          id: `reorder-${p._id}`,
          date: reorderDate,
          title: `AI: Reorder ${p.name}`,
          desc: `Predictive stockout for "${p.name}" is on ${emptyDate.toLocaleDateString()} based on current daily sales velocity (${velocity.toFixed(2)} units/day). Suggested reordering units: ${p.minStockThreshold * 2 || 20}.`,
          type: 'ai-reorder',
          product: p,
          color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30 hover:bg-indigo-500/20 dark:text-indigo-400'
        });
      }
    }
  });

  // Calendar Helper Logic
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayIndex = getFirstDayOfMonth(currentYear, currentMonth); // Day of week (0 = Sunday)

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // Generate day items for monthly grid (Sunday to Saturday)
  const calendarCells = [];
  
  // Fill leading empty padding cells from previous month
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push({ isPadding: true, dayNum: '' });
  }

  // Fill actual day cells
  for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
    const dayDate = new Date(currentYear, currentMonth, dayNum);
    
    // Filter events matching this exact calendar date
    const dayEvents = events.filter(e => {
      return (
        e.date.getDate() === dayNum &&
        e.date.getMonth() === currentMonth &&
        e.date.getFullYear() === currentYear
      );
    });

    calendarCells.push({
      isPadding: false,
      dayNum,
      date: dayDate,
      events: dayEvents
    });
  }

  return (
    <div className="space-y-8 animate-[fade-in_0.3s_ease-out]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-500/20">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Operations Calendar & AI Scheduler
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
              Interactive monthly agenda pre-populated with inventory expiration warnings and AI predictive reorder markers.
            </p>
          </div>
        </div>

        <button
          onClick={loadData}
          className="px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-md shadow-indigo-600/10 cursor-pointer print:hidden transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Calendar Grid Container */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
          {/* Calendar Header Controls */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-black text-slate-850 dark:text-white">
              {monthName} {currentYear}
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={prevMonth}
                className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200/50 dark:bg-slate-950 dark:border-slate-800 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </button>
              <button
                onClick={nextMonth}
                className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200/50 dark:bg-slate-950 dark:border-slate-800 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </button>
            </div>
          </div>

          {/* Monthly grid */}
          <div className="space-y-1">
            {/* Weekdays names */}
            <div className="grid grid-cols-7 text-center text-[10px] font-black uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800/60">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="py-1">{d}</div>
              ))}
            </div>

            {/* Days cells */}
            <div className="grid grid-cols-7 gap-1.5 pt-2">
              {calendarCells.map((cell, idx) => {
                if (cell.isPadding) {
                  return (
                    <div key={`pad-${idx}`} className="h-24 bg-slate-50/35 dark:bg-slate-950/5 rounded-2xl border border-transparent"></div>
                  );
                }

                // Check if this date represents today
                const isToday = 
                  new Date().getDate() === cell.dayNum &&
                  new Date().getMonth() === currentMonth &&
                  new Date().getFullYear() === currentYear;

                return (
                  <div 
                    key={`day-${cell.dayNum}`} 
                    className={`h-24 p-2 bg-slate-50/50 dark:bg-slate-950/20 border rounded-2xl flex flex-col justify-between overflow-hidden hover:border-indigo-500/25 transition-all ${
                      isToday 
                        ? 'border-indigo-500 dark:border-indigo-500 bg-indigo-500/5 shadow-inner' 
                        : 'border-slate-200/60 dark:border-slate-850/60'
                    }`}
                  >
                    <span className={`text-xs font-black self-end px-1.5 py-0.5 rounded-lg ${
                      isToday ? 'bg-indigo-650 text-white shadow-sm' : 'text-slate-500 dark:text-slate-450'
                    }`}>
                      {cell.dayNum}
                    </span>

                    {/* Day Events stream list */}
                    <div className="flex-1 overflow-y-auto mt-1 space-y-1 scrollbar-none">
                      {cell.events.map(event => (
                        <button
                          key={event.id}
                          onClick={() => setSelectedEvent(event)}
                          className={`w-full text-left truncate text-[9px] font-extrabold px-1.5 py-0.5 rounded-lg border tracking-wide block transition-colors cursor-pointer ${event.color}`}
                        >
                          {event.title}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Event Details Sidebar panel */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6 min-h-[300px]">
          {selectedEvent ? (
            <div className="space-y-5 animate-[fade-in_0.2s_ease-out]">
              <div className="flex items-center space-x-2 pb-4 border-b border-slate-100 dark:border-slate-800/80">
                <div className={`p-2 rounded-xl border ${
                  selectedEvent.type === 'expiry' 
                    ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' 
                    : 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20'
                }`}>
                  {selectedEvent.type === 'expiry' ? (
                    <Clock className="w-5 h-5" />
                  ) : (
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  )}
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-855 dark:text-white">Event details</h4>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{selectedEvent.type.toUpperCase()}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h5 className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Scheduled Date</h5>
                  <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-0.5">
                    {selectedEvent.date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>

                <div>
                  <h5 className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Title</h5>
                  <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                    {selectedEvent.title}
                  </p>
                </div>

                <div>
                  <h5 className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Summary</h5>
                  <p className="text-xs font-semibold text-slate-550 dark:text-slate-400 leading-relaxed mt-1 bg-slate-50 dark:bg-slate-950/30 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/40">
                    {selectedEvent.desc}
                  </p>
                </div>
              </div>

              <div className="pt-2">
                {selectedEvent.type === 'expiry' ? (
                  <button
                    onClick={() => navigate('/products')}
                    className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <span>Audit Store Stock</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      // Redirect to products filter low stock
                      navigate('/products?filter=low-stock');
                    }}
                    className="w-full py-3 bg-indigo-650 hover:bg-indigo-550 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <span>One-Click Reorder Menu</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 py-16 space-y-3 text-center">
              <div className="p-4 bg-slate-50 dark:bg-slate-950 inline-block rounded-full border border-slate-100 dark:border-slate-850">
                <Info className="w-8 h-8 stroke-1" />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider">No Event Selected</p>
              <p className="text-[11px] font-semibold text-slate-450 max-w-[200px]">
                Click on any calendar day event chip to inspect warning logs and access AI scheduling options.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreCalendar;
