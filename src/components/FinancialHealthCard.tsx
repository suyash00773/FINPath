import React from 'react';
import {
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  AlertOctagon,
  Sparkles,
} from 'lucide-react';
import { FinancialHealth, FinancialProfile } from '../types';
import { formatINR } from '../utils/formatters';

interface FinancialHealthCardProps {
  health: FinancialHealth;
  profile: FinancialProfile;
  onOpenWhatIf?: () => void;
  onOpenProtection?: () => void;
}

export const FinancialHealthCard: React.FC<FinancialHealthCardProps> = ({
  health,
  profile,
  onOpenWhatIf,
  onOpenProtection,
}) => {
  // Determine color based on resilience score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 65) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 45) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  const scoreBadgeClass = getScoreColor(health.resilienceScore);

  return (
    <div className="space-y-6">
      {/* Debt Rescue Mode Banner if active */}
      {health.inDebtRescueMode && (
        <div className="p-4 rounded-xl bg-rose-50 border-2 border-rose-300 shadow-sm flex items-start gap-3 animate-pulse">
          <AlertOctagon className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-rose-900 uppercase tracking-wide text-xs">
                Debt Rescue Mode Activated
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-rose-200 text-rose-800 font-bold">
                Safety Priority
              </span>
            </div>
            <p className="text-xs text-rose-800 mt-1">
              Your debt ratio or monthly cash flow is under severe stress. FinPath automatically locks high-leverage borrowing options and triggers repayment prioritization and wait-state saving.
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: Resilience Score + Cash Flow + Emergency Runway */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 1. Resilience Score Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Financial Resilience</h3>
                <p className="text-sm font-semibold text-slate-800">Holistic Readiness</p>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${scoreBadgeClass}`}>
              {health.statusLabel}
            </span>
          </div>

          <div className="my-4 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold tracking-tight text-slate-900">
              {health.resilienceScore}
            </span>
            <span className="text-base font-semibold text-slate-400">/ 100</span>
          </div>

          {/* Breakdown bars */}
          <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between text-slate-600">
              <span>Liquidity (Runway)</span>
              <span className="font-semibold text-slate-800">{health.scoreBreakdown.liquidity} / 25</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-teal-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${(health.scoreBreakdown.liquidity / 25) * 100}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span>Debt Load Control</span>
              <span className="font-semibold text-slate-800">{health.scoreBreakdown.debtLoad} / 25</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${(health.scoreBreakdown.debtLoad / 25) * 100}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span>Savings Rate</span>
              <span className="font-semibold text-slate-800">{health.scoreBreakdown.savings} / 20</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${(health.scoreBreakdown.savings / 20) * 100}%` }}
              />
            </div>
          </div>

          <p className="mt-3 text-[11px] text-slate-500 leading-relaxed border-t border-slate-100 pt-2">
            <strong>Why {health.resilienceScore}?</strong> Existing debt ratio ({(health.debtRatio * 100).toFixed(0)}%) is healthy, but emergency liquidity (3.1 mo) requires preservation during new commitments.
          </p>
        </div>

        {/* 2. Monthly Cash Flow Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Monthly Cash Flow</h3>
                <p className="text-sm font-semibold text-slate-800">Net Capacity</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
              Positive
            </span>
          </div>

          <div className="my-4">
            <div className="text-xs text-slate-500">Free Monthly Cash Flow</div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {formatINR(health.freeCashFlow)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Available buffer before taking on any new commitments
            </div>
          </div>

          <div className="space-y-1.5 border-t border-slate-100 pt-3 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span className="flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" /> Total Inflows
              </span>
              <span className="font-bold text-slate-800">{formatINR(health.monthlyIncome)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span className="flex items-center gap-1">
                <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" /> Essential Expenses
              </span>
              <span className="font-semibold text-slate-700">{formatINR(health.essentialExpenses)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-500" /> Existing EMI
              </span>
              <span className="font-semibold text-slate-700">{formatINR(health.existingEMI)}</span>
            </div>
          </div>

          {onOpenWhatIf && (
            <button
              onClick={onOpenWhatIf}
              className="mt-3 w-full py-1.5 px-3 rounded-lg text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simulate Income Shock in What-If Lab</span>
            </button>
          )}
        </div>

        {/* 3. Emergency Runway Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Emergency Runway</h3>
                <p className="text-sm font-semibold text-slate-800">Liquid Survival Buffer</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              {health.emergencyRunway >= 6 ? 'Adequate' : 'Moderate'}
            </span>
          </div>

          <div className="my-4">
            <div className="text-xs text-slate-500">Runway Duration</div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-baseline gap-2">
              <span>≈ {health.emergencyRunway}</span>
              <span className="text-base font-semibold text-slate-500">months</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Based on {formatINR(profile.liquidSavings)} liquid savings / {formatINR(health.essentialExpenses)} mo.
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
            <div className="flex justify-between text-slate-600">
              <span>Recommended Target:</span>
              <span className="font-bold text-slate-800">6.0 months (₹2,28,000)</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Current Liquid Gap:</span>
              <span className="font-semibold text-amber-700">{formatINR(228000 - profile.liquidSavings)}</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
              <div
                className="bg-amber-500 h-full rounded-full"
                style={{ width: `${Math.min(100, (profile.liquidSavings / 228000) * 100)}%` }}
              />
            </div>
          </div>

          {onOpenProtection && (
            <button
              onClick={onOpenProtection}
              className="mt-3 w-full py-1.5 px-3 rounded-lg text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Check Protection Shield ({profile.dependents} Dependents)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
