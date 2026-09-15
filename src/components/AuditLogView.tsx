import React, { useState } from 'react';
import {
  History,
  ShieldCheck,
  Code,
  CheckCircle2,
  Lock,
  Search,
  ChevronDown,
  ChevronUp,
  FileText,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';
import { AuditEvent, AuditEventType } from '../types';
import { formatDate } from '../utils/formatters';

interface AuditLogViewProps {
  logs: AuditEvent[];
  onRefreshLogs: () => void;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ logs, onRefreshLogs }) => {
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const eventBadgeColors: Record<AuditEventType, string> = {
    GOAL_CREATED: 'bg-blue-100 text-blue-800 border-blue-200',
    PROFILE_VIEWED: 'bg-slate-100 text-slate-800 border-slate-200',
    FINANCIAL_CALCULATION: 'bg-teal-100 text-teal-800 border-teal-200',
    SCENARIO_RUN: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    DECISION_GENERATED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    DECISION_ACCEPTED: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    CONSENT_GRANTED: 'bg-teal-100 text-teal-900 border-teal-200',
    CONSENT_REVOKED: 'bg-rose-100 text-rose-800 border-rose-200',
    JOURNEY_STARTED: 'bg-amber-100 text-amber-900 border-amber-200',
    JOURNEY_UPDATED: 'bg-blue-100 text-blue-900 border-blue-200',
    SAFETY_ALERT_TRIGGERED: 'bg-rose-100 text-rose-900 border-rose-300',
    USER_LOGGED_IN: 'bg-cyan-100 text-cyan-900 border-cyan-200',
    USER_LOGGED_OUT: 'bg-slate-100 text-slate-700 border-slate-200',
    USER_REGISTERED: 'bg-purple-100 text-purple-900 border-purple-200',
  };

  const filteredLogs = logs.filter((log) => {
    if (filterType === 'ALL') return true;
    return log.eventType === filterType;
  });

  const handleCopyHash = (hash: string, id: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 mb-2">
            <History className="w-3.5 h-3.5" />
            <span>Cryptographic Audit Trail</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Immutable Decision Ledger & Provenance
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Every goal, financial calculation, stress test, consent toggle, and decision is cryptographically signed with deterministic hashing. Complete accountability, zero black box.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefreshLogs}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors border border-slate-200 flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Ledger</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
        {[
          'ALL',
          'DECISION_GENERATED',
          'SCENARIO_RUN',
          'CONSENT_GRANTED',
          'FINANCIAL_CALCULATION',
          'JOURNEY_STARTED',
        ].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
              filterType === type
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {type.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Audit Log Table / Timeline */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="divide-y divide-slate-100">
          {filteredLogs.map((log) => {
            const badgeClass =
              eventBadgeColors[log.eventType] || 'bg-slate-100 text-slate-800 border-slate-200';
            const isSelected = selectedEvent?.id === log.id;

            return (
              <div key={log.id} className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${badgeClass}`}>
                        {log.eventType}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        {formatDate(log.timestamp)}
                      </span>
                      <span className="text-[11px] text-slate-500 italic">
                        • {log.userAction}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-900">{log.description}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleCopyHash(log.immutableHash, log.id)}
                      title="Copy immutable hash"
                      className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 text-[10px] font-mono border border-slate-200 flex items-center gap-1"
                    >
                      {copiedId === log.id ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>{log.immutableHash.substring(0, 14)}...</span>
                    </button>

                    <button
                      onClick={() => setSelectedEvent(isSelected ? null : log)}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition-colors flex items-center gap-1"
                    >
                      <Code className="w-3.5 h-3.5" />
                      <span>{isSelected ? 'Hide Payload' : 'Inspect'}</span>
                    </button>
                  </div>
                </div>

                {/* Expanded JSON payload */}
                {isSelected && (
                  <div className="mt-4 p-4 rounded-2xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto border border-slate-800 space-y-2 animate-in fade-in">
                    <div className="flex justify-between items-center text-slate-400 text-[11px] pb-2 border-b border-slate-800">
                      <span>Cryptographic Snapshot ID: {log.id}</span>
                      <span>SHA Hash: {log.immutableHash}</span>
                    </div>
                    <pre className="text-[11px] leading-relaxed text-teal-300">
                      {JSON.stringify(log.dataSnapshot, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
