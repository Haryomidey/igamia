import React, { useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, Eye, EyeOff, Gamepad2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '../../../components/ToastProvider';
import { useAuth } from '../../../hooks/useAuth';
import { needsOnboarding } from '../../../lib/profile';

interface AuthProps {
  mode: 'login' | 'signup' | 'verify' | 'forgot-password' | 'reset-password';
}

type NavigationState = {
  email?: string;
  from?: {
    pathname?: string;
  };
};

export default function Auth({ mode }: AuthProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const auth = useAuth();
  const locationState = (location.state as NavigationState | null) ?? null;

  const [loginForm, setLoginForm] = useState({
    identifier: locationState?.email ?? '',
    password: '',
  });
  const [signupForm, setSignupForm] = useState({
    fullName: '',
    email: locationState?.email ?? '',
    username: '',
    password: '',
    referralCode: '',
  });
  const [forgotEmail, setForgotEmail] = useState(locationState?.email ?? '');
  const [resetForm, setResetForm] = useState({
    email: locationState?.email ?? '',
    otp: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [verifyOtp, setVerifyOtp] = useState(['', '', '', '']);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<{
    state: 'idle' | 'checking' | 'available' | 'unavailable';
    message: string;
    suggestions: string[];
    normalizedUsername?: string;
  }>({
    state: 'idle',
    message: '',
    suggestions: [],
  });
  const usernameRequestRef = useRef(0);

  const verificationEmail = useMemo(() => {
    if (mode === 'signup') {
      return signupForm.email;
    }

    return locationState?.email ?? signupForm.email ?? loginForm.identifier ?? forgotEmail;
  }, [forgotEmail, locationState?.email, loginForm.identifier, mode, signupForm.email]);

  const redirectAfterAuth = locationState?.from?.pathname || '/home';

  const signupValidation = useMemo(() => {
    const fullName = signupForm.fullName.trim();
    const email = signupForm.email.trim();
    const username = signupForm.username.trim();
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const usernameValid = /^[a-zA-Z0-9_]{3,20}$/.test(username);
    const passwordValid = signupForm.password.length >= 6;

    return {
      fullNameValid: fullName.length >= 2,
      emailValid,
      usernameValid,
      passwordValid,
      canSubmit:
        fullName.length >= 2 &&
        emailValid &&
        usernameValid &&
        passwordValid &&
        usernameStatus.state === 'available',
    };
  }, [signupForm, usernameStatus.state]);

  const handleUsernameChange = async (value: string) => {
    const requestId = Date.now();
    usernameRequestRef.current = requestId;
    setSignupForm((current) => ({ ...current, username: value }));
    const trimmed = value.trim();

    if (!trimmed) {
      setUsernameStatus({ state: 'idle', message: '', suggestions: [] });
      return;
    }

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(trimmed)) {
      setUsernameStatus({
        state: 'unavailable',
        message: 'Use 3-20 letters, numbers, or underscores.',
        suggestions: [],
      });
      return;
    }

    setUsernameStatus({
      state: 'checking',
      message: 'Checking username...',
      suggestions: [],
    });

    try {
      const result = await auth.checkUsernameAvailability(trimmed);
      if (usernameRequestRef.current !== requestId) {
        return;
      }
      setUsernameStatus({
        state: result.available ? 'available' : 'unavailable',
        message: result.available
          ? `${result.normalizedUsername} is available.`
          : result.reason || `${result.normalizedUsername} is already taken.`,
        suggestions: result.suggestions,
        normalizedUsername: result.normalizedUsername,
      });

      if (result.available && result.normalizedUsername !== trimmed) {
        setSignupForm((current) => ({ ...current, username: result.normalizedUsername }));
      }
    } catch {
      if (usernameRequestRef.current !== requestId) {
        return;
      }
      setUsernameStatus({
        state: 'unavailable',
        message: 'Unable to verify username right now.',
        suggestions: [],
      });
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const sanitizedValue = value.replace(/\D/g, '');

    if (!sanitizedValue) {
      const nextOtp = [...verifyOtp];
      nextOtp[index] = '';
      setVerifyOtp(nextOtp);
      return;
    }

    if (sanitizedValue.length > 1) {
      const nextOtp = [...verifyOtp];
      sanitizedValue
        .slice(0, nextOtp.length - index)
        .split('')
        .forEach((digit, offset) => {
          nextOtp[index + offset] = digit;
        });
      setVerifyOtp(nextOtp);

      const nextFocusIndex = Math.min(index + sanitizedValue.length, nextOtp.length - 1);
      document.getElementById(`otp-${nextFocusIndex}`)?.focus();
      return;
    }

    const nextOtp = [...verifyOtp];
    nextOtp[index] = sanitizedValue;
    setVerifyOtp(nextOtp);

    if (sanitizedValue && index < nextOtp.length - 1) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pastedDigits = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, verifyOtp.length);
    if (!pastedDigits) {
      return;
    }

    const nextOtp = [...verifyOtp];
    pastedDigits.split('').forEach((digit, index) => {
      nextOtp[index] = digit;
    });
    setVerifyOtp(nextOtp);

    const nextFocusIndex = Math.min(pastedDigits.length - 1, nextOtp.length - 1);
    document.getElementById(`otp-${nextFocusIndex}`)?.focus();
  };

  const renderPasswordField = ({
    id,
    label,
    value,
    placeholder,
    visible,
    onChange,
    onToggle,
  }: {
    id: string;
    label: string;
    value: string;
    placeholder: string;
    visible: boolean;
    onChange: (value: string) => void;
    onToggle: () => void;
  }) => (
    <div className="space-y-1">
      <label htmlFor={id} className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          required
          minLength={6}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 pr-14 text-white focus:outline-none focus:border-brand-primary/50 transition-colors"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-xl text-zinc-500 transition-colors hover:bg-white/5 hover:text-white"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!signupValidation.fullNameValid) {
      toast.warning('Enter your full name.');
      return;
    }

    if (!signupValidation.emailValid) {
      toast.warning('Enter a valid email address.');
      return;
    }

    if (!signupValidation.usernameValid) {
      toast.warning('Username must be 3-20 characters using letters, numbers, or underscores.');
      return;
    }

    if (usernameStatus.state !== 'available') {
      toast.warning('Choose an available username before continuing.');
      return;
    }

    if (!signupValidation.passwordValid) {
      toast.warning('Password must be at least 6 characters.');
      return;
    }

    try {
      await auth.register({
        fullName: signupForm.fullName.trim(),
        email: signupForm.email.trim(),
        username: signupForm.username.trim(),
        password: signupForm.password,
        referralCode: signupForm.referralCode.trim() || undefined,
      });

      // Temporary direct-signup flow. Send users to /verify again when OTP is restored.
      toast.success('Account created successfully.');
      navigate('/personalize', { replace: true });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to create your account.');
    }
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      const result = await auth.login({
        email: loginForm.identifier.trim(),
        password: loginForm.password,
      });

      toast.success('Logged in successfully.');
      navigate(needsOnboarding(result.user) ? '/personalize' : redirectAfterAuth, { replace: true });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to log in.');
    }
  };

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    const otp = verifyOtp.join('').trim();

    if (!verificationEmail) {
      toast.warning('Please go back and enter your email first.');
      return;
    }

    if (otp.length < 4) {
      toast.warning('Enter the full verification code.');
      return;
    }

    try {
      const result = await auth.verifyEmail({
        email: verificationEmail.trim(),
        otp,
      });

      toast.success('Email verified successfully.');
      navigate(needsOnboarding(result.user) ? '/personalize' : '/home', { replace: true });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to verify code.');
    }
  };

  const handleForgotPassword = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      await auth.forgotPassword(forgotEmail.trim());
      toast.success('Password reset code sent to your email.');
      navigate('/reset-password', { state: { email: forgotEmail.trim() } });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to start password reset.');
    }
  };

  const handleResetPassword = async (event: React.FormEvent) => {
    event.preventDefault();

    if (resetForm.newPassword !== resetForm.confirmPassword) {
      toast.warning('Passwords do not match.');
      return;
    }

    try {
      await auth.resetPassword({
        email: resetForm.email.trim(),
        otp: resetForm.otp.trim(),
        newPassword: resetForm.newPassword,
      });

      toast.success('Password reset successfully. You can now log in.');
      navigate('/login', { state: { email: resetForm.email.trim() } });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to reset password.');
    }
  };

  const renderForm = () => {
    switch (mode) {
      case 'signup':
        return (
          <motion.div
            key="signup"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <h1 className="text-4xl font-black tracking-tighter uppercase italic">Sign Up</h1>
              <p className="text-zinc-500 text-sm">Join the next generation of social gaming.</p>
            </div>
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={signupForm.fullName}
                  onChange={(e) => setSignupForm((current) => ({ ...current, fullName: e.target.value }))}
                  placeholder="Alex Johnson"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white focus:outline-none focus:border-brand-primary/50 transition-colors"
                />
                {!signupValidation.fullNameValid && signupForm.fullName.length > 0 && (
                  <p className="px-1 text-[11px] text-rose-300">Please enter at least 2 characters.</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={signupForm.email}
                  onChange={(e) => setSignupForm((current) => ({ ...current, email: e.target.value }))}
                  placeholder="alex@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white focus:outline-none focus:border-brand-primary/50 transition-colors"
                />
                {!signupValidation.emailValid && signupForm.email.length > 0 && (
                  <p className="px-1 text-[11px] text-rose-300">Enter a valid email address.</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Username</label>
                <input
                  type="text"
                  required
                  value={signupForm.username}
                  onChange={(e) => void handleUsernameChange(e.target.value)}
                  placeholder="alexgamer"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white focus:outline-none focus:border-brand-primary/50 transition-colors"
                />
                {usernameStatus.message && (
                  <p className={`px-1 text-[11px] ${
                    usernameStatus.state === 'available' ? 'text-emerald-300' : 'text-zinc-400'
                  }`}>
                    {usernameStatus.message}
                  </p>
                )}
                {usernameStatus.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2 px-1 pt-1">
                    {usernameStatus.suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => void handleUsernameChange(suggestion)}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-white/10"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {renderPasswordField({
                id: 'signup-password',
                label: 'Password',
                value: signupForm.password,
                placeholder: '••••••••',
                visible: showSignupPassword,
                onChange: (value) => setSignupForm((current) => ({ ...current, password: value })),
                onToggle: () => setShowSignupPassword((current) => !current),
              })}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Referral Code (Optional)</label>
                <input
                  type="text"
                  value={signupForm.referralCode}
                  onChange={(e) => setSignupForm((current) => ({ ...current, referralCode: e.target.value }))}
                  placeholder="IGAMIA-2024"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white focus:outline-none focus:border-brand-primary/50 transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={auth.submitting || !signupValidation.canSubmit}
                className="w-full bg-brand-primary text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-brand-accent hover:text-black transition-all shadow-lg shadow-brand-primary/20 disabled:opacity-50"
              >
                {auth.submitting ? 'Creating Account...' : 'Sign Up'}
              </button>
            </form>
            <p className="text-center text-xs text-zinc-500">
              Already have an account?{' '}
              <button type="button" onClick={() => navigate('/login')} className="text-brand-primary font-bold hover:underline">Log In</button>
            </p>
          </motion.div>
        );

      case 'login':
        return (
          <motion.div
            key="login"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <h1 className="text-4xl font-black tracking-tighter uppercase italic">Login</h1>
              <p className="text-zinc-500 text-sm">Welcome back, gamer! Ready to pledge?</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Email Or Username</label>
                <input
                  type="text"
                  required
                  value={loginForm.identifier}
                  onChange={(e) => setLoginForm((current) => ({ ...current, identifier: e.target.value }))}
                  placeholder="alex@example.com or alexgamer"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white focus:outline-none focus:border-brand-primary/50 transition-colors"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Password</label>
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password', { state: { email: loginForm.identifier.trim() } })}
                    className="text-[10px] font-bold text-brand-primary hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={loginForm.password}
                    onChange={(e) => setLoginForm((current) => ({ ...current, password: e.target.value }))}
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 pr-14 text-white focus:outline-none focus:border-brand-primary/50 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((current) => !current)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-xl text-zinc-500 transition-colors hover:bg-white/5 hover:text-white"
                    aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                  >
                    {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={auth.submitting}
                className="w-full bg-brand-primary text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-brand-accent hover:text-black transition-all shadow-lg shadow-brand-primary/20 disabled:opacity-50"
              >
                {auth.submitting ? 'Signing In...' : 'Login'}
              </button>
            </form>
            <p className="text-center text-xs text-zinc-500">
              Don&apos;t have an account?{' '}
              <button type="button" onClick={() => navigate('/signup')} className="text-brand-primary font-bold hover:underline">Sign Up</button>
            </p>
          </motion.div>
        );

      case 'verify':
        return (
          <motion.div
            key="verify"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <button type="button" onClick={() => navigate('/signup')} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">
              <ChevronLeft size={16} /> Back
            </button>
            <div className="space-y-2">
              <h1 className="text-4xl font-black tracking-tighter uppercase italic">Verify</h1>
              <p className="text-zinc-500 text-sm">Enter the 4-digit code sent to {verificationEmail || 'your email'}.</p>
            </div>
            <form onSubmit={handleVerify} className="space-y-8">
              <div className="flex justify-between gap-4">
                {verifyOtp.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onPaste={handleOtpPaste}
                    className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl text-center text-2xl font-black text-brand-primary focus:outline-none focus:border-brand-primary transition-colors"
                  />
                ))}
              </div>
              <button
                type="submit"
                disabled={auth.submitting}
                className="w-full bg-brand-primary text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-brand-accent hover:text-black transition-all shadow-lg shadow-brand-primary/20 disabled:opacity-50"
              >
                {auth.submitting ? 'Verifying...' : 'Verify'}
              </button>
            </form>
            <p className="text-center text-xs text-zinc-500">
              Didn&apos;t receive the code?{' '}
              <button
                type="button"
                onClick={async () => {
                  if (!verificationEmail) {
                    toast.warning('Add your email first so we know where to resend the code.');
                    return;
                  }

                  try {
                    await auth.resendVerification(verificationEmail.trim());
                    toast.success('Verification code resent.');
                  } catch (err: any) {
                    toast.error(err?.response?.data?.message ?? 'Unable to resend verification code.');
                  }
                }}
                className="text-brand-primary font-bold hover:underline"
              >
                Resend Code
              </button>
            </p>
          </motion.div>
        );

      case 'forgot-password':
        return (
          <motion.div
            key="forgot-password"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <button type="button" onClick={() => navigate('/login')} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">
              <ChevronLeft size={16} /> Back
            </button>
            <div className="space-y-2">
              <h1 className="text-4xl font-black tracking-tighter uppercase italic leading-tight">Forgot Password?</h1>
              <p className="text-zinc-500 text-sm">Enter your email to receive a reset code.</p>
            </div>
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="alex@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white focus:outline-none focus:border-brand-primary/50 transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={auth.submitting}
                className="w-full bg-brand-primary text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-brand-accent hover:text-black transition-all shadow-lg shadow-brand-primary/20 disabled:opacity-50"
              >
                {auth.submitting ? 'Sending...' : 'Send Reset Code'}
              </button>
            </form>
          </motion.div>
        );

      case 'reset-password':
        return (
          <motion.div
            key="reset-password"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <h1 className="text-4xl font-black tracking-tighter uppercase italic leading-tight">Reset Password</h1>
              <p className="text-zinc-500 text-sm">Enter the reset code and your new password below.</p>
            </div>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={resetForm.email}
                  onChange={(e) => setResetForm((current) => ({ ...current, email: e.target.value }))}
                  placeholder="alex@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white focus:outline-none focus:border-brand-primary/50 transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Reset Code</label>
                <input
                  type="text"
                  required
                  minLength={4}
                  maxLength={6}
                  value={resetForm.otp}
                  onChange={(e) => setResetForm((current) => ({ ...current, otp: e.target.value }))}
                  placeholder="1234"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white focus:outline-none focus:border-brand-primary/50 transition-colors"
                />
              </div>
              {renderPasswordField({
                id: 'reset-new-password',
                label: 'New Password',
                value: resetForm.newPassword,
                placeholder: '••••••••',
                visible: showResetPassword,
                onChange: (value) => setResetForm((current) => ({ ...current, newPassword: value })),
                onToggle: () => setShowResetPassword((current) => !current),
              })}
              {renderPasswordField({
                id: 'reset-confirm-password',
                label: 'Confirm Password',
                value: resetForm.confirmPassword,
                placeholder: '••••••••',
                visible: showResetConfirmPassword,
                onChange: (value) => setResetForm((current) => ({ ...current, confirmPassword: value })),
                onToggle: () => setShowResetConfirmPassword((current) => !current),
              })}
              <button
                type="submit"
                disabled={auth.submitting}
                className="w-full bg-brand-primary text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-brand-accent hover:text-black transition-all shadow-lg shadow-brand-primary/20 disabled:opacity-50"
              >
                {auth.submitting ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0b21] text-white flex overflow-hidden font-sans">
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-16 relative z-10">
        <div className="w-full max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 mb-12 group">
            <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-brand-primary/20">
              <Gamepad2 className="text-white" size={24} />
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase italic">iGamia</span>
          </Link>

          <AnimatePresence mode="wait">
            {renderForm()}
          </AnimatePresence>
        </div>
      </div>

      <div className="hidden lg:block lg:w-1/2 relative">
        <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#0f0b21] z-10" />
        <img
          src="https://picsum.photos/seed/gamer-auth/1000/1500"
          alt="Character"
          className="w-full h-full object-cover opacity-60"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0b21] via-transparent to-transparent z-10" />
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-brand-primary/20 blur-[120px] rounded-full -translate-y-1/2" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-brand-accent/10 blur-[100px] rounded-full" />
      </div>
    </div>
  );
}
