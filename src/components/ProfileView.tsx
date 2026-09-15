import React, { useState } from 'react';
import {
  User,
  Shield,
  Save,
  CheckCircle2,
  AlertTriangle,
  Info,
  DollarSign,
  HeartHandshake,
  Activity,
} from 'lucide-react';
import { FinancialProfile, FinancialHealth } from '../types';
import { formatINR } from '../utils/formatters';

interface ProfileViewProps {
  profile: FinancialProfile;
  health: FinancialHealth;
  onUpdateProfile: (updated: Partial<FinancialProfile>) => Promise<void>;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  health,
  onUpdateProfile,
}) => {
  const [formData, setFormData] = useState({
    monthlyIncome: profile.monthlyIncome,
    essentialMonthlyExpenses: profile.essentialMonthlyExpenses,
    existingMonthlyEMI: profile.existingMonthlyEMI,
    liquidSavings: profile.liquidSavings,
    creditScore: profile.creditScore,
    dependents: profile.dependents,
    existingLifeCover: profile.existingLifeCover,
    existingHealthCover: profile.existingHealthCover,
  });
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onUpdateProfile(formData);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const idealLifeCover = Math.max(5000000, formData.monthlyIncome * 12 * 10);
  const protectionGap = Math.max(0, idealLifeCover - formData.existingLifeCover);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 mb-2">
            <User className="w-3.5 h-3.5" />
            <span>Financial Snapshot & Profile</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Household Balance Sheet & Protection
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            All decision calculations and stress simulations derive deterministically from these variables. Update any field to observe the resilience engine adapt instantly.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Resilience Score: {health.resilienceScore}/100</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Profile Settings Form (8 cols) */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-extrabold text-slate-900">
              Core Cash Flow & Balance Sheet Inputs
            </h2>
            {savedSuccess && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Changes saved to ledger
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Monthly Net Inflows (Income)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  value={formData.monthlyIncome}
                  onChange={(e) =>
                    setFormData({ ...formData, monthlyIncome: Number(e.target.value) })
                  }
                  className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Essential Monthly Living Expenses
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  value={formData.essentialMonthlyExpenses}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      essentialMonthlyExpenses: Number(e.target.value),
                    })
                  }
                  className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Existing Monthly EMIs (Active Loans)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  value={formData.existingMonthlyEMI}
                  onChange={(e) =>
                    setFormData({ ...formData, existingMonthlyEMI: Number(e.target.value) })
                  }
                  className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Liquid Savings Buffer (Bank + Liquid FD)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  value={formData.liquidSavings}
                  onChange={(e) =>
                    setFormData({ ...formData, liquidSavings: Number(e.target.value) })
                  }
                  className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                CIBIL / Experian Credit Score
              </label>
              <input
                type="number"
                value={formData.creditScore}
                onChange={(e) =>
                  setFormData({ ...formData, creditScore: Number(e.target.value) })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Financially Dependent Family Members
              </label>
              <input
                type="number"
                value={formData.dependents}
                onChange={(e) =>
                  setFormData({ ...formData, dependents: Number(e.target.value) })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Existing Term Life Cover (Sum Assured)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  value={formData.existingLifeCover}
                  onChange={(e) =>
                    setFormData({ ...formData, existingLifeCover: Number(e.target.value) })
                  }
                  className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Health Insurance Family Cover
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  value={formData.existingHealthCover}
                  onChange={(e) =>
                    setFormData({ ...formData, existingHealthCover: Number(e.target.value) })
                  }
                  className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Updating Ledger...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>

        {/* Protection Gap Analysis Box (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Protection Gap
                </h3>
                <p className="text-sm font-bold text-slate-900">Decision Support Layer</p>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-2xl bg-teal-50/60 border border-teal-200 space-y-3">
              <div>
                <div className="text-[11px] text-teal-800 font-medium">
                  Indicative Life Shield Gap:
                </div>
                <div className="text-2xl font-black text-teal-950">
                  {formatINR(protectionGap)}
                </div>
                <div className="text-[10px] text-teal-700 mt-0.5">
                  Target: 10x Annual Income ({formatINR(idealLifeCover)}) for {formData.dependents} dependents.
                </div>
              </div>

              <div className="text-xs text-slate-600 pt-2 border-t border-teal-200/60 space-y-1">
                <div className="flex justify-between">
                  <span>Current Cover:</span>
                  <span className="font-bold text-slate-800">{formatINR(formData.existingLifeCover)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Health Cover:</span>
                  <span className="font-bold text-slate-800">{formatINR(formData.existingHealthCover)}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 leading-relaxed flex items-start gap-2">
              <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>
                <strong>Compliance Note:</strong> FinPath provides indicative decision support and risk gap analysis. We do not issue insurance contracts nor claim registered insurance advisor status.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
