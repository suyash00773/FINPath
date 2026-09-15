import React, { useState } from 'react';
import {
  GitBranch,
  Plus,
  Compass,
  Sliders,
  Send,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  ArrowRight,
  X,
} from 'lucide-react';
import { FinancialGoal, GoalType } from '../types';
import { formatINR, formatDate } from '../utils/formatters';

interface GoalsViewProps {
  goals: FinancialGoal[];
  onCreateGoal: (newGoal: Partial<FinancialGoal>) => Promise<void>;
  onSelectGoalForDecision: (goal: FinancialGoal) => void;
  onSelectGoalForWhatIf: (goal: FinancialGoal) => void;
  onSelectGoalForJourney: (goal: FinancialGoal) => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({
  goals,
  onCreateGoal,
  onSelectGoalForDecision,
  onSelectGoalForWhatIf,
  onSelectGoalForJourney,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState<number>(300000);
  const [timelineMonths, setTimelineMonths] = useState<number>(3);
  const [goalType, setGoalType] = useState<GoalType>('business_expansion');
  const [urgency, setUrgency] = useState<'flexible' | 'moderate' | 'strict'>('moderate');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || targetAmount <= 0) return;
    setSubmitting(true);
    try {
      await onCreateGoal({
        title,
        targetAmount,
        timelineMonths,
        goalType,
        urgency,
        notes,
      });
      setShowModal(false);
      setTitle('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 mb-2">
            <GitBranch className="w-3.5 h-3.5" />
            <span>Goal Portfolio</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Financial Goals & Milestones
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl leading-relaxed">
            Every decision begins with a clear, quantified goal. FinPath attaches deterministic decision runs and stress tests to each milestone.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all flex items-center gap-1.5 shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Define New Goal</span>
        </button>
      </div>

      {/* Goals Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {goals.map((goal) => {
          const isShop = goal.id.includes('shop');
          return (
            <div
              key={goal.id}
              className={`p-6 rounded-3xl border-2 transition-all flex flex-col justify-between ${
                isShop
                  ? 'bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30 border-blue-300 shadow-xs'
                  : 'bg-white border-slate-200 shadow-2xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                    {goal.goalType.replace(/_/g, ' ')}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      goal.status === 'evaluating'
                        ? 'bg-amber-100 text-amber-800'
                        : goal.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {goal.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <h3 className="text-xl font-extrabold text-slate-900 mt-2">{goal.title}</h3>

                <div className="my-4 grid grid-cols-2 gap-3 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80">
                  <div>
                    <div className="text-[11px] text-slate-500 font-medium">Target Required</div>
                    <div className="text-xl font-black text-slate-900">
                      {formatINR(goal.targetAmount)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500 font-medium">Target Timeline</div>
                    <div className="text-base font-bold text-slate-800">
                      {goal.timelineMonths} months
                    </div>
                  </div>
                </div>

                {goal.notes && (
                  <p className="text-xs text-slate-600 mb-3 leading-relaxed italic">
                    "{goal.notes}"
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-200/80 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => onSelectGoalForDecision(goal)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors flex items-center gap-1.5"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Decision Engine</span>
                </button>

                <button
                  onClick={() => onSelectGoalForWhatIf(goal)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Stress Test</span>
                </button>

                <button
                  onClick={() => onSelectGoalForJourney(goal)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors flex items-center gap-1.5 ml-auto"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Journey</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Goal Creator Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-lg text-slate-900">Define Financial Goal</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Goal Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Shop Expansion / Commercial Inventory"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Capital (₹)</label>
                  <input
                    type="number"
                    required
                    min="1000"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Timeline (Months)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="120"
                    value={timelineMonths}
                    onChange={(e) => setTimelineMonths(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Category / Type</label>
                <select
                  value={goalType}
                  onChange={(e) => setGoalType(e.target.value as GoalType)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                >
                  <option value="business_expansion">Business Expansion</option>
                  <option value="emergency_fund">Emergency Fund</option>
                  <option value="home_renovation">Home Renovation</option>
                  <option value="education">Education</option>
                  <option value="vehicle">Vehicle</option>
                  <option value="debt_consolidation">Debt Consolidation</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Purpose Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional context for the decision engine..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700"
              >
                {submitting ? 'Creating...' : 'Register Goal & Run Decision Engine'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
