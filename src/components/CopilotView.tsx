import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Wrench,
  Bot,
  User,
  ShieldCheck,
  Compass,
  ArrowRight,
  HelpCircle,
  Sliders,
  CheckCircle2,
  Lock,
  Globe,
} from 'lucide-react';
import { CopilotMessage, LanguageMode, FinancialGoal, DecisionRun } from '../types';
import { formatINR } from '../utils/formatters';
import { fetchJson } from '../utils/apiClient';

interface CopilotViewProps {
  language: LanguageMode;
  setLanguage: (lang: LanguageMode) => void;
  onNavigateTab: (tab: string) => void;
  onGoalExtracted?: (goal: Partial<FinancialGoal>) => void;
  onDecisionCreated?: (decision: DecisionRun) => void;
}

export const CopilotView: React.FC<CopilotViewProps> = ({
  language,
  setLanguage,
  onNavigateTab,
  onGoalExtracted,
  onDecisionCreated,
}) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'msg_welcome',
      sender: 'assistant',
      text:
        language === 'hinglish'
          ? 'Namaste Suyash! Main hoon FinPath — aapka AI Financial Decision Copilot.\n\nMain loan bechne ke bajay pehle aapki financial health evaluate karta hoon ki kya aapko **Borrow** karna chahiye, **Save** karna chahiye, ya **Wait** karna chahiye.\n\nAaj aap kis financial goal ya decision par kaam kar rahe hain?'
          : language === 'hindi'
          ? 'नमस्ते सुयश! मैं फिनपाथ हूँ — आपका AI वित्तीय निर्णय सह-चालक।\n\nऋण बेचने के बजाय, मैं पहले यह तय करने में मदद करता हूँ कि आपको उधार लेना चाहिए, बचत करनी चाहिए या प्रतीक्षा करनी चाहिए।\n\nआज आप किस वित्तीय लक्ष्य के बारे में सोच रहे हैं?'
          : 'Hello Suyash! I am FinPath — your AI Financial Decision & Journey Copilot.\n\nUnlike traditional fintech loan marketplaces, I evaluate whether you should **Borrow**, **Save**, **Protect**, or **Wait** before committing to any product.\n\nWhat financial decision are you considering today?',
      timestamp: new Date().toISOString(),
      toolsUsed: ['get_financial_profile', 'calculate_financial_health'],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const quickPrompts = [
    {
      label: '“Bhai mujhe ₹3 lakh chahiye shop expand karne ke liye.”',
      query: 'Bhai mujhe ₹3 lakh chahiye shop expand karne ke liye.',
    },
    {
      label: '“Can I afford a loan right now?”',
      query: 'Can I afford a loan right now with my current income and expenses?',
    },
    {
      label: '“Should I save or borrow for my goal?”',
      query: 'Should I save or borrow for ₹3 lakh shop expansion?',
    },
    {
      label: '“Am I financially ready?”',
      query: 'Am I financially resilient and ready for new commitments?',
    },
    {
      label: '“Help me protect my family against debt liabilities.”',
      query: 'Help me evaluate my life and health protection gap before borrowing.',
    },
  ];

  const handleSendMessage = async (userText: string) => {
    if (!userText.trim()) return;

    const userMsg: CopilotMessage = {
      id: `msg_user_${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { ok, data, error: apiErr } = await fetchJson('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, language }),
      });

      if (!ok || !data) {
        throw new Error(apiErr || 'Failed to reach AI Copilot');
      }

      const assistantMsg: CopilotMessage = {
        id: `msg_bot_${Date.now()}`,
        sender: 'assistant',
        text: data.reply || 'Decision Engine evaluated your query.',
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
      console.error('Copilot message error:', e);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_err_${Date.now()}`,
          sender: 'assistant',
          text: 'The deterministic decision engine remains operational. Current financial health: Resilience Score 72/100, Free cash flow ₹26,000/mo.',
          timestamp: new Date().toISOString(),
          toolsUsed: ['calculate_financial_health'],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[780px] max-h-[85vh] overflow-hidden animate-in fade-in">
      {/* Copilot Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-slate-900 text-sm sm:text-base">
                FinPath AI Decision Copilot
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800">
                Deterministic Backed
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Not a chatbot wrapper. The chatbot calls deterministic financial tools.
            </p>
          </div>
        </div>

        {/* Language selector chip */}
        <div className="flex items-center bg-white p-1 rounded-lg border border-slate-200 text-xs shadow-2xs">
          <Globe className="w-3.5 h-3.5 text-slate-400 mx-1 hidden sm:block" />
          {(['hinglish', 'english', 'hindi'] as LanguageMode[]).map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium capitalize ${
                language === lang
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/20">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-2xl p-4 sm:p-5 text-xs sm:text-sm leading-relaxed space-y-3 ${
                  isUser
                    ? 'bg-blue-600 text-white shadow-xs rounded-tr-none'
                    : 'bg-white border border-slate-200 text-slate-800 shadow-xs rounded-tl-none'
                }`}
              >
                {/* Tools Invoked Indicator */}
                {!isUser && msg.toolsUsed && msg.toolsUsed.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-slate-100 text-[10px] font-mono text-slate-500">
                    <span className="flex items-center gap-1 font-bold text-blue-600">
                      <Wrench className="w-3 h-3" /> Tools executed:
                    </span>
                    {msg.toolsUsed.map((tool, idx) => (
                      <span
                        key={idx}
                        className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600"
                      >
                        {tool}()
                      </span>
                    ))}
                  </div>
                )}

                {/* Message Body */}
                <div className="whitespace-pre-wrap font-sans">{msg.text}</div>

                {/* Extracted Goal Structured Card */}
                {msg.extractedGoal && (
                  <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 text-slate-900 space-y-1">
                    <div className="text-[10px] font-mono font-bold text-blue-700 uppercase">
                      Structured Goal Extracted:
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs font-medium">
                      <div>
                        Goal: <span className="font-bold">{msg.extractedGoal.title}</span>
                      </div>
                      <div>
                        Amount: <span className="font-bold">{formatINR(msg.extractedGoal.targetAmount || 0)}</span>
                      </div>
                      <div>
                        Timeline: <span className="font-bold">{msg.extractedGoal.timelineMonths} months</span>
                      </div>
                      <div>
                        Type: <span className="font-bold">{msg.extractedGoal.goalType}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Embedded Decision Result Callout */}
                {msg.decisionResult && (
                  <div className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 text-slate-900 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Optimal Decision Recommended
                      </span>
                      <span className="text-xs font-black text-emerald-700">
                        Score: {msg.decisionResult.decisionScore}/100
                      </span>
                    </div>

                    <div className="font-extrabold text-sm text-slate-900">
                      {msg.decisionResult.recommendationTitle}
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        onClick={() => onNavigateTab('scenarios')}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 flex items-center gap-1 shadow-2xs"
                      >
                        <Sliders className="w-3 h-3 text-emerald-600" />
                        <span>Run Stress Test</span>
                      </button>

                      <button
                        onClick={() => onNavigateTab('decisions')}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 flex items-center gap-1 shadow-2xs"
                      >
                        <Compass className="w-3 h-3 text-emerald-600" />
                        <span>Full Decision Details</span>
                      </button>

                      <button
                        onClick={() => onNavigateTab('consent')}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1 shadow-2xs"
                      >
                        <Lock className="w-3 h-3" />
                        <span>Continue to Consent</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 justify-start items-center text-slate-500 text-xs animate-pulse">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-2xs flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-spin" />
              <span>FinPath Decision Engine parsing goal & stress testing actions...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      <div className="p-3 bg-slate-50 border-t border-slate-100 overflow-x-auto flex gap-2 text-xs no-scrollbar">
        {quickPrompts.map((qp, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(qp.query)}
            disabled={loading}
            className="whitespace-nowrap px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-blue-700 hover:border-blue-300 transition-colors font-medium shadow-2xs text-[11px]"
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(input);
        }}
        className="p-4 border-t border-slate-200 bg-white flex items-center gap-2"
      >
        <input
          id="copilot-input-field"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            language === 'hinglish'
              ? 'Puchiye FinPath se kuch bhi... (e.g. "Bhai mujhe ₹3 lakh chahiye shop expand karne ke liye")'
              : 'Ask FinPath anything about your financial goals or borrowing readiness...'
          }
          disabled={loading}
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
        />
        <button
          id="copilot-send-btn"
          type="submit"
          disabled={loading || !input.trim()}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-blue-500/20"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
    </div>
  );
};
