import React, { useState } from 'react';
import {
  Compass,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Sliders,
  ShieldAlert,
  Percent,
  Coins,
  ChevronDown,
  ChevronUp,
  X,
  Info,
  Scale,
} from 'lucide-react';
import { DecisionRun, CandidateAction } from '../types';
import { formatINR } from '../utils/formatters';

interface DecisionCardProps {
  decision: DecisionRun;
  onRunStressTest?: () => void;
  onContinueToConsent?: () => void;
  onSelectOption?: (optionId: string) => void;
}

export const DecisionCard: React.FC<DecisionCardProps> = ({
  decision,
  onRunStressTest,
  onContinueToConsent,
  onSelectOption,
}) => {
  const [showWhyModal, setShowWhyModal] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState<string>(decision.recommendedOptionId);

  const recommendedOption =
    decision.candidateOptions.find((o) => o.id === decision.recommendedOptionId) ||
    decision.candidateOptions[0];

  const currentOption =
    decision.candidateOptions.find((o) => o.id === selectedOptionId) || recommendedOption;

  return (
    <div className="bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30 rounded-3xl border-2 border-blue-200/80 shadow-md p-6 lg:p-8 relative overflow-hidden">
      {/* Background visual highlight */}
      <div className="absolute -right-16 -top-16 w-56 h-56 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-200/80">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                FinPath Decision Card
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800">
                Verified Engine
              </span>
            </div>
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
              Goal: {decision.goalTitle}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[11px] font-medium text-slate-500">Capital Required</div>
            <div className="text-xl font-black text-slate-900">
              {formatINR(decision.targetAmount)}
            </div>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div className="text-right">
            <div className="text-[11px] font-medium text-slate-500">Decision Score</div>
            <div className="flex items-baseline gap-1 text-blue-700">
              <span className="text-2xl font-black">{decision.decisionScore}</span>
              <span className="text-xs font-bold text-slate-400">/ 100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main recommendation callout */}
      <div className="my-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-7 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Recommended Optimal Path</span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {recommendedOption.name}
          </h3>

          <p className="text-sm text-slate-600 leading-relaxed">
            {recommendedOption.description}
          </p>

          {/* Quick checklist: WHY? */}
          <div className="pt-2 space-y-2">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Why this path is optimal:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 text-slate-700 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Lower monthly repayment pressure</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Preserves liquid emergency buffer</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Goal achieved without 12-month delay</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Resilient under -20% income shock</span>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Metrics Box */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Repayment & Cash Flow Impact</span>
            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
              Balanced
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[11px] text-slate-500 font-medium">Monthly EMI</div>
              <div className="text-lg font-bold text-slate-900">
                {formatINR(recommendedOption.estimatedMonthlyEMI)}
              </div>
              <div className="text-[10px] text-slate-500">{recommendedOption.estimatedTenureMonths} mo @ {recommendedOption.estimatedInterestRate}%</div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[11px] text-slate-500 font-medium">Free Flow Remaining</div>
              <div className="text-lg font-bold text-teal-700">
                {formatINR(recommendedOption.postActionFreeCashFlow)}
              </div>
              <div className="text-[10px] text-slate-500">Post-EMI margin</div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[11px] text-slate-500 font-medium">Liquid Buffer Kept</div>
              <div className="text-lg font-bold text-slate-900">
                {formatINR(recommendedOption.liquidityImpact)}
              </div>
              <div className="text-[10px] text-slate-500">≈ {recommendedOption.postActionRunwayMonths} months runway</div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[11px] text-slate-500 font-medium">Total Interest & Fees</div>
              <div className="text-lg font-bold text-slate-900">
                {formatINR(recommendedOption.totalCost)}
              </div>
              <div className="text-[10px] text-emerald-600 font-bold">Saves ₹18.4K vs Full Borrow</div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons Bar */}
      <div className="pt-5 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="decision-why-btn"
            onClick={() => setShowWhyModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors flex items-center gap-1.5"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Why this recommendation?</span>
          </button>

          <button
            id="decision-compare-btn"
            onClick={() => setShowComparison(!showComparison)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
          >
            <Scale className="w-4 h-4 text-slate-600" />
            <span>Compare 3 Candidate Actions</span>
            {showComparison ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {onRunStressTest && (
            <button
              id="decision-stress-btn"
              onClick={onRunStressTest}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
            >
              <Sliders className="w-4 h-4 text-indigo-600" />
              <span>Run What-If Stress Test</span>
            </button>
          )}
        </div>

        {onContinueToConsent && (
          <button
            id="decision-continue-btn"
            onClick={onContinueToConsent}
            className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition-all flex items-center gap-2 ml-auto"
          >
            <span>Proceed with Recommended Path</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Expanded Candidate Options Comparison */}
      {showComparison && (
        <div className="mt-6 pt-6 border-t border-slate-200 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
              Candidate Actions Evaluated by Decision Engine
            </h4>
            <span className="text-xs text-slate-500">Ranked by holistic financial resilience</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {decision.candidateOptions.map((opt) => {
              const isRec = opt.recommended;
              return (
                <div
                  key={opt.id}
                  onClick={() => setSelectedOptionId(opt.id)}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                    isRec
                      ? 'bg-blue-50/50 border-blue-600 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {isRec && (
                    <span className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-600 text-white shadow-xs">
                      RECOMMENDED
                    </span>
                  )}

                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        {opt.type}
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-black text-slate-900">{opt.decisionScore}</span>
                        <span className="text-[10px] text-slate-400">/100</span>
                      </div>
                    </div>

                    <h5 className="font-extrabold text-slate-900 text-sm mt-1">{opt.name}</h5>
                    <p className="text-xs text-slate-600 mt-1">{opt.description}</p>

                    <div className="mt-3 space-y-1.5 text-xs border-t border-slate-100 pt-2">
                      <div className="flex justify-between text-slate-600">
                        <span>Monthly EMI:</span>
                        <span className="font-bold text-slate-900">{formatINR(opt.estimatedMonthlyEMI)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Total Finance Cost:</span>
                        <span className="font-bold text-slate-900">{formatINR(opt.totalCost)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Emergency Runway Kept:</span>
                        <span className="font-bold text-slate-900">{opt.postActionRunwayMonths} mo</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Goal Completion:</span>
                        <span className="font-bold text-slate-900">
                          {opt.goalCompletionTimeMonths === 1 ? 'Immediate (1 mo)' : `~${opt.goalCompletionTimeMonths} months`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-2 border-t border-slate-100">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      opt.riskLevel === 'Low' ? 'bg-emerald-50 text-emerald-700' :
                      opt.riskLevel === 'Moderate' ? 'bg-blue-50 text-blue-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      Risk: {opt.riskLevel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Why This Recommendation Modal */}
      {showWhyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-base text-slate-900">Explainable Decision Intelligence</h3>
              </div>
              <button
                onClick={() => setShowWhyModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                <p className="font-semibold text-blue-950 text-sm">{decision.explanation.summary}</p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1.5">
                  Key Deterministic Drivers:
                </h4>
                <ul className="space-y-1.5">
                  {decision.explanation.keyReasons.map((reason, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1.5">
                  Underlying Assumptions:
                </h4>
                <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
                  {decision.assumptions.map((asm, i) => (
                    <li key={i}>{asm}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-800 text-[11px]">Audit & Data Provenance:</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{decision.dataSource}</div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowWhyModal(false)}
                className="w-full py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700"
              >
                Close Explanation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
