import React, { useState, useRef, useEffect } from 'react';
import {
  Compass,
  ArrowRight,
  Shield,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Edit2,
  Sparkles,
  Lock,
} from 'lucide-react';
import { UserAccount, FinancialProfile, FinancialHealth } from '../types';

interface OtpAuthViewProps {
  initialStep?: 'login' | 'verify';
  initialPhone?: string;
  onLoginSuccess: (user: UserAccount, profile: FinancialProfile, health: FinancialHealth, isDemo?: boolean, sessionId?: string) => void;
  onNavigateToDashboard?: () => void;
}

export const OtpAuthView: React.FC<OtpAuthViewProps> = ({
  initialStep = 'login',
  initialPhone = '',
  onLoginSuccess,
}) => {
  const [step, setStep] = useState<'login' | 'verify'>(initialStep);
  const [phoneDigits, setPhoneDigits] = useState(
    initialPhone ? initialPhone.replace(/\D/g, '').slice(-10) : ''
  );
  const [formattedPhone, setFormattedPhone] = useState(
    initialPhone ? `+91 ${initialPhone.replace(/\D/g, '').slice(-10)}` : ''
  );

  // OTP state: 6 separate digit boxes
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Flow & UI states
  const [loginState, setLoginState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [verifyState, setVerifyState] = useState<'idle' | 'verifying' | 'verified'>('idle');
  const [demoState, setDemoState] = useState<'idle' | 'loading'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Resend timer countdown (30s)
  const [timerSeconds, setTimerSeconds] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // Dev mock hint state
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'verify' && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timerSeconds]);

  // Focus first OTP box when transitioning to verify step
  useEffect(() => {
    if (step === 'verify') {
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  // Handle phone input change
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhoneDigits(val);
  };

  // Validate phone
  const isValidPhone = /^[6-9]\d{9}$/.test(phoneDigits);

  // Step 1: Send OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    if (!isValidPhone) {
      setErrorMsg('Enter a valid 10-digit mobile number.');
      return;
    }

    const fullPhone = `+91${phoneDigits}`;
    setLoginState('sending');

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send OTP. Please try again.');
      }

      setLoginState('sent');
      setFormattedPhone(`+91 ${phoneDigits.slice(0, 5)} ${phoneDigits.slice(5)}`);

      // Reset verify timer & inputs
      setTimerSeconds(30);
      setCanResend(false);
      setOtpDigits(['', '', '', '', '', '']);

      // Transition to verify view
      setTimeout(() => {
        setStep('verify');
        setLoginState('idle');
      }, 600);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error sending OTP');
      setLoginState('idle');
    }
  };

  // Step 2: Resend OTP
  const handleResendOtp = async () => {
    if (!canResend) return;
    setErrorMsg(null);
    const fullPhone = `+91${phoneDigits}`;

    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to resend OTP');
      }

      setTimerSeconds(30);
      setCanResend(false);
      setOtpDigits(['', '', '', '', '', '']);
      otpInputsRef.current[0]?.focus();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error resending OTP');
    }
  };

  // Step 3: Handle Individual OTP digit box interactions
  const handleOtpBoxChange = (index: number, val: string) => {
    setErrorMsg(null);
    const digit = val.replace(/\D/g, '').slice(-1);

    const updated = [...otpDigits];
    updated[index] = digit;
    setOtpDigits(updated);

    if (digit && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }

    // Check if all 6 digits entered
    const fullCode = updated.join('');
    if (fullCode.length === 6) {
      handleVerifyOtp(fullCode);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        otpInputsRef.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const updated = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      updated[i] = pastedData[i] || '';
    }
    setOtpDigits(updated);

    const nextIndex = Math.min(pastedData.length, 5);
    otpInputsRef.current[nextIndex]?.focus();

    if (pastedData.length === 6) {
      handleVerifyOtp(pastedData);
    }
  };

  // Step 4: Verify OTP
  const handleVerifyOtp = async (codeToVerify?: string) => {
    const code = codeToVerify || otpDigits.join('');
    if (code.length !== 6) {
      setErrorMsg('Please enter all 6 digits of the OTP.');
      return;
    }

    setErrorMsg(null);
    setVerifyState('verifying');
    const fullPhone = `+91${phoneDigits}`;

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone, otp: code }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Verification failed. Check the code.');
      }

      setVerifyState('verified');

      setTimeout(() => {
        onLoginSuccess(data.user, data.profile, data.health, false, data.sessionId);
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid or expired OTP');
      setVerifyState('idle');
      // Clear OTP inputs on error to encourage re-entry
      setOtpDigits(['', '', '', '', '', '']);
      otpInputsRef.current[0]?.focus();
    }
  };

  // Demo Login Mode (Synthetic User, No SMS required)
  const handleDemoLogin = async () => {
    setErrorMsg(null);
    setDemoState('loading');

    try {
      const res = await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to start demo session');
      }

      setTimeout(() => {
        onLoginSuccess(data.user, data.profile, data.health, true, data.sessionId);
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Demo session initialization failed');
      setDemoState('idle');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafd] flex flex-col justify-center items-center px-4 py-12 selection:bg-blue-600 selection:text-white">
      {/* Container Box */}
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header Banner */}
        <div className="p-6 sm:p-8 bg-gradient-to-b from-slate-50/80 to-white border-b border-slate-100 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-teal-500 text-white shadow-lg shadow-blue-600/20 mb-4">
            <Compass className="w-8 h-8 animate-pulse" />
          </div>

          <div className="flex items-center justify-center gap-2 mb-1">
            <h1 className="text-xl font-black tracking-tight text-slate-900">FINPATH</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Decision Copilot
            </span>
          </div>

          <p className="text-sm font-semibold text-slate-700">
            {step === 'login' ? 'Your financial journey starts here.' : 'VERIFY YOUR NUMBER'}
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            {step === 'login'
              ? 'Securely sign in to continue with FinPath.'
              : `We sent a 6-digit OTP to ${formattedPhone || `+91 ${phoneDigits}`}`}
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Error Banner */}
          {errorMsg && (
            <div
              id="auth-error-banner"
              className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-in shake"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: MOBILE NUMBER INPUT */}
          {step === 'login' && (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div>
                <label
                  htmlFor="mobile-number-input"
                  className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2"
                >
                  Mobile Number
                </label>
                <div className="relative flex items-center">
                  {/* Fixed Country Code Badge */}
                  <div className="absolute left-3 flex items-center gap-1.5 pl-1 text-xs font-black text-slate-700 select-none pointer-events-none border-r border-slate-200 pr-2.5">
                    <span>🇮🇳</span>
                    <span>+91</span>
                  </div>

                  <input
                    id="mobile-number-input"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={10}
                    value={phoneDigits}
                    onChange={handlePhoneChange}
                    placeholder="98765 43210"
                    autoFocus
                    className="w-full pl-24 pr-4 py-3 text-sm font-mono tracking-wider font-bold rounded-2xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-2xs"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Enter your 10-digit Indian mobile number to receive OTP.
                </p>
              </div>

              {/* Primary Action: Send OTP */}
              <button
                type="submit"
                id="send-otp-btn"
                disabled={loginState !== 'idle' || phoneDigits.length !== 10}
                className={`w-full py-3 px-4 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm ${
                  loginState === 'sent'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {loginState === 'sending' && (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sending OTP...</span>
                  </>
                )}
                {loginState === 'sent' && (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>OTP sent ✓</span>
                  </>
                )}
                {loginState === 'idle' && (
                  <>
                    <span>Send OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase">
                  <span className="bg-white px-2.5 text-slate-400 font-bold tracking-wider">
                    Quick Evaluation
                  </span>
                </div>
              </div>

              {/* Secondary Action: Try Demo */}
              <button
                type="button"
                id="try-demo-btn"
                onClick={handleDemoLogin}
                disabled={demoState === 'loading'}
                className="w-full py-3 px-4 rounded-2xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors border border-slate-200/80 flex items-center justify-center gap-2 shadow-2xs disabled:opacity-60"
              >
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>
                  {demoState === 'loading'
                    ? 'Preparing Demo Session...'
                    : 'Try Demo (One-Click Merchant Mode)'}
                </span>
              </button>
            </form>
          )}

          {/* STEP 2: VERIFY 6-DIGIT OTP */}
          {step === 'verify' && (
            <div className="space-y-6">
              {/* Number Edit row */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-slate-500" />
                  <span className="font-mono font-bold text-slate-800">{formattedPhone}</span>
                </div>
                <button
                  type="button"
                  id="edit-number-btn"
                  onClick={() => {
                    setStep('login');
                    setErrorMsg(null);
                  }}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit number</span>
                </button>
              </div>

              {/* 6 Individual Digit Boxes */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-3 text-center">
                  Enter 6-Digit Code
                </label>
                <div className="flex justify-between gap-2 sm:gap-2.5">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpInputsRef.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpBoxChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onPaste={handleOtpPaste}
                      className={`w-11 sm:w-12 h-14 text-center text-xl font-mono font-extrabold rounded-2xl border transition-all shadow-xs ${
                        digit
                          ? 'border-blue-600 bg-blue-50/50 text-blue-900 ring-2 ring-blue-500/20'
                          : 'border-slate-300 bg-white text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Resend Timer / Action */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500 font-medium">Didn't receive code?</span>
                {canResend ? (
                  <button
                    type="button"
                    id="resend-otp-btn"
                    onClick={handleResendOtp}
                    className="font-bold text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Resend OTP</span>
                  </button>
                ) : (
                  <span className="font-mono text-slate-500 font-semibold">
                    Resend OTP in <span className="text-slate-800 font-bold">{timerSeconds}s</span>
                  </span>
                )}
              </div>

              {/* Primary Action: Verify & Continue */}
              <button
                type="button"
                id="verify-continue-btn"
                onClick={() => handleVerifyOtp()}
                disabled={verifyState !== 'idle' || otpDigits.join('').length !== 6}
                className={`w-full py-3 px-4 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm ${
                  verifyState === 'verified'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {verifyState === 'verifying' && (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                )}
                {verifyState === 'verified' && (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>✓ Verified. Welcome to FinPath</span>
                  </>
                )}
                {verifyState === 'idle' && (
                  <>
                    <span>Verify & Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Development Mode Helper Notice */}
              <div className="p-3 bg-amber-50/80 border border-amber-200/90 rounded-2xl text-[11px] text-amber-900 space-y-1">
                <div className="flex items-center gap-1.5 font-extrabold text-amber-950">
                  <Shield className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>Developer Hackathon Environment</span>
                </div>
                <p className="text-[10px] text-amber-800 leading-relaxed">
                  Cryptographic OTP generated via <code className="bg-amber-100 px-1 py-0.2 rounded font-mono">crypto.randomInt</code> and dispatched via Mock SMS Provider. Check server logs for the 6-digit code.
                </p>
              </div>
            </div>
          )}

          {/* Privacy & Purpose-Bound Consent Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-[10px] text-slate-400 text-center">
            <Lock className="w-3 h-3 text-slate-400 shrink-0" />
            <span>Encrypted with HTTP-Only Cookie • Purpose-Bound Consent</span>
          </div>
        </div>
      </div>
    </div>
  );
};
