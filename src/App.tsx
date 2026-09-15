import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { FinancialHealthCard } from './components/FinancialHealthCard';
import { DecisionCard } from './components/DecisionCard';
import { CopilotView } from './components/CopilotView';
import { ScenarioLabView } from './components/ScenarioLabView';
import { ConsentCenterView } from './components/ConsentCenterView';
import { JourneyTrackerView } from './components/JourneyTrackerView';
import { AuditLogView } from './components/AuditLogView';
import { ProductsView } from './components/ProductsView';
import { GoalsView } from './components/GoalsView';
import { MoatView } from './components/MoatView';
import { ProfileView } from './components/ProfileView';
import { LandingHero } from './components/LandingHero';
import { FloatingChatbot } from './components/FloatingChatbot';
import { AuthModal } from './components/AuthModal';
import { OtpAuthView } from './components/OtpAuthView';
import {
  FinancialProfile,
  FinancialHealth,
  FinancialGoal,
  DecisionRun,
  ConsentRecord,
  JourneyRecord,
  AuditEvent,
  FinancialProduct,
  LanguageMode,
  UserAccount,
  AuthSession,
} from './types';
import {
  Sparkles,
  Sliders,
  Compass,
  Lock,
  History,
  Send,
  GitBranch,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  Users,
  LogIn,
  LogOut,
} from 'lucide-react';
import { formatINR } from './utils/formatters';

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [language, setLanguage] = useState<LanguageMode>('hinglish');
  const [loading, setLoading] = useState<boolean>(true);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [toastNotice, setToastNotice] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Authentication state (Backed by HTTP-Only Cookie + MongoDB)
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  // Browser pathname routing for /login and /login/verify
  const [pathname, setPathname] = useState<string>(
    typeof window !== 'undefined' ? window.location.pathname : '/dashboard'
  );

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', path);
      setPathname(path);
    }
  };

  // Auto-dismiss toast
  useEffect(() => {
    if (toastNotice) {
      const timer = setTimeout(() => setToastNotice(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastNotice]);

  // Core financial state
  const [profile, setProfile] = useState<FinancialProfile | null>(null);
  const [health, setHealth] = useState<FinancialHealth | null>(null);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [decisions, setDecisions] = useState<DecisionRun[]>([]);
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [journeys, setJourneys] = useState<JourneyRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([]);
  const [products, setProducts] = useState<FinancialProduct[]>([]);

  // Fetch initial data & check cookie session
  const loadData = async () => {
    try {
      const token = localStorage.getItem('finpath_auth_token');
      const authHeaders: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

      const [sessionRes, profRes, goalsRes, decRes, consentRes, journeyRes, auditRes, prodRes] =
        await Promise.all([
          fetch('/api/auth/session', { headers: authHeaders, credentials: 'include' }),
          fetch('/api/profile'),
          fetch('/api/goals'),
          fetch('/api/decisions'),
          fetch('/api/consent'),
          fetch('/api/journey'),
          fetch('/api/audit'),
          fetch('/api/products'),
        ]);

      if (sessionRes.ok) {
        const sData = await sessionRes.json();
        if (sData.authenticated && sData.user) {
          setCurrentUser(sData.user);
          setIsDemoMode(Boolean(sData.isDemo));
          if (pathname === '/login' || pathname === '/login/verify') {
            navigate('/dashboard');
          }
        } else {
          setCurrentUser(null);
          setIsDemoMode(false);
        }
      } else {
        setCurrentUser(null);
        setIsDemoMode(false);
      }

      if (profRes.ok) {
        const pData = await profRes.json();
        setProfile(pData.profile);
        setHealth(pData.health);
      }
      if (goalsRes.ok) {
        const gData = await goalsRes.json();
        setGoals(gData.goals);
      }
      if (decRes.ok) {
        const dData = await decRes.json();
        setDecisions(dData.decisions);
      }
      if (consentRes.ok) {
        const cData = await consentRes.json();
        setConsents(cData.consents);
      }
      if (journeyRes.ok) {
        const jData = await journeyRes.json();
        setJourneys(jData.journeys);
      }
      if (auditRes.ok) {
        const aData = await auditRes.json();
        setAuditLogs(aData.auditLogs);
      }
      if (prodRes.ok) {
        const prData = await prodRes.json();
        setProducts(prData.products);
      }
    } catch (e) {
      console.error('Failed to load application data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOtpLoginSuccess = (
    user: UserAccount,
    newProfile: FinancialProfile,
    newHealth: FinancialHealth,
    demo: boolean = false,
    sessionId?: string
  ) => {
    if (sessionId) {
      localStorage.setItem('finpath_auth_token', sessionId);
    }
    setCurrentUser(user);
    setIsDemoMode(demo);
    if (newProfile) setProfile(newProfile);
    if (newHealth) setHealth(newHealth);
    navigate('/dashboard');
    setCurrentTab('dashboard');
    setToastNotice({
      message: demo
        ? 'Welcome to FinPath Demo Mode (+91 99999 99999)!'
        : `Welcome, ${user.name}! Authenticated via verified OTP.`,
      type: 'success',
    });
    loadData();
  };

  const handleLoginSuccess = (session: AuthSession, newProfile: FinancialProfile, newHealth: FinancialHealth) => {
    localStorage.setItem('finpath_auth_token', session.token);
    setCurrentUser(session.user);
    setProfile(newProfile);
    setHealth(newHealth);
    setToastNotice({
      message: `Welcome back, ${session.user.name}!`,
      type: 'success',
    });
    loadData();
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.warn('Logout API error:', err);
    }
    localStorage.removeItem('finpath_auth_token');
    setCurrentUser(null);
    setIsDemoMode(false);
    navigate('/login');
    setToastNotice({
      message: 'You have been logged out securely.',
      type: 'info',
    });
  };

  const handleResetDemo = async () => {
    setIsResetting(true);
    try {
      localStorage.removeItem('finpath_logged_out');
      localStorage.setItem('finpath_auth_token', 'finpath_demo_token_suyash_786');
      await fetch('/api/reset-demo', { method: 'POST' });
      await loadData();
      setCurrentTab('dashboard');
      setToastNotice({ message: 'Demo environment reset to initial state.', type: 'info' });
    } catch (e) {
      console.error('Reset error:', e);
    } finally {
      setIsResetting(false);
    }
  };

  const handleUpdateProfile = async (updated: Partial<FinancialProfile>) => {
    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
    if (res.ok) {
      const data = await res.json();
      setProfile(data.profile);
      setHealth(data.health);
      // reload decisions to reflect updated profile
      const decRes = await fetch('/api/decisions');
      if (decRes.ok) {
        const dData = await decRes.json();
        setDecisions(dData.decisions);
      }
      const auditRes = await fetch('/api/audit');
      if (auditRes.ok) {
        const aData = await auditRes.json();
        setAuditLogs(aData.auditLogs);
      }
    }
  };

  const handleCreateGoal = async (newGoal: Partial<FinancialGoal>) => {
    const res = await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newGoal),
    });
    if (res.ok) {
      const data = await res.json();
      setGoals((prev) => [data.goal, ...prev]);
      if (data.decisionRun) {
        setDecisions((prev) => [data.decisionRun, ...prev]);
      }
      const auditRes = await fetch('/api/audit');
      if (auditRes.ok) {
        const aData = await auditRes.json();
        setAuditLogs(aData.auditLogs);
      }
    }
  };

  const handleToggleConsent = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'granted' ? 'revoked' : 'granted';
    if (nextStatus === 'revoked') {
      await fetch(`/api/consent/${id}`, { method: 'DELETE' });
    } else {
      await fetch('/api/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'granted' }),
      });
    }
    const cRes = await fetch('/api/consent');
    if (cRes.ok) {
      const cData = await cRes.json();
      setConsents(cData.consents);
    }
    const auditRes = await fetch('/api/audit');
    if (auditRes.ok) {
      const aData = await auditRes.json();
      setAuditLogs(aData.auditLogs);
    }
  };

  const handleAdvanceJourney = async (journeyId: string, currentStepIndex: number) => {
    const res = await fetch(`/api/journey/${journeyId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stepIndex: currentStepIndex }),
    });
    if (res.ok) {
      const data = await res.json();
      setJourneys((prev) =>
        prev.map((j) => (j.id === journeyId ? data.journey : j))
      );
      const auditRes = await fetch('/api/audit');
      if (auditRes.ok) {
        const aData = await auditRes.json();
        setAuditLogs(aData.auditLogs);
      }
    }
  };

  const activeGoal = goals[0] || {
    id: 'goal_shop',
    title: 'Shop Expansion',
    targetAmount: 300000,
    timelineMonths: 3,
    status: 'evaluating',
  };

  const activeDecision = decisions[0];
  const activeJourney = journeys[0];

  if (loading || !profile || !health) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-lg animate-pulse">
            <Compass className="w-7 h-7 animate-spin" />
          </div>
          <div className="text-sm font-extrabold text-slate-800">
            Initializing FinPath Decision Engine...
          </div>
          <div className="text-xs text-slate-500 font-mono">
            Loading deterministic balance sheet & verified product matrices
          </div>
        </div>
      </div>
    );
  }

  // Protected route: If unauthenticated or navigating to /login, render the OTP Auth View
  if (!currentUser || pathname === '/login' || pathname === '/login/verify') {
    return (
      <OtpAuthView
        initialStep={pathname === '/login/verify' ? 'verify' : 'login'}
        onLoginSuccess={handleOtpLoginSuccess}
        onNavigateToDashboard={() => {
          navigate('/dashboard');
          setCurrentTab('dashboard');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafd] text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        language={language}
        setLanguage={setLanguage}
        onResetDemo={handleResetDemo}
        isResetting={isResetting}
        resilienceScore={health.resilienceScore}
        onOpenChatbot={() => setIsChatbotOpen((prev) => !prev)}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {/* DEMO MODE Banner */}
        {isDemoMode && (
          <div
            id="demo-mode-indicator-banner"
            className="p-4 rounded-2xl bg-amber-500 text-slate-950 font-bold shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-amber-400 animate-in fade-in"
          >
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-xl bg-slate-950 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                DEMO MODE
              </span>
              <p className="text-xs font-semibold text-slate-950">
                You are exploring FinPath with a synthetic Kirana Merchant profile (+91 99999 99999). Changes will not affect real consumer records.
              </p>
            </div>
            <button
              id="exit-demo-mode-btn"
              onClick={handleLogout}
              className="px-3.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-white text-xs font-bold transition-all shrink-0 self-start sm:self-auto"
            >
              Sign Out of Demo
            </button>
          </div>
        )}

        {/* LANDING TAB */}
        {currentTab === 'landing' && (
          <LandingHero
            onLaunchDashboard={() => setCurrentTab('dashboard')}
            onLaunchCopilot={() => setCurrentTab('copilot')}
          />
        )}

        {/* DASHBOARD TAB */}
        {currentTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in">
            {/* Top Positioning Banner */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-teal-400 text-slate-950 px-2 py-0.5 rounded">
                    Core Positioning
                  </span>
                  <span className="text-xs text-teal-300 font-medium hidden sm:inline">
                    Borrow. Save. Protect. Wait.
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  “The market has products. FinPath has the decision.”
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentTab('copilot')}
                  className="px-4 py-2 rounded-xl bg-white text-slate-950 hover:bg-slate-100 text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Ask Copilot Anything</span>
                </button>
                <button
                  onClick={() => setCurrentTab('scenarios')}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-1.5 border border-white/15 shrink-0"
                >
                  <Sliders className="w-3.5 h-3.5 text-teal-400" />
                  <span>Stress Test</span>
                </button>
              </div>
            </div>

            {/* Section 1: Financial Health (Resilience Score + Cash Flow + Runway) */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                  Financial Health Diagnostic
                </h2>
                <span className="text-xs text-slate-500 font-medium">
                  Authoritative Deterministic Engine
                </span>
              </div>
              <FinancialHealthCard
                health={health}
                profile={profile}
                onOpenWhatIf={() => setCurrentTab('scenarios')}
                onOpenProtection={() => setCurrentTab('profile')}
              />
            </div>

            {/* Active Goal Quick Callout */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                  <GitBranch className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Active Financial Goal
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 uppercase">
                      {activeGoal.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900">
                    {activeGoal.title} — {formatINR(activeGoal.targetAmount)}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Target timeline: {activeGoal.timelineMonths} months • Decision engine evaluated
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="dashboard-continue-decision-btn"
                  onClick={() => setCurrentTab('decisions')}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Compass className="w-4 h-4" />
                  <span>Continue Decision</span>
                </button>
              </div>
            </div>

            {/* Section 2: Recommended Decision Card */}
            {activeDecision && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                    Engine Ranked Decision
                  </h2>
                  <span className="text-xs text-blue-600 font-bold">
                    Score: {activeDecision.decisionScore}/100
                  </span>
                </div>
                <DecisionCard
                  decision={activeDecision}
                  onRunStressTest={() => setCurrentTab('scenarios')}
                  onContinueToConsent={() => setCurrentTab('consent')}
                />
              </div>
            )}

            {/* Quick Navigation Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div
                onClick={() => setCurrentTab('scenarios')}
                className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-blue-300 transition-all cursor-pointer space-y-2"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Sliders className="w-4 h-4" />
                </div>
                <h4 className="font-extrabold text-slate-900 text-sm">What-If Stress Lab</h4>
                <p className="text-xs text-slate-500">
                  Simulate -20% income drops to witness how FinPath pivots from Borrow to Wait+Save.
                </p>
              </div>

              <div
                onClick={() => setCurrentTab('consent')}
                className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-blue-300 transition-all cursor-pointer space-y-2"
              >
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <h4 className="font-extrabold text-slate-900 text-sm">Consent Center</h4>
                <p className="text-xs text-slate-500">
                  Granular, purpose-bound Account Aggregator permissions with instant revocation.
                </p>
              </div>

              <div
                onClick={() => setCurrentTab('audit')}
                className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-blue-300 transition-all cursor-pointer space-y-2"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                  <History className="w-4 h-4" />
                </div>
                <h4 className="font-extrabold text-slate-900 text-sm">Audit Ledger</h4>
                <p className="text-xs text-slate-500">
                  Cryptographically signed audit records and exact mathematical replay of decisions.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* COPILOT TAB */}
        {currentTab === 'copilot' && (
          <CopilotView
            language={language}
            setLanguage={setLanguage}
            onNavigateTab={setCurrentTab}
            onGoalExtracted={(g) => {
              // refresh goals
              fetch('/api/goals')
                .then((r) => r.json())
                .then((d) => setGoals(d.goals));
            }}
            onDecisionCreated={(d) => {
              setDecisions((prev) => [d, ...prev]);
            }}
          />
        )}

        {/* DECISIONS TAB */}
        {currentTab === 'decisions' && activeDecision && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                  Decision Engine Intelligence
                </span>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  Transparent Decision Rankings
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Evaluates Affordability, Liquidity Preservation, Goal Timeliness, Debt Pressure, and Shock Resilience.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentTab('scenarios')}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 flex items-center gap-1"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Stress Test This Decision</span>
                </button>
              </div>
            </div>

            <DecisionCard
              decision={activeDecision}
              onRunStressTest={() => setCurrentTab('scenarios')}
              onContinueToConsent={() => setCurrentTab('consent')}
            />
          </div>
        )}

        {/* SCENARIOS (WHAT-IF LAB) TAB */}
        {currentTab === 'scenarios' && activeDecision && (
          <ScenarioLabView
            profile={profile}
            goal={activeGoal as FinancialGoal}
            decision={activeDecision}
            onContinueToConsent={() => setCurrentTab('consent')}
          />
        )}

        {/* GOALS TAB */}
        {currentTab === 'goals' && (
          <GoalsView
            goals={goals}
            onCreateGoal={handleCreateGoal}
            onSelectGoalForDecision={() => setCurrentTab('decisions')}
            onSelectGoalForWhatIf={() => setCurrentTab('scenarios')}
            onSelectGoalForJourney={() => setCurrentTab('journey')}
          />
        )}

        {/* JOURNEY TAB */}
        {currentTab === 'journey' && activeJourney && (
          <JourneyTrackerView
            journey={activeJourney}
            onAdvanceStep={handleAdvanceJourney}
            onViewAudit={() => setCurrentTab('audit')}
          />
        )}

        {/* CONSENT TAB */}
        {currentTab === 'consent' && (
          <ConsentCenterView
            consents={consents}
            onToggleConsent={handleToggleConsent}
            onContinueToJourney={() => setCurrentTab('journey')}
          />
        )}

        {/* AUDIT LOG TAB */}
        {currentTab === 'audit' && (
          <AuditLogView
            logs={auditLogs}
            onRefreshLogs={() => {
              fetch('/api/audit')
                .then((r) => r.json())
                .then((d) => setAuditLogs(d.auditLogs));
            }}
          />
        )}

        {/* PRODUCTS TAB */}
        {currentTab === 'products' && <ProductsView products={products} />}

        {/* THE MOAT TAB */}
        {currentTab === 'moat' && <MoatView />}

        {/* PROFILE TAB */}
        {currentTab === 'profile' && (
          <ProfileView
            profile={profile}
            health={health}
            onUpdateProfile={handleUpdateProfile}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900">FINPATH</span>
            <span>•</span>
            <span>AI Financial Decision & Journey Copilot</span>
            <span>•</span>
            <span className="font-semibold text-blue-600">“Borrow. Save. Protect. Wait.”</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>Team Error (Suyash Bajpai & Vanya Tripathi)</span>
            <span>•</span>
            <span>Paytm Ecosystem Synergy</span>
          </div>
        </div>
      </footer>

      {/* Persistent AI Chat Bot (Bottom Right Floating Assistant) */}
      <FloatingChatbot
        isOpen={isChatbotOpen}
        setIsOpen={setIsChatbotOpen}
        language={language}
        setLanguage={setLanguage}
        onNavigateTab={(tab) => setCurrentTab(tab)}
        onGoalExtracted={(g) => {
          fetch('/api/goals')
            .then((r) => r.json())
            .then((d) => setGoals(d.goals));
        }}
        onDecisionCreated={(d) => {
          setDecisions((prev) => [d, ...prev]);
        }}
      />

      {/* Authentication & Persona Switcher Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
      />

      {/* Toast Notification */}
      {toastNotice && (
        <div
          id="auth-toast-notification"
          className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 bg-slate-900 text-white flex items-center gap-3 text-xs animate-in slide-in-from-bottom-2 fade-in"
        >
          <div
            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              toastNotice.type === 'success'
                ? 'bg-emerald-400 ring-4 ring-emerald-400/20'
                : 'bg-blue-400 ring-4 ring-blue-400/20'
            }`}
          />
          <span className="font-semibold">{toastNotice.message}</span>
          <button
            onClick={() => setToastNotice(null)}
            className="text-slate-400 hover:text-white ml-2 text-sm leading-none font-bold"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
