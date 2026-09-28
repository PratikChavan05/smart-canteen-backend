import React, { useState, useEffect } from 'react';
import {
  Mail,
  Lock,
  User,
  ChefHat,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  Radio,
  CreditCard,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import OTPInput from '../components/shared/OTPInput';

export default function Login({ onAuthSuccess }) {
  const { login, register, verifyOtp, resendOtp } = useAuth();
  const { showToast } = useToast();

  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'otp'
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
  });

  const [otpCode, setOtpCode] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let timer;
    if (mode === 'otp' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [mode, countdown]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const calculatePasswordStrength = (pass) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 6) score += 25;
    if (pass.length >= 8) score += 25;
    if (/[A-Z]/.test(pass)) score += 25;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 25;
    return score;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(formData.email, formData.password);
      showToast(`Welcome back, ${data.fullName || 'User'}!`, 'success');
      onAuthSuccess();
    } catch (err) {
      const message = err.message || 'Login failed. Please check your credentials.';
      if (message.toLowerCase().includes('not verified') || message.toLowerCase().includes('verify your email')) {
        showToast('Email not verified. Enter the OTP we just sent.', 'info');
        setMode('otp');
        setCountdown(60);
        setCanResend(false);
      } else {
        showToast(message, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (formData.password.length < 6) {
      showToast('Password must be at least 6 characters long', 'warning');
      return;
    }

    setLoading(true);
    try {
      await register(formData.fullName, formData.email, formData.password);
      showToast('Account created! Please enter the 6-digit OTP sent to your email.', 'info');
      setMode('otp');
      setCountdown(60);
      setCanResend(false);
    } catch (err) {
      showToast(err.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    if (otpCode.length !== 6) {
      showToast('Please enter the full 6-digit code', 'warning');
      return;
    }

    setLoading(true);
    try {
      const data = await verifyOtp(formData.email, otpCode);
      showToast('Email verified successfully! Welcome to Smart Canteen.', 'success');
      onAuthSuccess();
    } catch (err) {
      showToast(err.message || 'OTP verification failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    try {
      await resendOtp(formData.email);
      showToast('A new OTP has been dispatched to your email', 'success');
      setCountdown(60);
      setCanResend(false);
      setOtpCode('');
    } catch (err) {
      showToast(err.message || 'Failed to resend OTP', 'error');
    }
  };

  const strength = calculatePasswordStrength(formData.password);

  return (
    <div className="min-h-screen w-full flex bg-[#eef1f4] text-slate-900 relative overflow-hidden">
      {/* Left Column: Brand Showcase (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-16 relative z-10 border-r border-slate-200 bg-white">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-teal-700 flex items-center justify-center shadow-sm">
              <ChefHat className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold font-display tracking-tight text-slate-900">
              Smart Canteen
            </span>
          </div>

          <div className="mt-20 max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-teal-800 text-xs font-semibold mb-6 sc-badge">
              Campus dining, simplified
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold font-display leading-tight tracking-tight text-slate-900">
              Skip the queue.
              <br />
              <span className="gradient-text-primary">Savor the moment.</span>
            </h1>

            <p className="text-slate-500 text-sm mt-5 leading-relaxed">
              Order fresh meals from your device, track live kitchen prep in real time, and pick up when hot and ready.
            </p>

            {/* Feature Highlights */}
            <div className="mt-10 space-y-3">
              <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-stone-50 border border-slate-200">
                <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">Instant Razorpay Checkout</h4>
                  <p className="text-xs text-slate-500">UPI, Cards, and Net Banking supported</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-stone-50 border border-slate-200">
                <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">Live WebSocket Updates</h4>
                  <p className="text-xs text-slate-500">Real-time status without refreshing</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-stone-50 border border-slate-200">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">Secure Email & OTP Verification</h4>
                  <p className="text-xs text-slate-500">Protected accounts with instant tokens</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-xs text-slate-500 flex items-center gap-6">
          <span>© 2026 Smart Canteen</span>
          <span>·</span>
          <span>Fast, Reliable & Connected</span>
        </div>
      </div>

      {/* Right Column: Authentication Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile Brand Header */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-teal-700 flex items-center justify-center shadow-sm">
              <ChefHat className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold font-display text-slate-900">Smart Canteen</span>
          </div>

          <div className="glass-panel p-8 sm:p-10 rounded-2xl relative">
            {/* Mode Switcher (Login / Register) */}
            {mode !== 'otp' ? (
              <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200 mb-8">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    mode === 'login'
                      ? 'bg-teal-700 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    mode === 'register'
                      ? 'bg-teal-700 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Create Account
                </button>
              </div>
            ) : null}

            {/* View 1: Login Form */}
            {mode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 font-display">Welcome Back</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Sign in to browse menus and check your orders
                  </p>
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                      <Mail className="h-4 w-4" />
                    </span>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="alex@example.com"
                      className="glass-input w-full pl-10 pr-4 py-3 rounded-xl text-slate-900 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                      <Lock className="h-4 w-4" />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      placeholder="••••••••"
                      className="glass-input w-full pl-10 pr-10 py-3 rounded-xl text-slate-900 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 mt-2 gradient-btn-primary rounded-xl font-semibold text-white flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* View 2: Register Form */}
            {mode === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 font-display">Create Account</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Get started with your smart dining experience
                  </p>
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                      <User className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      placeholder="Alex Taylor"
                      className="glass-input w-full pl-10 pr-4 py-3 rounded-xl text-slate-900 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                      <Mail className="h-4 w-4" />
                    </span>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="alex@example.com"
                      className="glass-input w-full pl-10 pr-4 py-3 rounded-xl text-slate-900 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                      <Lock className="h-4 w-4" />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      placeholder="At least 6 characters"
                      className="glass-input w-full pl-10 pr-10 py-3 rounded-xl text-slate-900 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Password strength bar */}
                  {formData.password && (
                    <div className="mt-2">
                      <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            strength <= 25
                              ? 'bg-rose-500 w-1/4'
                              : strength <= 50
                              ? 'bg-amber-500 w-2/4'
                              : strength <= 75
                              ? 'bg-teal-600 w-3/4'
                              : 'bg-emerald-600 w-full'
                          }`}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Strength:{' '}
                        {strength <= 25
                          ? 'Weak'
                          : strength <= 50
                          ? 'Fair'
                          : strength <= 75
                          ? 'Good'
                          : 'Strong'}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 mt-2 gradient-btn-primary rounded-xl font-semibold text-white flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Continue & Verify OTP</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* View 3: OTP Verification Screen */}
            {mode === 'otp' && (
              <div className="space-y-6 text-center animate-fade-in-up">
                <div className="w-14 h-14 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center mx-auto text-teal-700">
                  <Mail className="w-6 h-6" />
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-slate-900 font-display">Verify Your Email</h3>
                  <p className="text-xs text-slate-500 mt-1.5">
                    We sent a 6-digit code to{' '}
                    <span className="text-teal-800 font-semibold">{formData.email}</span>
                  </p>
                </div>

                {/* 6-Digit OTP Inputs */}
                <div className="py-2">
                  <OTPInput
                    value={otpCode}
                    onChange={setOtpCode}
                    length={6}
                    disabled={loading}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={loading || otpCode.length !== 6}
                  className="w-full py-3.5 gradient-btn-primary rounded-xl font-semibold text-white flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Verify & Enter</span>
                      <ShieldCheck className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Resend OTP Timer */}
                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setOtpCode('');
                    }}
                    className="hover:text-slate-800 transition cursor-pointer"
                  >
                    ← Change Email
                  </button>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={!canResend}
                    className={`font-semibold transition cursor-pointer ${
                      canResend ? 'text-teal-700 hover:text-teal-800' : 'text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {canResend ? 'Resend Code' : `Resend in ${countdown}s`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
