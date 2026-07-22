import React, { useState, useEffect, useRef } from 'react';
import API from '../services/api';
import { MessageSquare, X, Send, Sparkles, AlertTriangle, TrendingUp, Info, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AIChatBot = () => {
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Hello! I am SIBIS AI, your virtual retail advisor. Ask me anything about your products, sales history, low stock alerts, or reorder suggestions!',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!currentUser) return null;

  const handleSend = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    if (!textToSend) setInputText('');

    const userMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      // Gather last 8 messages for chat history context
      const chatHistory = messages
        .filter(m => m.id !== 'welcome')
        .slice(-8)
        .map(m => ({ sender: m.sender, text: m.text }));

      const res = await API.post('/ai/chat', {
        message: text,
        chatHistory
      });

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: res.data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: 'Sorry, I encountered an error connecting to the decision server. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const suggestionChips = [
    { label: 'Check stock warnings', query: 'List low stock products' },
    { label: 'Summarize recent sales', query: 'Show sales performance summary' },
    { label: 'Suggest reorders', query: 'What products should I reorder?' }
  ];

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start font-sans">
      {/* Expanded Chat Dialog window */}
      {isOpen && (
        <div className="mb-4 w-80 sm:w-96 h-[480px] bg-slate-900/95 dark:bg-slate-950/95 border border-slate-800/80 rounded-3xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden animate-[fade-in-up_0.25s_ease-out_1]">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-indigo-650 to-violet-650 text-white flex items-center justify-between border-b border-indigo-500/20 shadow-md">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 bg-white/10 rounded-xl shadow-inner">
                <Sparkles className="w-5 h-5 text-indigo-300 animate-pulse" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm tracking-wide">SIBIS AI Advisor</h4>
                <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-widest mt-0.5">Real-time Retail Analytics</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            {messages.map((m) => {
              const isAi = m.sender === 'ai';
              return (
                <div 
                  key={m.id}
                  className={`flex ${isAi ? 'justify-start' : 'justify-end'} animate-[fade-in_0.2s_ease-out]`}
                >
                  <div className={`max-w-[85%] p-3.5 rounded-2xl text-xs font-semibold leading-relaxed shadow-sm ${
                    isAi
                      ? 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700/50'
                      : 'bg-indigo-600 text-white rounded-tr-none'
                  }`}>
                    {/* Render simple markdown lists */}
                    <div className="space-y-1">
                      {m.text.split('\n').map((line, idx) => {
                        if (line.startsWith('* ')) {
                          return <div key={idx} className="pl-3.5 relative"><span className="absolute left-0 text-indigo-400">•</span>{line.substring(2)}</div>;
                        }
                        if (line.startsWith('### ')) {
                          return <h5 key={idx} className="font-bold text-indigo-400 mt-2 mb-1">{line.substring(4)}</h5>;
                        }
                        if (line.startsWith('**') && line.endsWith('**')) {
                          return <p key={idx} className="font-bold">{line.replace(/\*\*/g, '')}</p>;
                        }
                        return <p key={idx}>{line}</p>;
                      })}
                    </div>
                    <span className="block text-[8px] text-slate-400 mt-2 text-right">
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 text-slate-350 p-4 rounded-2xl rounded-tl-none border border-slate-700/50 flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Suggestion Chips */}
          {messages.length === 1 && (
            <div className="p-3 bg-slate-950/45 border-t border-slate-800/40 flex flex-wrap gap-1.5">
              {suggestionChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(chip.query)}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 font-bold rounded-xl border border-slate-700/40 cursor-pointer transition-colors"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          )}

          {/* Form Input */}
          <div className="p-4 bg-slate-950/60 border-t border-slate-800/40 flex items-center space-x-2">
            <input
              type="text"
              placeholder="Ask SIBIS AI advisor..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              className="flex-1 bg-slate-900 border border-slate-800 text-xs text-slate-200 px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !inputText.trim()}
              className="p-2.5 bg-indigo-650 hover:bg-indigo-550 text-white rounded-xl shadow-md transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Floating circular button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-4 bg-gradient-to-br from-indigo-500 via-indigo-650 to-violet-650 hover:from-indigo-600 hover:to-violet-600 text-white rounded-full shadow-2xl border border-indigo-400/20 cursor-pointer transform active:scale-95 transition-all duration-300 flex items-center justify-center hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] group"
        title="Open SIBIS AI Advisor Chat"
      >
        <MessageSquare className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-violet-500"></span>
        </span>
      </button>
    </div>
  );
};

export default AIChatBot;
