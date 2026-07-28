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
  ArrowRight,
  Gift,
  Sun,
  Plus,
  Trash2,
  Check,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const StoreCalendar = ({ hideHeader = false }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [locationEvents, setLocationEvents] = useState([]);
  const [locationInfo, setLocationInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Add/Edit event modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingEventId, setEditingEventId] = useState('');
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().slice(0, 10),
    type: 'custom',
    color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30 hover:bg-indigo-500/20 dark:text-indigo-400',
    syncToGoogle: true,
  });
  const [submittingEvent, setSubmittingEvent] = useState(false);
  const [eventError, setEventError] = useState('');
  const [syncFeedback, setSyncFeedback] = useState('');

  const handleOpenEditModal = (event) => {
    setIsEditMode(true);
    setEditingEventId(event.id);
    setEventError('');
    setSyncFeedback('');
    
    let dateVal = new Date().toISOString().slice(0, 10);
    if (event.date) {
      try {
        dateVal = new Date(event.date).toISOString().slice(0, 10);
      } catch (err) {
        console.error('Failed to parse event date:', err);
      }
    }

    setNewEvent({
      title: event.title,
      description: event.desc,
      date: dateVal,
      type: event.type,
      color: event.color,
      syncToGoogle: !!event.googleEventId,
    });
    setIsAddModalOpen(true);
  };

  const colorPresets = [
    { name: 'Indigo (Custom Event)', value: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30 hover:bg-indigo-500/20 dark:text-indigo-400' },
    { name: 'Rose (Expiry)', value: 'bg-rose-500/10 text-rose-600 border-rose-500/30 hover:bg-rose-500/20 dark:text-rose-450' },
    { name: 'Emerald (Holiday)', value: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20 dark:text-emerald-455' },
    { name: 'Teal (Weather)', value: 'bg-teal-500/10 text-teal-600 border-teal-500/30 hover:bg-teal-500/20 dark:text-teal-400' },
    { name: 'Amber (Reorder)', value: 'bg-amber-500/10 text-amber-600 border-amber-500/30 hover:bg-amber-500/20 dark:text-amber-455' }
  ];

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setEventError('');
    setSyncFeedback('');
    if (!newEvent.title.trim() || !newEvent.date) {
      setEventError('Title and Date are required.');
      return;
    }
    setSubmittingEvent(true);
    try {
      if (isEditMode) {
        await API.put(`/users/calendar-events/${editingEventId}`, newEvent);
        
        if (newEvent.syncToGoogle) {
          setSyncFeedback(`Synced: Event updated successfully in Google Calendar!`);
          setTimeout(() => {
            setIsAddModalOpen(false);
            setSyncFeedback('');
            loadData();
          }, 1200);
        } else {
          setIsAddModalOpen(false);
          loadData();
        }
      } else {
        await API.post('/users/calendar-events', newEvent);
        
        if (newEvent.syncToGoogle) {
          setSyncFeedback(`Synced: "${newEvent.title}" added to Google Calendar!`);
          setTimeout(() => {
            setIsAddModalOpen(false);
            setSyncFeedback('');
            loadData();
          }, 1200);
        } else {
          setIsAddModalOpen(false);
          loadData();
        }
      }
    } catch (err) {
      setEventError(err.response?.data?.error || 'Failed to save event.');
    } finally {
      if (!newEvent.syncToGoogle) {
        setSubmittingEvent(false);
      } else {
        setTimeout(() => setSubmittingEvent(false), 1200);
      }
    }
  };

  const handleDeleteCustomEvent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this custom calendar event?')) return;
    try {
      await API.delete(`/users/calendar-events/${id}`);
      setSelectedEvent(null);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete calendar event.');
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsRes, salesRes, locationEventsRes] = await Promise.all([
        API.get('/products'),
        API.get('/sales'),
        API.get('/users/store-calendar-events').catch(err => {
          console.error('Failed to load location-aware events:', err);
          return { data: { events: [], location: null } };
        })
      ]);
      setProducts(productsRes.data || []);
      setSales(salesRes.data || []);
      setLocationEvents(locationEventsRes.data?.events || []);
      setLocationInfo(locationEventsRes.data?.location || null);
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
  const events = [
    ...locationEvents.map(e => ({
      ...e,
      date: new Date(e.date)
    }))
  ];

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
      const pId = typeof item.productId === 'object' && item.productId !== null
        ? (item.productId._id || item.productId.id)?.toString()
        : item.productId?.toString();
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
      {!hideHeader && (
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

          <div className="flex flex-wrap gap-2.5 items-center print:hidden">
            <button
              onClick={() => {
                setIsEditMode(false);
                setEditingEventId('');
                setEventError('');
                setSyncFeedback('');
                setNewEvent({
                  title: '',
                  description: '',
                  date: new Date().toISOString().slice(0, 10),
                  type: 'custom',
                  color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30 hover:bg-indigo-500/20 dark:text-indigo-400',
                  syncToGoogle: true,
                });
                setIsAddModalOpen(true);
              }}
              className="px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-indigo-600/15 cursor-pointer transition-all active:scale-97 border border-indigo-400/20"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Event</span>
            </button>
            <button
              onClick={loadData}
              className="px-4.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-350 dark:hover:bg-slate-800 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-sm cursor-pointer transition-all active:scale-97"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Data</span>
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Calendar Grid Container */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
          {/* Calendar Header Controls */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-black text-slate-800 dark:text-white">
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
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5 pt-2">
              {calendarCells.map((cell, idx) => {
                if (cell.isPadding) {
                  return (
                    <div key={`pad-${idx}`} className="h-16 sm:h-24 bg-slate-50/35 dark:bg-slate-950/5 rounded-xl sm:rounded-2xl border border-transparent"></div>
                  );
                }

                // Check if this date represents selected day
                const isSelectedDay = selectedDate &&
                  selectedDate.getDate() === cell.dayNum &&
                  selectedDate.getMonth() === currentMonth &&
                  selectedDate.getFullYear() === currentYear;

                return (
                  <div 
                    key={`day-${cell.dayNum}`} 
                    onClick={() => {
                      setSelectedDate(cell.date);
                      setSelectedEvent(null);
                    }}
                    className={`h-16 sm:h-24 p-1 sm:p-2 border rounded-xl sm:rounded-2xl flex flex-col justify-between overflow-hidden hover:border-indigo-500/25 transition-all cursor-pointer ${
                      isSelectedDay
                        ? 'border-indigo-500 dark:border-indigo-500 bg-indigo-500/10 shadow-[0_0_10px_rgba(99,102,241,0.2)]'
                        : isToday 
                          ? 'border-indigo-400 dark:border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-inner' 
                          : 'border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/20'
                    }`}
                  >
                    <span className={`text-[10px] sm:text-xs font-black self-end px-1 sm:px-1.5 py-0.5 rounded-md sm:rounded-lg ${
                      isToday ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'
                    }`}>
                      {cell.dayNum}
                    </span>

                    {/* Day Events stream list */}
                    <div className="flex-1 overflow-y-auto mt-1 space-y-1 scrollbar-none">
                      {cell.events.map(event => (
                        <button
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDate(cell.date);
                            setSelectedEvent(event);
                          }}
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
                    : selectedEvent.type === 'holiday'
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400'
                    : selectedEvent.type === 'weather'
                    ? 'bg-teal-500/10 text-teal-600 border-teal-500/20 dark:text-teal-400'
                    : 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20'
                }`}>
                  {selectedEvent.type === 'expiry' ? (
                    <Clock className="w-5 h-5" />
                  ) : selectedEvent.type === 'holiday' ? (
                    <Gift className="w-5 h-5 text-emerald-500" />
                  ) : selectedEvent.type === 'weather' ? (
                    <Sun className="w-5 h-5 text-teal-500" />
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
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed mt-1 bg-slate-50 dark:bg-slate-950/30 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/40">
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
                ) : selectedEvent.type === 'holiday' ? (
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <span>Analyze Store Traffic</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : selectedEvent.type === 'weather' ? (
                  <button
                    onClick={() => navigate('/products?filter=low-stock')}
                    className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <span>Optimize Stock Level</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : selectedEvent.type === 'custom' ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenEditModal(selectedEvent)}
                      className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center space-x-1.5 active:scale-97 transform"
                    >
                      <Layers className="w-4 h-4" />
                      <span>Edit Event</span>
                    </button>
                    <button
                      onClick={() => handleDeleteCustomEvent(selectedEvent.id)}
                      className="py-3 px-4.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center active:scale-97 transform"
                      title="Delete Event"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      navigate('/products?filter=low-stock');
                    }}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <span>One-Click Reorder Menu</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
                
                {/* Back to daily schedule button */}
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="w-full mt-2.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center"
                >
                  Back to Day Schedule
                </button>
              </div>
            </div>
          ) : selectedDate ? (
            <div className="space-y-5 animate-[fade-in_0.2s_ease-out]">
              <div className="flex items-center space-x-2 pb-4 border-b border-slate-100 dark:border-slate-800/80">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 border-indigo-500/20">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-855 dark:text-white">Day Schedule</h4>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                    {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Day Events list */}
              <div className="space-y-3">
                <h5 className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Scheduled Events</h5>
                
                {(() => {
                  const dayEvents = events.filter(e => {
                    return (
                      e.date.getDate() === selectedDate.getDate() &&
                      e.date.getMonth() === selectedDate.getMonth() &&
                      e.date.getFullYear() === selectedDate.getFullYear()
                    );
                  });

                  if (dayEvents.length === 0) {
                    return (
                      <p className="text-xs text-slate-450 dark:text-slate-550 italic bg-slate-50 dark:bg-slate-950/20 p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                        No events scheduled for this date.
                      </p>
                    );
                  }

                  return (
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {dayEvents.map(e => (
                        <button
                          key={e.id}
                          onClick={() => setSelectedEvent(e)}
                          className={`w-full text-left p-2.5 rounded-xl border text-xs font-bold transition-all hover:scale-99 flex items-center justify-between cursor-pointer ${e.color}`}
                        >
                          <span className="truncate pr-2">{e.title}</span>
                          <span className="text-[8px] opacity-75 font-mono uppercase bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded-md">{e.type}</span>
                        </button>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Action Button: Add Event for this Date */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    setIsEditMode(false);
                    setEditingEventId('');
                    setEventError('');
                    setSyncFeedback('');
                    // Format date to local YYYY-MM-DD
                    const offset = selectedDate.getTimezoneOffset();
                    const localDate = new Date(selectedDate.getTime() - (offset*60*1000));
                    const dateStr = localDate.toISOString().split('T')[0];
                    setNewEvent({
                      title: '',
                      description: '',
                      date: dateStr,
                      type: 'custom',
                      color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30 hover:bg-indigo-500/20 dark:text-indigo-400',
                      syncToGoogle: true,
                    });
                    setIsAddModalOpen(true);
                  }}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center space-x-1.5 active:scale-97 transform"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Event for this Day</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 py-16 space-y-3 text-center">
              <div className="p-4 bg-slate-50 dark:bg-slate-950 inline-block rounded-full border border-slate-100 dark:border-slate-800">
                <Info className="w-8 h-8 stroke-1" />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider">No Day Selected</p>
              <p className="text-[11px] font-semibold text-slate-400 max-w-[200px]">
                Click on any calendar cell to select a date and view scheduled items, or click on a specific event chip.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Calendar Event Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-[fade-in_0.2s_ease-out]">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-slate-850 dark:text-white">{isEditMode ? 'Edit Store Event' : 'Add Store Event'}</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-950 rounded-xl cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {eventError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/30 dark:border-rose-900 dark:text-rose-300 rounded-xl text-xs font-bold">
                {eventError}
              </div>
            )}

            {syncFeedback && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center space-x-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{syncFeedback}</span>
              </div>
            )}

            <form onSubmit={handleCreateEvent} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-350 font-bold">Event Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Store Anniversary / VIP Sale"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-800 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-350 font-bold">Scheduled Date *</label>
                <input
                  type="date"
                  required
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-800 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-350 font-bold">Description / Summary</label>
                <textarea
                  rows={2}
                  placeholder="Notes about operational adjustments or objectives..."
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold resize-none text-slate-800 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-350 font-bold">Category & Accent Color</label>
                <select
                  value={newEvent.color}
                  onChange={(e) => setNewEvent({ ...newEvent, color: e.target.value, type: e.target.value.includes('indigo') ? 'custom' : e.target.value.includes('rose') ? 'expiry' : e.target.value.includes('emerald') ? 'holiday' : e.target.value.includes('teal') ? 'weather' : 'reorder' })}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-xs text-slate-800 dark:text-white"
                >
                  {colorPresets.map((preset) => (
                    <option key={preset.value} value={preset.value}>
                      {preset.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Google Calendar Sync Switch */}
              <div className="flex items-center justify-between p-3.5 bg-indigo-50/20 dark:bg-indigo-950/10 border border-indigo-100/10 rounded-2xl">
                <div className="space-y-0.5 pr-2">
                  <span className="text-xs font-black text-slate-800 dark:text-white flex items-center">
                    <span>Sync to Google Calendar</span>
                    <span className="ml-1.5 text-[8px] uppercase font-extrabold px-1.5 py-0.2 bg-indigo-600 text-white rounded">Live</span>
                  </span>
                  <p className="text-[10px] text-slate-400 font-medium">Add this event automatically to Google Calendar account</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={newEvent.syncToGoogle}
                    onChange={(e) => setNewEvent({ ...newEvent, syncToGoogle: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-950 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEvent}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl shadow-md cursor-pointer flex items-center justify-center space-x-1.5 disabled:opacity-50"
                >
                  {submittingEvent ? 'Syncing...' : isEditMode ? 'Update Event' : 'Save Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreCalendar;
