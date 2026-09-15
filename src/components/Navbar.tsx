import React, { useState } from 'react';
import {
  Compass,
  Shield,
  Activity,
  GitBranch,
  Sliders,
  Send,
  Lock,
  History,
  ShoppingBag,
  RotateCcw,
  Sparkles,
  User,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Layers,
  Menu,
  X,
  LogIn,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { LanguageMode, UserAccount } from '../types';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  language: LanguageMode;
  setLanguage: (lang: LanguageMode) => void;
  onResetDemo: () => void;
  isResetting: boolean;
  resilienceScore: number;
  onOpenChatbot?: () => void;
  currentUser?: UserAccount | null;
  onOpenAuthModal?: () => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  language,
  setLanguage,
  onResetDemo,
  isResetting,
  resilienceScore,
  onOpenChatbot,
  currentUser,
  onOpenAuthModal,
  onLogout,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'copilot', label: 'AI Copilot', icon: Sparkles, badge: 'AI Engine' },
    { id: 'decisions', label: 'Decisions', icon: Compass },
    { id: 'scenarios', label: 'What-If Lab', icon: Sliders, highlight: true },
    { id: 'goals', label: 'Goals', icon: GitBranch },
    { id: 'journey', label: 'Journey', icon: Send },
    { id: 'consent', label: 'Consent', icon: Lock },
    { id: 'audit', label: 'Audit Log', icon: History },
    { id: 'products', label: 'Products', icon: ShoppingBag },
    { id: 'moat', label: 'The Moat', icon: Layers },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Positioning */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Compass className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">FINPATH</span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  Decision Copilot
                </span>
                <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                  Team Error
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 hidden sm:block">
                Borrow. Save. Protect. Wait.
              </p>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden xl:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => setCurrentTab(item.id)}
                  className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                  {item.badge && !isActive && (
                    <span className="px-1 py-0.2 rounded text-[9px] bg-indigo-100 text-indigo-700 font-bold">
                      {item.badge}
                    </span>
                  )}
                  {item.highlight && !isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Selector */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              <Globe className="w-3.5 h-3.5 text-slate-500 ml-1 mr-1 hidden sm:block" />
              {(['hinglish', 'english', 'hindi'] as LanguageMode[]).map((lang) => (
                <button
                  key={lang}
                  id={`lang-${lang}`}
                  onClick={() => setLanguage(lang)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium capitalize transition-colors ${
                    language === lang
                      ? 'bg-white text-blue-700 font-bold shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {lang === 'hinglish' ? 'Hinglish' : lang === 'english' ? 'English' : 'हिंदी'}
                </button>
              ))}
            </div>

            {/* AI Chatbot Button */}
            {onOpenChatbot && (
              <button
                id="navbar-ai-chatbot-btn"
                onClick={onOpenChatbot}
                className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors flex items-center gap-1.5 text-xs font-bold shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                <span className="hidden lg:inline">AI Chatbot</span>
              </button>
            )}

            {/* Reset Demo Button */}
            <button
              id="reset-demo-btn"
              onClick={onResetDemo}
              disabled={isResetting}
              title="Reset Demo to Initial ₹72K / Shop Expansion State"
              className="p-2 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors border border-slate-200 flex items-center gap-1 text-xs"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin text-blue-600' : ''}`} />
              <span className="hidden md:inline font-medium">Reset Demo</span>
            </button>

            {/* Notifications toggle */}
            <div className="relative">
              <button
                id="notification-bell-btn"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600" />
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 text-xs animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-bold text-slate-800">Financial Alerts</span>
                    <span className="text-[10px] text-blue-600 font-medium">3 active</span>
                  </div>
                  <div className="space-y-2 mt-2">
                    <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100 flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-emerald-900">Decision Engine Ready</p>
                        <p className="text-[11px] text-emerald-700">
                          Resilience Score: {resilienceScore}/100. Best path: Borrow ₹2.5L + Save ₹50K.
                        </p>
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-amber-50 border border-amber-100 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-amber-900">What-If Lab Active</p>
                        <p className="text-[11px] text-amber-700">
                          Simulate -20% income drops in Scenarios to witness automatic recommendation shift.
                        </p>
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-blue-50 border border-blue-100 flex items-start gap-2">
                      <Shield className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-blue-900">Account Aggregator Ready</p>
                        <p className="text-[11px] text-blue-700">
                          Granular purpose-bound consent enabled. No unauthorized data sharing.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Account / Persona Switcher / Login & Logout */}
            <div className="relative">
              {currentUser ? (
                <div>
                  <button
                    id="user-profile-menu-btn"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors text-xs"
                  >
                    <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-[11px]">
                      {currentUser.name.charAt(0)}
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-[11px] font-extrabold text-slate-800 leading-tight">
                        {currentUser.name.split(' ')[0]}
                      </p>
                      <p className="text-[9px] text-slate-500 font-medium truncate max-w-[80px]">
                        {currentUser.occupation?.split(' ')[0] || 'User'}
                      </p>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden sm:block" />
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 text-xs animate-in fade-in slide-in-from-top-2">
                      <div className="pb-2.5 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                            {currentUser.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900">{currentUser.name}</p>
                            <p className="text-[10px] text-slate-500">{currentUser.email}</p>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-1.5">
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                            {currentUser.role}
                          </span>
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                            Session Active
                          </span>
                        </div>
                      </div>

                      <div className="py-2 space-y-1">
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            onOpenAuthModal?.();
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center gap-2 font-medium"
                        >
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          <span>Switch Consumer Persona</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            setCurrentTab('profile');
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center gap-2 font-medium"
                        >
                          <Compass className="w-3.5 h-3.5 text-slate-500" />
                          <span>View Financial Profile</span>
                        </button>
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <button
                          id="logout-btn"
                          onClick={() => {
                            setShowUserMenu(false);
                            onLogout?.();
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-rose-50 text-rose-700 flex items-center gap-2 font-bold transition-colors"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Log Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  id="navbar-login-btn"
                  onClick={onOpenAuthModal}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Log In</span>
                </button>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Navigation */}
        {mobileMenuOpen && (
          <div className="xl:hidden py-3 border-t border-slate-200 flex flex-col gap-2 bg-white">
            <div className="grid grid-cols-2 gap-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                      isActive ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Mobile Auth Row */}
            <div className="pt-2 mt-1 border-t border-slate-100 px-1">
              {currentUser ? (
                <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                      {currentUser.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-900">{currentUser.name}</p>
                      <p className="text-[10px] text-slate-500">{currentUser.occupation}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenAuthModal?.();
                      }}
                      className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-slate-700 hover:bg-slate-100"
                    >
                      Switch
                    </button>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onLogout?.();
                      }}
                      className="px-2 py-1 rounded-lg bg-rose-50 text-rose-700 text-[11px] font-bold hover:bg-rose-100 border border-rose-200"
                    >
                      Log Out
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuthModal?.();
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Log In to FinPath</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
