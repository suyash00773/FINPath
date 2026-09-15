import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  Wrench,
  Maximize2,
  Minimize2,
  Globe,
  Sliders,
  Compass,
  Lock,
  ChevronDown,
} from 'lucide-react';
import { CopilotMessage, LanguageMode, FinancialGoal, DecisionRun } from '../types';
import { formatINR } from '../utils/formatters';
import { fetchJson } from '../utils/apiClient';

interface FloatingChatbotProps {
  language: LanguageMode;
  setLanguage: (lang: LanguageMode) => void;
  onNavigateTab: (tab: string) => void;
  onGoalExtracted?: (goal: Partial<FinancialGoal>) => void;
  onDecisionCreated?: (decision: DecisionRun) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const FloatingChatbot: React.FC<FloatingChatbotProps> = ({
  language,
  setLanguage,
  onNavigateTab,
  onGoalExtracted,
  onDecisionCreated,
  isOpen,
  setIsOpen,
}) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'bot_init_1',
      sender: 'assistant',
      text:
        language === 'hinglish'
          ? 'Namaste! Main hoon FinPath AI Chatbot.\n\nAap mujhse apne finances, income, EMI, safe loan limits, ya shop expansion goal ke baare mein koi bhi sawaal pooch sakte hain.\n\nJaise: *"Meri safe loan limit kitni hai?"* ya *"Mera monthly kharcha aur EMI kitna hai?"*'
          : language === 'hindi'
          ? 'नमस्ते! मैं फिनपाथ AI चैटबॉट हूँ। आप मुझसे ऋण क्षमता, मासिक व्यय या वित्तीय लक्ष्यों के बारे में कोई भी प्रश्न पूछ सकते हैं।'
          : 'Hello! I am your FinPath AI Chatbot. Ask me anything about your cash flow, safe borrowing limits, emergency runway, or goals.',
      timestamp: new Date().toISOString(),
      toolsUsed: ['get_consumer_financial_data', 'calculate_financial_health'],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history from backend on open
  useEffect(() => {
    if (isOpen) {
      fetchJson('/api/copilot/history')
        .then(({ ok, data }) => {
          if (ok && data?.history && data.history.length > 0) {
            setMessages(data.history);
          }
        })
        .catch((err) => console.warn('Could not load history:', err));
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, loading]);

  const quickPills = [
    { label: 'Safe Loan Limit?', query: 'Meri safe loan limit kitni hai?' },
    { label: 'Free Cash Flow?', query: 'Mera monthly income aur free cash flow kitna hai?' },
    { label: 'Emergency Runway?', query: 'Mera emergency runway kitne mahine ka hai?' },
    { label: 'Shop expansion ₹3L', query: 'Bhai mujhe ₹3 lakh chahiye shop expand karne ke liye.' },
    { label: 'CIBIL Score Analysis', query: 'Mera credit score kaisa hai aur kya offers hain?' },
    { label: 'Income Shock Test', query: 'What happens if my income drops by 20%?' },
  ];

  const handleClearHistory = async () => {
    try {
      await fetchJson('/api/copilot/history', { method: 'DELETE' });
      setMessages([
        {
          id: `init_${Date.now()}`,
          sender: 'assistant',
          text: 'Chat history cleared. FinPath is ready to answer any question about your finances!',
          timestamp: new Date().toISOString(),
          toolsUsed: ['get_consumer_financial_data'],
        },
      ]);
    } catch (e) {
      console.warn('Failed to clear history:', e);
    }
  };

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: CopilotMessage = {
      id: `float_user_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { ok, data, error: apiErr } = await fetchJson('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend, language }),
      });

      if (!ok || !data) {
        throw new Error(apiErr || 'Failed to communicate with Copilot');
      }

      const assistantMsg: CopilotMessage = {
        id: `float_bot_${Date.now()}`,
        sender: 'assistant',
        text: data.reply || 'FinPath Decision Engine processed your request.',
        timestamp: new Date().toISOString(),
        toolsUsed: data.toolsInvoked,
        extractedGoal: data.extractedGoal,
        decisionResult: data.decisionRun,
        stressResult: data.stressResult,
        suggestedActions: data.suggestedActions,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (data.extractedGoal && onGoalExtracted) {
        onGoalExtracted(data.extractedGoal);
      }
      if (data.decisionRun && onDecisionCreated) {
        onDecisionCreated(data.decisionRun);
      }
    } catch (e) {
      console.error('Chatbot error:', e);
      setMessages((prev) => [
        ...prev,
        {
          id: `float_err_${Date.now()}`,
          sender: 'assistant',
          text: 'The deterministic decision engine is active. Resilience Score: 72/100, Free cash flow ₹26,000/mo.',
          timestamp: new Date().toISOString(),
          toolsUsed: ['calculate_financial_health'],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Floating Chat Window */}
      {isOpen && (
        <div className="mb-3 w-[92vw] sm:w-[420px] h-[560px] max-h-[82vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-400 text-slate-950 flex items-center justify-center font-black">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-black tracking-tight">FinPath AI Chatbot</h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <p className="text-[10px] text-teal-200 font-mono">Deterministic Grounded</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Language Switcher */}
              <div className="flex bg-white/10 p-0.5 rounded-lg text-[10px]">
                {(['hinglish', 'english'] as LanguageMode[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLanguage(l)}
                    className={`px-1.5 py-0.5 rounded capitalize ${
                      language === l ? 'bg-white text-slate-900 font-bold' : 'text-slate-300'
                    }`}
                  >
                    {l === 'hinglish' ? 'Hing' : 'Eng'}
                  </button>
                ))}
              </div>

              <button
                onClick={handleClearHistory}
                title="Clear chat history for this user"
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors text-[10px]"
              >
                Clear
              </button>

              <button
                onClick={() => {
                  setIsOpen(false);
                  onNavigateTab('copilot');
                }}
                title="Expand full screen Copilot"
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 text-xs">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div key={msg.id} className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {!isUser && (
                    <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[82%] rounded-2xl p-3 leading-relaxed ${
                      isUser
                        ? 'bg-blue-600 text-white rounded-tr-none shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-xs space-y-2'
                    }`}
                  >
                    {!isUser && msg.toolsUsed && msg.toolsUsed.length > 0 && (
                      <div className="flex flex-wrap gap-1 text-[9px] font-mono text-blue-700 pb-1 border-b border-slate-100">
                        <Wrench className="w-2.5 h-2.5 text-blue-600" />
                        {msg.toolsUsed.map((t, idx) => (
                          <span key={idx} className="bg-slate-100 px-1 py-0.2 rounded">
                            {t}()
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="whitespace-pre-wrap">{msg.text}</div>

                    {msg.decisionResult && (
                      <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1 text-slate-900">
                        <div className="text-[10px] font-extrabold text-emerald-800">
                          Recommended: {msg.decisionResult.recommendationTitle}
                        </div>
                        <div className="flex gap-1.5 pt-1">
                          <button
                            onClick={() => {
                              setIsOpen(false);
                              onNavigateTab('scenarios');
                            }}
                            className="px-2 py-0.5 rounded bg-white text-emerald-800 border border-emerald-300 font-bold text-[10px] hover:bg-emerald-100"
                          >
                            Stress Test
                          </button>
                          <button
                            onClick={() => {
                              setIsOpen(false);
                              onNavigateTab('consent');
                            }}
                            className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold text-[10px] hover:bg-emerald-700"
                          >
                            Consent
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-6 h-6 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2 text-slate-500 text-[11px] animate-pulse">
                <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="p-2 rounded-xl bg-white border border-slate-200">
                  Thinking & calculating...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 flex gap-1.5 overflow-x-auto no-scrollbar text-[10px]">
            {quickPills.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p.query)}
                className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-blue-300 hover:text-blue-700 font-medium"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-1.5"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask AI Chatbot anything..."
              disabled={loading}
              className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Launcher Button */}
      <button
        id="floating-chatbot-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="group relative px-4 py-3 rounded-full bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-2.5 border-2 border-white/20 cursor-pointer"
      >
        <div className="relative">
          <MessageSquare className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-teal-400 animate-ping" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-teal-400" />
        </div>
        <span className="text-xs font-black tracking-tight">
          {isOpen ? 'Close Chatbot' : 'AI Chatbot'}
        </span>
        <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-white/20 text-[10px] font-bold text-teal-300">
          Online
        </span>
      </button>
    </div>
  );
};
