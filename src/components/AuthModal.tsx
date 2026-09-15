import React, { useState } from 'react';
import {
  X,
  User,
  Lock,
  Mail,
  Briefcase,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  LogIn,
  UserPlus,
  Users,
  ShieldCheck,
  ArrowRight,
  LogOut,
  Smartphone,
  KeyRound,
  Copy,
  Check,
  Send,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react';
import { UserAccount, AuthSession, FinancialProfile, FinancialHealth } from '../types';
import { formatINR } from '../utils/formatters';
import { fetchJson } from '../utils/apiClient';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  onLoginSuccess: (session: AuthSession, profile: FinancialProfile, health: FinancialHealth) => void;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onLogout,
}) => {
  const [tab, setTab] = useState<'otp' | 'login' | 'switch' | 'register'>('otp');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [name, setName] = useState('');
  const [occupation, setOccupation] = useState('');
  const [income, setIncome] = useState('75000');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Customer OTP states
  const [otpDestination, setOtpDestination] = useState('+91 98765 00123');
  const [otpCode, setOtpCode] = useState('');
  const [sentOtpInfo, setSentOtpInfo] = useState<{ otp: string; destination: string; expiresAt: string } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen) return null;

  const demoAccounts = [
    {
      id: 'usr_demo_786',
      name: 'Suyash Bajpai',
      email: 'suyash@finpath.ai',
      password: 'password123',
      role: 'consumer_merchant',
      occupation: 'Retail Business Owner (Kirana)',
      monthlyIncome: 72000,
      existingEmi: 8000,
      runway: '3.2 months',
      creditScore: 742,
      badge: 'Merchant Tier',
    },
    {
      id: 'usr_priya_102',
      name: 'Priya Sharma',
      email: 'priya@finpath.ai',
      password: 'password123',
      role: 'consumer_freelancer',
      occupation: 'Senior Software Engineer',
      monthlyIncome: 95000,
      existingEmi: 0,
      runway: '5.1 months',
      creditScore: 780,
      badge: 'Prime / Zero Debt',
    },
    {
      id: 'usr_rahul_55',
      name: 'Rahul Verma',
      email: 'rahul@finpath.ai',
      password: 'password123',
      role: 'consumer_salaried',
      occupation: 'Small Business Merchant',
      monthlyIncome: 45000,
      existingEmi: 5000,
      runway: '2.4 months',
      creditScore: 698,
      badge: 'Budget Merchant Tier',
    },
    {
      id: 'usr_temp_customer',
      name: 'Demo Customer',
      email: 'customer.demo@finpath.ai',
      password: 'tempPassword2026',
      phone: '+91 98765 00123',
      role: 'consumer_customer',
      occupation: 'Retail & Digital Services Consumer',
      monthlyIncome: 60000,
      existingEmi: 3500,
      runway: '4.0 months',
      creditScore: 730,
      badge: 'Temporary Customer (OTP Ready)',
    },
  ];

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const { ok, data, error: apiErr } = await fetchJson('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination: otpDestination }),
      });

      if (!ok || !data) {
        throw new Error(apiErr || 'Failed to send OTP to customer');
      }

      setSentOtpInfo({
        otp: data.otp,
        destination: data.destination,
        expiresAt: data.expiresAt,
      });
      setSuccessMsg(`OTP sent to ${data.destination}! Code: ${data.otp}`);
    } catch (err: any) {
      setError(err.message || 'Error sending OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!otpCode) {
      setError('Please enter the 6-digit OTP code');
      return;
    }

    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const { ok, data, error: apiErr } = await fetchJson('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: otpDestination,
          otp: otpCode,
        }),
      });

      if (!ok || !data) {
        throw new Error(apiErr || 'OTP verification failed');
      }

      setSuccessMsg(`Welcome, ${data.user.name}! Verified successfully via OTP.`);
      localStorage.setItem('finpath_auth_token', data.session.token);
      localStorage.removeItem('finpath_logged_out');
      onLoginSuccess(data.session, data.profile, data.health);
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err: any) {
      setError(err.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    const targetEmail = customEmail || email;
    const targetPassword = customPass || password;

    try {
      const { ok, data, error: apiErr } = await fetchJson('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, password: targetPassword }),
      });

      if (!ok || !data) {
        throw new Error(apiErr || 'Authentication failed. Check your email & password.');
      }

      setSuccessMsg(`Welcome back, ${data.session.user.name}!`);
      localStorage.setItem('finpath_auth_token', data.session.token);
      localStorage.removeItem('finpath_logged_out');
      onLoginSuccess(data.session, data.profile, data.health);
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Login error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const { ok, data, error: apiErr } = await fetchJson('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          occupation,
          monthlyIncome: Number(income),
        }),
      });

      if (!ok || !data) {
        throw new Error(apiErr || 'Registration failed');
      }

      setSuccessMsg(`Account created successfully for ${data.user.name}!`);
      localStorage.setItem('finpath_auth_token', data.session.token);
      localStorage.removeItem('finpath_logged_out');
      onLoginSuccess(data.session, data.profile, data.health);
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Registration error');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchUser = async (userId: string) => {
    setError(null);
    setLoading(true);
    try {
      const { ok, data, error: apiErr } = await fetchJson('/api/auth/switch-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!ok || !data) {
        throw new Error(apiErr || 'Switch failed');
      }

      localStorage.setItem('finpath_auth_token', data.session.token);
      localStorage.removeItem('finpath_logged_out');
      onLoginSuccess(data.session, data.profile, data.health);
      setSuccessMsg(`Switched active profile to ${data.user.name}`);
      setTimeout(() => {
        onClose();
      }, 400);
    } catch (err: any) {
      setError(err.message || 'Failed to switch profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-400 text-slate-950 flex items-center justify-center font-black">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-tight">FinPath Authentication & Session</h2>
              <p className="text-[11px] text-teal-200 font-medium">
                Multi-User Financial Profile & Chat History Isolation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              setTab('otp');
              setError(null);
            }}
            className={`flex-1 py-3 px-2.5 flex items-center justify-center gap-1.5 border-b-2 transition-colors whitespace-nowrap ${
              tab === 'otp'
                ? 'border-emerald-600 text-emerald-800 bg-white font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
            <span>Customer OTP Login</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setError(null);
            }}
            className={`flex-1 py-3 px-2.5 flex items-center justify-center gap-1.5 border-b-2 transition-colors whitespace-nowrap ${
              tab === 'login'
                ? 'border-blue-600 text-blue-700 bg-white font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Email & Password</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('switch');
              setError(null);
            }}
            className={`flex-1 py-3 px-2.5 flex items-center justify-center gap-1.5 border-b-2 transition-colors whitespace-nowrap ${
              tab === 'switch'
                ? 'border-blue-600 text-blue-700 bg-white font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Personas</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setError(null);
            }}
            className={`flex-1 py-3 px-2.5 flex items-center justify-center gap-1.5 border-b-2 transition-colors whitespace-nowrap ${
              tab === 'register'
                ? 'border-blue-600 text-blue-700 bg-white font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Register</span>
          </button>
        </div>

        {/* Quick Temporary Credentials Banner */}
        <div className="mx-5 mt-4 p-3 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-amber-950 font-extrabold text-[11px]">
              <KeyRound className="w-3.5 h-3.5 text-amber-700" />
              <span>Temporary Credentials & Quick Access</span>
            </div>
            <span className="text-[9px] bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-md font-bold">
              Active Server Demo
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            {/* Customer Demo Account */}
            <div className="bg-white p-2.5 rounded-xl border border-amber-200/80 flex flex-col justify-between gap-1 shadow-2xs">
              <div>
                <span className="text-[10px] font-extrabold text-emerald-700 uppercase block">
                  Temporary Customer Account
                </span>
                <p className="font-mono text-slate-800 text-[11px] font-bold truncate">customer.demo@finpath.ai</p>
                <p className="font-mono text-slate-600 text-[10px]">Password: <strong className="text-slate-900">tempPassword2026</strong></p>
                <p className="font-mono text-slate-600 text-[10px]">Mobile: +91 98765 00123</p>
              </div>
              <div className="flex items-center gap-1 pt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setTab('login');
                    setEmail('customer.demo@finpath.ai');
                    setPassword('tempPassword2026');
                    handleLogin(undefined, 'customer.demo@finpath.ai', 'tempPassword2026');
                  }}
                  className="flex-1 py-1 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] text-center transition-colors shadow-2xs"
                >
                  ⚡ Auto-Login Customer
                </button>
                <button
                  type="button"
                  onClick={() => copyToClipboard('customer.demo@finpath.ai / tempPassword2026', 'cust_creds')}
                  className="p-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                  title="Copy customer email & password"
                >
                  {copiedField === 'cust_creds' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Merchant Demo Account */}
            <div className="bg-white p-2.5 rounded-xl border border-amber-200/80 flex flex-col justify-between gap-1 shadow-2xs">
              <div>
                <span className="text-[10px] font-extrabold text-blue-700 uppercase block">
                  Lead Merchant Account
                </span>
                <p className="font-mono text-slate-800 text-[11px] font-bold truncate">suyash@finpath.ai</p>
                <p className="font-mono text-slate-600 text-[10px]">Password: <strong className="text-slate-900">password123</strong></p>
                <p className="font-mono text-slate-600 text-[10px]">Mobile: +91 98765 43210</p>
              </div>
              <div className="flex items-center gap-1 pt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setTab('login');
                    setEmail('suyash@finpath.ai');
                    setPassword('password123');
                    handleLogin(undefined, 'suyash@finpath.ai', 'password123');
                  }}
                  className="flex-1 py-1 px-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] text-center transition-colors shadow-2xs"
                >
                  ⚡ Auto-Login Merchant
                </button>
                <button
                  type="button"
                  onClick={() => copyToClipboard('suyash@finpath.ai / password123', 'suyash_creds')}
                  className="p-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                  title="Copy merchant email & password"
                >
                  {copiedField === 'suyash_creds' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback notices */}
        {error && (
          <div className="mx-5 mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-5 mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {tab === 'otp' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="text-xs text-slate-600 leading-relaxed">
                Send a secure 6-digit One-Time Password directly to the customer’s phone number or email address to authenticate.
              </div>

              {/* Step 1: Customer Phone / Email */}
              <form onSubmit={handleSendOtp} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Customer Mobile Number or Email
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        value={otpDestination}
                        onChange={(e) => setOtpDestination(e.target.value)}
                        placeholder="+91 98765 00123 or customer.demo@finpath.ai"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0 shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{loading ? 'Sending...' : 'Send OTP'}</span>
                    </button>
                  </div>
                </div>
              </form>

              {/* Simulated Customer Device Notification Box */}
              {sentOtpInfo && (
                <div className="p-3.5 bg-emerald-50/90 border border-emerald-300 rounded-2xl text-xs space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-emerald-950 font-bold">
                      <Smartphone className="w-4 h-4 text-emerald-700" />
                      <span>Simulated Customer Notification</span>
                    </div>
                    <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                      Dispatched
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-emerald-200 font-mono text-xs text-slate-800 shadow-2xs">
                    <p className="text-slate-500 text-[10px] mb-1">To: {sentOtpInfo.destination}</p>
                    <p className="leading-relaxed">
                      "Your FinPath verification code is{' '}
                      <strong className="text-emerald-700 font-black text-sm tracking-widest bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                        {sentOtpInfo.otp}
                      </strong>
                      . Valid for 5 minutes."
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => setOtpCode(sentOtpInfo.otp)}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline flex items-center gap-1 cursor-pointer"
                    >
                      ⚡ Auto-fill 6-Digit Code ({sentOtpInfo.otp})
                    </button>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={loading}
                      className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Resend Code</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Verification Input */}
              <form onSubmit={handleVerifyOtp} className="space-y-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Enter 6-Digit OTP Code
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="e.g. 482910"
                      className="w-full pl-9 pr-3 py-2.5 text-lg tracking-widest font-mono font-black text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !otpCode}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs"
                >
                  {loading ? 'Verifying...' : 'Verify OTP & Log In as Customer'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}
          {tab === 'switch' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-600 leading-relaxed">
                FinPath manages distinct financial profiles, goals, decisions, and isolated chatbot conversation history for each consumer persona.
              </div>

              <div className="space-y-2.5">
                {demoAccounts.map((acc) => {
                  const isActive = currentUser?.id === acc.id;
                  return (
                    <div
                      key={acc.id}
                      onClick={() => handleSwitchUser(acc.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 ${
                        isActive
                          ? 'bg-blue-50/80 border-blue-400 shadow-xs ring-2 ring-blue-500/20'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                              isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {acc.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-slate-900">{acc.name}</span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                                {acc.badge}
                              </span>
                              {isActive && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">
                                  Active Session
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500">{acc.occupation}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={loading}
                          className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all ${
                            isActive
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-blue-600 hover:text-white'
                          }`}
                        >
                          {isActive ? 'Current' : 'Select'}
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-[10px]">
                        <div>
                          <span className="text-slate-400 block">Monthly Income</span>
                          <span className="font-bold text-slate-800">{formatINR(acc.monthlyIncome)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Existing EMI</span>
                          <span className="font-bold text-slate-800">{formatINR(acc.existingEmi)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">CIBIL / Runway</span>
                          <span className="font-bold text-slate-800">
                            {acc.creditScore} • {acc.runway}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'login' && (
            <form onSubmit={(e) => handleLogin(e)} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="login-password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-9 pr-10 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <button
                    type="button"
                    id="toggle-login-password-visibility"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors focus:outline-none"
                    title={showPassword ? 'Hide password' : 'Show password'}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Authenticating...' : 'Sign In to FinPath'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] text-slate-500 block mb-1.5 font-medium">
                  Or quick-fill demo credentials:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {demoAccounts.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => {
                        setEmail(d.email);
                        setPassword(d.password);
                        handleLogin(undefined, d.email, d.password);
                      }}
                      className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-[10px] text-slate-700 font-semibold transition-colors border border-slate-200"
                    >
                      {d.name.split(' ')[0]} ({d.email})
                    </button>
                  ))}
                </div>
              </div>
            </form>
          )}

          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Amit Patel"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="amit@business.in"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Occupation</label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    placeholder="e.g. Cafe Owner / Trader"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Monthly Income (₹)</label>
                  <div className="relative">
                    <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="number"
                      required
                      min="10000"
                      value={income}
                      onChange={(e) => setIncome(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      id="register-password-input"
                      type={showRegisterPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 chars"
                      className="w-full pl-9 pr-10 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                    <button
                      type="button"
                      id="toggle-register-password-visibility"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors focus:outline-none"
                      title={showRegisterPassword ? 'Hide password' : 'Show password'}
                      aria-label={showRegisterPassword ? 'Hide password' : 'Show password'}
                    >
                      {showRegisterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Creating Profile...' : 'Register & Initialize Dashboard'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>

        {/* Footer info & Active Session status */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          {currentUser ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 text-[11px] text-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                <span>
                  Logged in as <strong className="font-extrabold text-slate-900">{currentUser.name}</strong>
                </span>
              </div>
              <button
                type="button"
                id="modal-logout-btn"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1.5 transition-colors border border-rose-200"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          ) : (
            <div className="w-full text-center text-[10px] text-slate-500">
              Not logged in. Select a persona above or enter credentials to start your session.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
