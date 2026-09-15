import React, { useState } from 'react';
import {
  Send,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building,
  FileCheck,
  CreditCard,
  Check,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { JourneyRecord, JourneyStep } from '../types';
import { formatDate } from '../utils/formatters';

interface JourneyTrackerViewProps {
  journey: JourneyRecord;
  onAdvanceStep: (journeyId: string, currentStepIndex: number) => Promise<void>;
  onViewAudit: () => void;
}

export const JourneyTrackerView: React.FC<JourneyTrackerViewProps> = ({
  journey,
  onAdvanceStep,
  onViewAudit,
}) => {
  const [advancing, setAdvancing] = useState(false);

  const handleAdvance = async () => {
    setAdvancing(true);
    try {
      await onAdvanceStep(journey.id, journey.currentStepIndex);
    } finally {
      setAdvancing(false);
    }
  };

  const completedSteps = journey.steps.filter((s) => s.status === 'completed').length;
  const progressPct = Math.round((completedSteps / journey.steps.length) * 100);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Journey Header Card */}
      <div className="bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-teal-300 border border-white/10 mb-2">
              <Send className="w-3.5 h-3.5" />
              <span>Active Execution Journey</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {journey.goalTitle} Journey
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Path Chosen: <span className="font-bold text-white">{journey.recommendedAction}</span>
            </p>
            <div className="text-xs text-teal-300 mt-1 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5" />
              <span>Ecosystem Partner: {journey.assignedPartner || 'Paytm Lending (Aditya Birla Capital)'}</span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 shrink-0 text-right">
            <div className="text-xs text-slate-300 font-medium">Journey Progress</div>
            <div className="text-3xl font-black text-white">{progressPct}%</div>
            <div className="text-[11px] text-teal-300 mt-0.5">
              {completedSteps} of {journey.steps.length} milestones complete
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-6 w-full bg-white/20 h-2 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-teal-400 to-emerald-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Main Steps Timeline */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Deterministic Journey Milestones
            </h2>
            <p className="text-xs text-slate-500">
              Each milestone maintains cryptographic state in the immutable audit log
            </p>
          </div>

          {journey.currentStepIndex < journey.steps.length - 1 && (
            <button
              onClick={handleAdvance}
              disabled={advancing}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{advancing ? 'Executing...' : 'Advance Next Milestone'}</span>
            </button>
          )}
        </div>

        <div className="space-y-6">
          {journey.steps.map((step, index) => {
            const isCompleted = step.status === 'completed';
            const isActive = step.status === 'active';
            const isUpcoming = step.status === 'upcoming';

            return (
              <div key={step.id} className="flex items-start gap-4 relative">
                {/* Connecting vertical line */}
                {index < journey.steps.length - 1 && (
                  <div
                    className={`absolute left-4 top-9 bottom-0 w-0.5 -mb-6 ${
                      isCompleted ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                  />
                )}

                {/* Step Circle Icon */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 transition-all ${
                    isCompleted
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : isActive
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100 animate-pulse'
                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : (
                    <span className="text-xs font-bold">{index + 1}</span>
                  )}
                </div>

                {/* Step Details Box */}
                <div
                  className={`flex-1 p-4 rounded-2xl border transition-all ${
                    isActive
                      ? 'bg-blue-50/50 border-blue-200 shadow-xs'
                      : isCompleted
                      ? 'bg-white border-slate-200'
                      : 'bg-slate-50/50 border-slate-200/60 opacity-60'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-extrabold text-slate-900">{step.title}</h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          isCompleted
                            ? 'bg-emerald-100 text-emerald-800'
                            : isActive
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {step.status}
                      </span>
                    </div>
                    {step.timestamp && (
                      <span className="text-[11px] text-slate-400">
                        {formatDate(step.timestamp)}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {step.description}
                  </p>

                  {step.actionRequired && (
                    <div className="mt-2 text-xs font-bold text-blue-700 bg-blue-100/70 px-3 py-1.5 rounded-lg border border-blue-200 inline-block">
                      Action Required: {step.actionRequired}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer link to Audit */}
      <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-200">
        <span className="text-xs text-slate-600 font-medium">
          Every journey state transition is verified in the immutable audit log.
        </span>
        <button
          onClick={onViewAudit}
          className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          <span>View Decision Replay in Audit Log</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
