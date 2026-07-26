import React, { useState, useEffect, useRef } from 'react';
import API from '../services/api';
import { MessageSquare, X, Send, Sparkles, AlertTriangle, TrendingUp, Info, HelpCircle, Square } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Custom component for rendering code blocks with copy button
const CodeBlock = ({ lang, content }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <div className="my-2 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 font-mono text-[10.5px] text-emerald-400 shadow-xl">
      <div className="flex justify-between items-center px-3.5 py-1.5 bg-slate-900 border-b border-slate-800/60 text-[9px] font-sans text-slate-400 select-none">
        <span className="font-bold uppercase tracking-wider text-indigo-400">{lang || 'code'}</span>
        <button
          onClick={handleCopy}
          className={`hover:text-slate-200 transition-colors cursor-pointer px-2 py-0.5 rounded font-bold text-[9px] ${
            copied ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'hover:bg-slate-800'
          }`}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto scrollbar-thin"><code className="whitespace-pre">{content}</code></pre>
    </div>
  );
};

// Recursive helper for parsing inline markdown elements (bold, italic, code)
const renderInline = (text) => {
  if (!text) return '';

  const regex = /(\*\*.*?\*\*|\*.*?\*|_[^_]+?_|`.*?`)/g;
  const parts = text.split(regex);

  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-extrabold text-white">
          {renderInline(part.slice(2, -2))}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={idx} className="italic text-slate-300 font-medium">
          {renderInline(part.slice(1, -1))}
        </em>
      );
    }
    if (part.startsWith('_') && part.endsWith('_')) {
      return (
        <em key={idx} className="italic text-slate-300 font-medium">
          {renderInline(part.slice(1, -1))}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={idx} className="bg-slate-900 border border-slate-800 text-[10px] font-mono text-indigo-350 px-1.5 py-0.5 rounded font-bold">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
};

// Custom Markdown parser that splits blocks of code and normal lines
const renderMarkdown = (text) => {
  if (!text) return null;

  const tokens = [];
  const lines = text.split('\n');
  let inCodeBlock = false;
  let codeLang = '';
  let codeContent = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        tokens.push({
          type: 'code-block',
          lang: codeLang,
          content: codeContent.join('\n')
        });
        inCodeBlock = false;
        codeContent = [];
      } else {
        inCodeBlock = true;
        codeLang = line.trim().substring(3).trim();
      }
    } else if (inCodeBlock) {
      codeContent.push(line);
    } else {
      tokens.push({
        type: 'line',
        content: line
      });
    }
  }

  if (inCodeBlock) {
    tokens.push({
      type: 'code-block',
      lang: codeLang,
      content: codeContent.join('\n')
    });
  }

  return (
    <div className="space-y-1.5 break-words">
      {tokens.map((token, index) => {
        if (token.type === 'code-block') {
          return (
            <CodeBlock key={index} lang={token.lang} content={token.content} />
          );
        }

        const line = token.content;

        // 1. Headers
        if (line.startsWith('### ')) {
          return (
            <h5 key={index} className="font-extrabold text-sm text-indigo-400 mt-3 mb-1 tracking-wide">
              {renderInline(line.substring(4))}
            </h5>
          );
        }
        if (line.startsWith('## ')) {
          return (
            <h4 key={index} className="font-extrabold text-base text-indigo-400 mt-4.5 mb-1.5 tracking-wide">
              {renderInline(line.substring(3))}
            </h4>
          );
        }
        if (line.startsWith('# ')) {
          return (
            <h3 key={index} className="font-extrabold text-lg text-indigo-400 mt-5 mb-2.5 tracking-wide">
              {renderInline(line.substring(2))}
            </h3>
          );
        }

        // 2. Bullet lists (and nested lists)
        const bulletMatch = line.match(/^(\s*)([*+-])\s+(.*)$/);
        if (bulletMatch) {
          const indent = bulletMatch[1].length;
          const content = bulletMatch[3];
          return (
            <div key={index} className="relative leading-relaxed" style={{ paddingLeft: `${16 + indent * 8}px` }}>
              <span className="absolute text-indigo-400 select-none font-bold" style={{ left: `${indent * 8}px` }}>•</span>
              {renderInline(content)}
            </div>
          );
        }

        // 3. Numbered lists (and nested lists)
        const numMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
        if (numMatch) {
          const indent = numMatch[1].length;
          const num = numMatch[2];
          const content = numMatch[3];
          return (
            <div key={index} className="relative leading-relaxed" style={{ paddingLeft: `${18 + indent * 8}px` }}>
              <span className="absolute text-indigo-400 font-bold select-none text-[10px]" style={{ left: `${indent * 8}px` }}>{num}.</span>
              {renderInline(content)}
            </div>
          );
        }

        // 4. Empty spacer line
        if (!line.trim()) {
          return <div key={index} className="h-1" />;
        }

        // 5. Standard line paragraph
        return (
          <p key={index} className="text-slate-200 leading-relaxed">
            {renderInline(line)}
          </p>
        );
      })}
    </div>
  );
};


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
  const [isTyping, setIsTyping] = useState(false);
  
  const chatEndRef = useRef(null);
  const typingTimerRef = useRef(null);
  const fullResponseRef = useRef('');

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: isTyping ? 'auto' : 'smooth' });
    }
  }, [messages, isOpen, isTyping]);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) {
        clearInterval(typingTimerRef.current);
      }
    };
  }, []);

  if (!currentUser) return null;

  const handleStopTyping = () => {
    if (typingTimerRef.current) {
      clearInterval(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    
    if (loading) {
      setLoading(false);
      return;
    }

    if (fullResponseRef.current) {
      setMessages(prev => {
        if (prev.length === 0) return prev;
        const lastMsg = prev[prev.length - 1];
        if (lastMsg.sender === 'ai') {
          return prev.map(m => m.id === lastMsg.id ? { ...m, text: fullResponseRef.current } : m);
        }
        return prev;
      });
    }
    setIsTyping(false);
  };

  const handleSend = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim() || loading || isTyping) return;

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

      const fullResponse = res.data.response;
      fullResponseRef.current = fullResponse;

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: '', // Start empty for typing simulation
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      setLoading(false);
      setIsTyping(true);

      let currentLength = 0;
      const step = 4;
      typingTimerRef.current = setInterval(() => {
        if (currentLength < fullResponse.length) {
          currentLength += step;
          const substring = fullResponse.substring(0, currentLength);
          setMessages(prev => prev.map(m => m.id === aiMessage.id ? { ...m, text: substring } : m));
        } else {
          clearInterval(typingTimerRef.current);
          typingTimerRef.current = null;
          setMessages(prev => prev.map(m => m.id === aiMessage.id ? { ...m, text: fullResponse } : m));
          setIsTyping(false);
        }
      }, 15);

    } catch (err) {
      console.error('Chat error:', err);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: 'Sorry, I encountered an error connecting to the decision server. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
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
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
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
            {messages.map((m, idx) => {
              const isAi = m.sender === 'ai';
              const isLastMessage = idx === messages.length - 1;
              return (
                <div 
                  key={m.id}
                  className={`flex ${isAi ? 'justify-start' : 'justify-end'} items-start gap-2.5 animate-[fade-in_0.2s_ease-out]`}
                >
                  {isAi && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-md shadow-indigo-500/10 shrink-0 border border-white/10 mt-1 select-none">
                      <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
                    </div>
                  )}
                  <div className={`max-w-[80%] p-3.5 rounded-2xl text-xs font-semibold leading-relaxed shadow-sm ${
                    isAi
                      ? 'bg-slate-800/85 text-slate-100 rounded-tl-none border border-slate-800/60'
                      : 'bg-indigo-650 text-white rounded-tr-none'
                  }`}>
                    <div className="space-y-1">
                      {renderMarkdown(m.text)}
                      {isAi && isLastMessage && isTyping && (
                        <span className="inline-block w-1.5 h-3.5 bg-indigo-450 ml-1 rounded-sm animate-pulse align-middle" />
                      )}
                    </div>
                    <span className="block text-[8px] text-slate-400 mt-2 text-right select-none">
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="flex justify-start items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-md shrink-0 border border-white/10 mt-1">
                  <Sparkles className="w-3.5 h-3.5 text-white animate-spin" />
                </div>
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
                  disabled={loading || isTyping}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-[10px] text-slate-300 font-bold rounded-xl border border-slate-700/40 cursor-pointer transition-colors"
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
              disabled={loading || isTyping}
              className="flex-1 bg-slate-900 border border-slate-800 text-xs text-slate-200 px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
            {(loading || isTyping) ? (
              <button
                onClick={handleStopTyping}
                className="p-2.5 bg-red-650 hover:bg-red-550 text-white rounded-xl shadow-md transition-colors cursor-pointer"
                title="Stop generation"
              >
                <Square className="w-4 h-4 fill-white" />
              </button>
            ) : (
              <button
                onClick={() => handleSend()}
                disabled={!inputText.trim()}
                className="p-2.5 bg-indigo-650 hover:bg-indigo-550 text-white rounded-xl shadow-md transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
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
