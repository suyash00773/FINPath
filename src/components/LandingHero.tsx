import React from 'react';
import {
  Compass,
  ArrowRight,
  ShieldCheck,
  Sliders,
  Sparkles,
  TrendingUp,
  Lock,
  Layers,
  CheckCircle2,
  Users,
} from 'lucide-react';

interface LandingHeroProps {
  onLaunchDashboard: () => void;
  onLaunchCopilot: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onLaunchDashboard,
  onLaunchCopilot,
}) => {
  const steps = [
    { num: '01', title: 'Goal Intent', desc: 'State any natural language goal (e.g. ₹3L shop expansion).' },
    { num: '02', title: 'Health Diagnostic', desc: 'Compute cash flow, debt ratio & emergency runway.' },
    { num: '03', title: 'What-If Simulation', desc: 'Stress test against income shocks and interest spikes.' },
    { num: '04', title: 'Ranked Decision', desc: 'Compare Borrow vs Save vs Protect vs Wait.' },
    { num: '05', title: 'Consent & Journey', desc: 'Account Aggregator privacy + ecosystem partner handoff.' },
  ];

  return (
    <div className="space-y-12 animate-in fade-in pb-12">
      {/* Hero Container */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-blue-950 via-slate-900 to-slate-950 text-white p-8 sm:p-14 border border-blue-900/60 shadow-2xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-teal-300 border border-white/10 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Financial Decision & Journey Copilot</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1]">
            Don't just find a financial product.<br />
            <span className="bg-gradient-to-r from-blue-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
              Find the right financial path.
            </span>
          </h1>

          <p className="text-lg text-slate-300 leading-relaxed font-normal">
            “Borrow. Save. Protect. Wait.”
            <br />
            <span className="text-sm text-slate-400">
              The market has products. FinPath has the decision. We help you evaluate whether you should borrow, save, or wait before committing to debt.
            </span>
          </p>

          <div className="pt-4 flex flex-wrap items-center gap-4">
            <button
              id="hero-launch-dashboard"
              onClick={onLaunchDashboard}
              className="px-6 py-3.5 rounded-2xl text-sm font-extrabold text-slate-950 bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 transition-all flex items-center gap-2 shadow-lg shadow-teal-500/25 cursor-pointer"
            >
              <span>Launch Financial Command Center</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              id="hero-launch-copilot"
              onClick={onLaunchCopilot}
              className="px-6 py-3.5 rounded-2xl text-sm font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all flex items-center gap-2 backdrop-blur-md cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>Talk to AI Copilot</span>
            </button>
          </div>

          <div className="pt-6 border-t border-white/10 flex flex-wrap items-center gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
              <span>Deterministic Mathematics Authority</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
              <span>Account Aggregator (AA) Ready</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
              <span>Paytm Ecosystem Architecture</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5-Step Visual Roadmap */}
      <div className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wider">
            Decision Framework
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            How FinPath Guides Your Money
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            A continuous, fiduciary loop that eliminates impulse borrowing and defaults
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {steps.map((step, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-blue-300 transition-all"
            >
              <div className="text-2xl font-black text-blue-600/30 mb-2 font-mono">
                {step.num}
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">{step.title}</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Team Error Footer Callout */}
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black">
            TE
          </div>
          <div>
            <div className="font-extrabold text-slate-900">Developed by Team Error</div>
            <div className="text-slate-500">
              Suyash Bajpai (Team Leader) & Vanya Tripathi (Team Member)
            </div>
          </div>
        </div>

        <div className="text-slate-500 text-center sm:text-right">
          <span className="font-bold text-slate-800">Core Positioning:</span> “The market has products. FinPath has the decision.”
        </div>
      </div>
    </div>
  );
};
