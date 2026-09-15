import React from 'react';
import {
  Layers,
  Sparkles,
  ShieldCheck,
  Compass,
  GitBranch,
  Cpu,
  TrendingUp,
  Award,
  Users,
  Building,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react';

export const MoatView: React.FC = () => {
  const competitorComparison = [
    {
      category: 'FinPath',
      workflow: 'Understand → Simulate → Decide → Act',
      focus: 'Cross-financial decision intelligence (Borrow/Save/Protect/Wait)',
      moat: 'Deterministic Decision Engine + Dynamic What-If Stress Testing',
      isFinpath: true,
    },
    {
      category: 'Paytm Ecosystem',
      workflow: 'Payment → Distribute → Engage',
      focus: 'Mass distribution, merchant loans & consumer financial products',
      moat: 'Unrivaled distribution, QR merchant network & UPI payments',
      synergy: 'FinPath provides the intelligence layer for Paytm products',
    },
    {
      category: 'Policybazaar',
      workflow: 'Search → Compare quotes → Buy',
      focus: 'Insurance broker & premium comparison',
      moat: 'Insurance aggregator scale',
    },
    {
      category: 'BankBazaar',
      workflow: 'Lead Gen → Credit cards / Loans → Apply',
      focus: 'Product distribution & commission lead gen',
      moat: 'Bank affiliate network',
    },
    {
      category: 'INDmoney / Fi',
      workflow: 'Connect data → Track net worth → Invest',
      focus: 'Personal finance tracking & investment execution',
      moat: 'Account Aggregator tracking UI',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Big Moat Statement Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-teal-300 border border-white/10">
            <Layers className="w-3.5 h-3.5" />
            <span>FinPath Core Architectural Moat</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
            “Our moat is not the chatbot.<br />
            It is the Decision Engine.”
          </h1>

          <p className="text-base text-slate-300 leading-relaxed">
            The market is saturated with chatbots and loan marketplaces eager to sell credit at any cost. FinPath is built for the decision in between: answering the critical question <strong>“Should I borrow, save, protect, or wait?”</strong> before committing to a contract.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <span className="px-3 py-1 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold">
              Borrow. Save. Protect. Wait.
            </span>
            <span className="px-3 py-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold">
              Deterministic Math Authority
            </span>
            <span className="px-3 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold">
              Account Aggregator Ready
            </span>
          </div>
        </div>
      </div>

      {/* Decision Graph Flow Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">
            The Financial Decision Graph
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            How FinPath transforms raw user intent into verifiable financial decisions:
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 text-center text-xs">
          {[
            { step: '1. Goal', desc: 'Purpose & timeline' },
            { step: '2. Health', desc: 'Cash flow & runway' },
            { step: '3. Actions', desc: 'Borrow / Save / Wait' },
            { step: '4. Stress Test', desc: '-20% Income shocks' },
            { step: '5. Decision', desc: 'Ranked resilience' },
            { step: '6. Consent', desc: 'Purpose-bound AA' },
            { step: '7. Journey', desc: 'Partner execution' },
          ].map((node, i) => (
            <div
              key={i}
              className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-center items-center gap-1 shadow-2xs"
            >
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                {i + 1}
              </div>
              <div className="font-extrabold text-slate-900 text-xs mt-1">{node.step}</div>
              <div className="text-[10px] text-slate-500">{node.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Paytm Ecosystem Synergy */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Paytm Ecosystem Synergy</h3>
              <p className="text-xs text-slate-500">Distribution Meets Decision Intelligence</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs text-slate-700 leading-relaxed space-y-2">
            <div className="font-bold text-blue-950 text-sm">
              “Paytm has the distribution. FinPath adds the decision intelligence.”
            </div>
            <p>
              Paytm powers millions of merchants with Soundbox, QR codes, and personal loans. By plugging the FinPath Decision Engine into Paytm Merchant journeys, merchants no longer blindly accept loans they cannot service.
            </p>
            <p className="font-medium text-blue-800">
              Result: Lower default rates for lending partners, higher merchant trust, and sustainable long-term business growth.
            </p>
          </div>
        </div>

        {/* Team Error Credentials */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Built by Team Error</h3>
              <p className="text-xs text-slate-500">Production Fintech Architecture</p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm">Suyash Bajpai</h4>
                <p className="text-xs text-slate-500">Team Leader • Full-Stack & AI Architecture</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800">
                Team Leader
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm">Vanya Tripathi</h4>
                <p className="text-xs text-slate-500">Team Member • Fintech Product Design & Security</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-800">
                Team Member
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Competitive Differentiation Matrix */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-extrabold text-slate-900 text-base">
          Workflow Differentiation: How FinPath Outperforms Existing Fintechs
        </h3>
        <p className="text-xs text-slate-500">
          The difference is the workflow: FinPath is not a broker, but a fiduciary decision co-pilot.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">Fintech Platform</th>
                <th className="py-3 px-3">Primary User Workflow</th>
                <th className="py-3 px-3">Core Positioning</th>
                <th className="py-3 px-3">Defensive Moat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {competitorComparison.map((comp, i) => (
                <tr
                  key={i}
                  className={`${
                    comp.isFinpath
                      ? 'bg-blue-50/60 font-bold text-slate-900'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <td className="py-3 px-3 font-extrabold flex items-center gap-1.5">
                    {comp.isFinpath && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                    <span>{comp.category}</span>
                  </td>
                  <td className="py-3 px-3">{comp.workflow}</td>
                  <td className="py-3 px-3">{comp.focus}</td>
                  <td className="py-3 px-3">{comp.moat}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
