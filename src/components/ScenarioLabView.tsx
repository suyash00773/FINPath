import React, { useState, useEffect } from 'react';
import {
  Sliders,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Info,
  DollarSign,
  PieChart,
} from 'lucide-react';
import {
  FinancialProfile,
  FinancialGoal,
  StressTestScenario,
  StressTestResult,
  DecisionRun,
} from '../types';
import { formatINR } from '../utils/formatters';
import { fetchJson } from '../utils/apiClient';

interface ScenarioLabViewProps {
  profile: FinancialProfile;
  goal: FinancialGoal;
  decision: DecisionRun;
  onContinueToConsent: () => void;
}

export const ScenarioLabView: React.FC<ScenarioLabViewProps> = ({
  profile,
  goal,
  decision,
  onContinueToConsent,
}) => {
  const [incomePct, setIncomePct] = useState<number>(0);
  const [expensePct, setExpensePct] = useState<number>(0);
  const [emergencyExpense, setEmergencyExpense] = useState<number>(0);
  const [interestDelta, setInterestDelta] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [stressResult, setStressResult] = useState<StressTestResult | null>(null);

  // Function to call API for stress test
  const executeStressTest = async (
    inc: number,
    exp: number,
    emg: number,
    intDelta: number
  ) => {
    setLoading(true);
    try {
      const scenario: StressTestScenario = {
        id: `scen_${Date.now()}`,
        name: `Stress Test (Inc ${inc}%, Exp ${exp}%)`,
        incomeChangePct: inc,
        expenseChangePct: exp,
        unexpectedEmergencyExpense: emg,
        loanInterestRateDelta: intDelta,
      };

      const { ok, data } = await fetchJson('/api/scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario, goalId: goal.id }),
      });

      if (ok && data?.result) {
        setStressResult(data.result);
      }
    } catch (e) {
      console.error('Failed to run scenario:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    executeStressTest(incomePct, expensePct, emergencyExpense, interestDelta);
  }, [incomePct, expensePct, emergencyExpense, interestDelta]);

  const handleResetToBaseline = () => {
    setIncomePct(0);
    setExpensePct(0);
    setEmergencyExpense(0);
    setInterestDelta(0);
  };

  const handlePresetNegativeShock = () => {
    setIncomePct(-20);
    setExpensePct(10);
    setEmergencyExpense(25000);
    setInterestDelta(1);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-teal-300 border border-white/10 mb-2">
              <Sliders className="w-3.5 h-3.5" />
              <span>What-If Financial Lab</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Interactive Stress Test Simulator
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Real financial intelligence tests fragility before signing a loan. Move the sliders to test income shocks, emergency bills, and interest spikes to witness FinPath's decision engine adapt in real-time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePresetNegativeShock}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors shadow-sm flex items-center gap-1.5"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Simulate -20% Income Crisis</span>
            </button>
            <button
              onClick={handleResetToBaseline}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 text-white hover:bg-white/20 transition-colors border border-white/15 flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Baseline</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Recommendation Shift Alert Banner */}
      {stressResult?.recommendationChanged && (
        <div className="p-5 rounded-2xl bg-amber-500/15 border-2 border-amber-500 shadow-md flex items-start gap-4 animate-in slide-in-from-top-2">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
            <AlertTriangle className="w-5 h-5 font-bold" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-extrabold text-amber-900 uppercase tracking-wide text-xs">
                Dynamic Decision Shift Activated
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-amber-200 text-amber-900 font-black">
                Resilience Protection
              </span>
            </div>
            <h3 className="text-base font-extrabold text-slate-900 mt-1">
              Decision Shift: Wait + Save is now the safest path
            </h3>
            <p className="text-xs text-slate-700 mt-1 leading-relaxed">
              {stressResult.decisionShiftReason}
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: Controls Left, Live Real-time Results Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Stress Controls (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              <span>Variable Controls</span>
            </h2>
            <span className="text-xs text-slate-400 font-medium">Live recalculation</span>
          </div>

          {/* 1. Monthly Income Adjustment */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700">Monthly Income Variation</span>
              <span className={`font-extrabold px-2 py-0.5 rounded ${
                incomePct < 0 ? 'bg-rose-100 text-rose-700' : incomePct > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
              }`}>
                {incomePct > 0 ? `+${incomePct}%` : `${incomePct}%`} (
                {formatINR(profile.monthlyIncome * (1 + incomePct / 100))})
              </span>
            </div>
            <input
              type="range"
              min="-20"
              max="20"
              step="5"
              value={incomePct}
              onChange={(e) => setIncomePct(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
              <span>-20% (Shock)</span>
              <span>-10%</span>
              <span>0% (Base)</span>
              <span>+10%</span>
              <span>+20%</span>
            </div>
          </div>

          {/* 2. Expenses Variation */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700">Essential Expenses Inflation</span>
              <span className={`font-extrabold px-2 py-0.5 rounded ${
                expensePct > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
              }`}>
                {expensePct > 0 ? `+${expensePct}%` : `${expensePct}%`} (
                {formatINR(profile.essentialMonthlyExpenses * (1 + expensePct / 100))})
              </span>
            </div>
            <input
              type="range"
              min="-10"
              max="25"
              step="5"
              value={expensePct}
              onChange={(e) => setExpensePct(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
              <span>-10%</span>
              <span>0% (Base)</span>
              <span>+15%</span>
              <span>+25% (High inflation)</span>
            </div>
          </div>

          {/* 3. Unexpected Emergency Outflow */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700">Surprise Emergency Medical / Bill</span>
              <span className="font-extrabold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                {formatINR(emergencyExpense)}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2 pt-1">
              {[0, 25000, 50000, 100000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setEmergencyExpense(val)}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-colors border ${
                    emergencyExpense === val
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {val === 0 ? '₹0' : val === 25000 ? '₹25K' : val === 50000 ? '₹50K' : '₹1L'}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Loan Interest Rate Delta */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700">RBI Repo / Partner Rate Spike</span>
              <span className="font-extrabold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                +{interestDelta}% p.a.
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2 pt-1">
              {[0, 1, 2, 3].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setInterestDelta(rate)}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-colors border ${
                    interestDelta === rate
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  +{rate}%
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Live Stress Comparison (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Side-by-side comparison table */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Impact Comparison: Base Case vs Stressed Case
              </h3>
              {loading && <span className="text-xs text-blue-600 font-semibold animate-pulse">Calculating...</span>}
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              {/* Base Case Column */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px]">
                    Base Case (Normal)
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-slate-200 text-slate-700 font-bold">
                    Steady State
                  </span>
                </div>

                <div className="space-y-2">
                  <div>
                    <div className="text-slate-500 text-[11px]">Monthly Free Cash Flow:</div>
                    <div className="text-lg font-black text-slate-900">
                      {formatINR(stressResult?.baseCashFlow ?? 26000)}
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-500 text-[11px]">Emergency Runway:</div>
                    <div className="text-base font-bold text-slate-800">
                      {stressResult?.baseRunway ?? 3.1} months
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-500 text-[11px]">Existing Debt Ratio:</div>
                    <div className="text-base font-bold text-slate-800">
                      {((stressResult?.baseDebtRatio ?? 0.11) * 100).toFixed(0)}%
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <div className="text-slate-500 text-[11px]">Recommended Decision:</div>
                    <div className="text-xs font-extrabold text-blue-700">
                      Borrow ₹2.5L + Save ₹50K
                    </div>
                  </div>
                </div>
              </div>

              {/* Stressed Case Column */}
              <div className={`p-4 rounded-2xl border-2 space-y-3 transition-colors ${
                stressResult?.recommendationChanged
                  ? 'bg-amber-50/70 border-amber-400 shadow-xs'
                  : 'bg-blue-50/40 border-blue-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">
                    Stressed Simulation
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                    stressResult?.recommendationChanged
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-blue-600 text-white'
                  }`}>
                    {incomePct < 0 ? `${incomePct}% Income` : 'Adjusted'}
                  </span>
                </div>

                <div className="space-y-2">
                  <div>
                    <div className="text-slate-500 text-[11px]">Stressed Free Cash Flow:</div>
                    <div className={`text-lg font-black ${
                      (stressResult?.stressedCashFlow ?? 26000) < 15000
                        ? 'text-rose-600'
                        : 'text-slate-900'
                    }`}>
                      {formatINR(stressResult?.stressedCashFlow ?? 26000)}
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-500 text-[11px]">Remaining Runway:</div>
                    <div className="text-base font-bold text-slate-800">
                      {stressResult?.stressedRunway ?? 3.1} months
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-500 text-[11px]">Stressed Debt Ratio:</div>
                    <div className="text-base font-bold text-slate-800">
                      {((stressResult?.stressedDebtRatio ?? 0.11) * 100).toFixed(0)}%
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <div className="text-slate-500 text-[11px]">Engine Optimal Action:</div>
                    <div className={`text-xs font-black ${
                      stressResult?.recommendationChanged ? 'text-amber-900' : 'text-blue-700'
                    }`}>
                      {stressResult?.recommendationChanged
                        ? 'Wait + Save (Zero New Debt)'
                        : 'Borrow ₹2.5L + Save ₹50K'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual breakdown of why */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p>
                <strong>The Wow Factor:</strong> Notice how when your income drops, FinPath does not act as a predatory loan seller. Instead, it actively protects your household solvency by deprioritizing borrowing and pivoting to savings.
              </p>
            </div>
          </div>

          {/* Action button */}
          <div className="flex justify-end">
            <button
              onClick={onContinueToConsent}
              className="px-6 py-2.5 rounded-xl text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm"
            >
              <span>Continue to Consent & Journey Tracker</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
