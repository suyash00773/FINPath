import React, { useState } from 'react';
import {
  Lock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  ShieldAlert,
  Database,
  ArrowRight,
  Info,
} from 'lucide-react';
import { ConsentRecord } from '../types';
import { formatDate } from '../utils/formatters';

interface ConsentCenterViewProps {
  consents: ConsentRecord[];
  onToggleConsent: (id: string, currentStatus: string) => Promise<void>;
  onContinueToJourney: () => void;
}

export const ConsentCenterView: React.FC<ConsentCenterViewProps> = ({
  consents,
  onToggleConsent,
  onContinueToJourney,
}) => {
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleToggle = async (id: string, currentStatus: string) => {
    setTogglingId(id);
    try {
      await onToggleConsent(id, currentStatus);
    } finally {
      setTogglingId(null);
    }
  };

  const grantedCount = consents.filter((c) => c.status === 'granted').length;

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 mb-2">
            <Lock className="w-3.5 h-3.5" />
            <span>Consent & Data Sovereignty Center</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Account Aggregator-Ready Privacy Architecture
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            FinPath strictly follows the RBI Account Aggregator (AA) framework principles. We never access, share, or store financial data without explicit, purpose-limited consent.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 shrink-0">
          <div className="text-center">
            <div className="text-xs text-slate-500 font-medium">Consents Granted</div>
            <div className="text-xl font-black text-blue-700">
              {grantedCount} / {consents.length}
            </div>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div className="text-center">
            <div className="text-xs text-slate-500 font-medium">Data Storage</div>
            <div className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              Zero Raw Storage
            </div>
          </div>
        </div>
      </div>

      {/* Account Aggregator Info Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-teal-50 border border-blue-200 flex items-start gap-3">
        <Database className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 leading-relaxed">
          <span className="font-bold text-slate-900">Why Consent is Fundamental:</span> FinPath is a fiduciary decision engine, not an advertising network. Each consent record is cryptographic, purpose-bound, and can be revoked at any second with zero penalty.
        </div>
      </div>

      {/* Consent Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {consents.map((consent) => {
          const isGranted = consent.status === 'granted';
          const isToggling = togglingId === consent.id;

          return (
            <div
              key={consent.id}
              className={`p-5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                isGranted
                  ? 'bg-white border-slate-200 shadow-xs'
                  : 'bg-slate-50/70 border-slate-200 text-slate-500'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {consent.category}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold flex items-center gap-1 ${
                      isGranted
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {isGranted ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Authorized</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>Pending</span>
                      </>
                    )}
                  </span>
                </div>

                <h3 className="font-extrabold text-slate-900 text-base mt-2">
                  {consent.category} Data Access
                </h3>

                <p className="text-xs text-slate-600 mt-1">
                  <strong>Explicit Purpose:</strong> {consent.purpose}
                </p>

                <div className="mt-3 space-y-1">
                  <div className="text-[11px] font-semibold text-slate-500">Authorized Data Scope:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {consent.dataItems.map((item, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium border border-slate-200"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-3 text-[11px] text-slate-400">
                  {isGranted ? (
                    <span>Granted: {formatDate(consent.grantedAt)} • Expires in 90 days</span>
                  ) : (
                    <span>Access not yet authorized</span>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500">
                  Account Aggregator (AA) Compatible
                </span>
                <button
                  id={`toggle-consent-${consent.id}`}
                  onClick={() => handleToggle(consent.id, consent.status)}
                  disabled={isToggling}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                    isGranted
                      ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-2xs'
                  }`}
                >
                  {isToggling ? (
                    'Updating...'
                  ) : isGranted ? (
                    <>
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Revoke Consent</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Grant Consent</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Continue Action */}
      <div className="pt-4 flex justify-end">
        <button
          onClick={onContinueToJourney}
          className="px-6 py-2.5 rounded-xl text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm"
        >
          <span>View Active Financial Journey</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
