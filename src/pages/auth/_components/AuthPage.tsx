import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, Gamepad2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '../../../components/ToastProvider';
import { useAuth } from '../../../hooks/useAuth';

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
    email: locationState?.email ?? '',
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

  const verificationEmail = useMemo(() => {
    if (mode === 'signup') {
      return signupForm.email;
    }

    return locationState?.email ?? signupForm.email ?? loginForm.email ?? forgotEmail;
  }, [forgotEmail, locationState?.email, loginForm.email, mode, signupForm.email]);

  const redirectAfterAuth = locationState?.from?.pathname || '/home';

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      return;
    }

    const nextOtp = [...verifyOtp];
    nextOtp[index] = value;
    setVerifyOtp(nextOtp);

    if (value && index < nextOtp.length - 1) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      await auth.register({
        fullName: signupForm.fullName.trim(),
        email: signupForm.email.trim(),
        username: signupForm.username.trim(),
        password: signupForm.password,
        referralCode: signupForm.referralCode.trim() || undefined,
      });

      toast.success('Account created. Enter the verification code we sent to your email.');
      navigate('/verify', { state: { email: signupForm.email.trim() } });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to create your account.');
    }
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      await auth.login({
        email: loginForm.email.trim(),
        password: loginForm.password,
      });

      toast.success('Logged in successfully.');
      navigate(redirectAfterAuth, { replace: true });
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
      await auth.verifyEmail({
        email: verificationEmail.trim(),
        otp,
      });

      toast.success('Email verified successfully.');
      navigate('/home', { replace: true });
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
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Username</label>
                <input
                  type="text"
                  required
                  value={signupForm.username}
                  onChange={(e) => setSignupForm((current) => ({ ...current, username: e.target.value }))}
                  placeholder="alexgamer"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white focus:outline-none focus:border-brand-primary/50 transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={signupForm.password}
                  onChange={(e) => setSignupForm((current) => ({ ...current, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white focus:outline-none focus:border-brand-primary/50 transition-colors"
                />
              </div>
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
                disabled={auth.submitting}
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
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={loginForm.email}
                  onChange={(e) => setLoginForm((current) => ({ ...current, email: e.target.value }))}
                  placeholder="alex@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white focus:outline-none focus:border-brand-primary/50 transition-colors"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Password</label>
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password', { state: { email: loginForm.email.trim() } })}
                    className="text-[10px] font-bold text-brand-primary hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={loginForm.password}
                  onChange={(e) => setLoginForm((current) => ({ ...current, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white focus:outline-none focus:border-brand-primary/50 transition-colors"
                />
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
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={resetForm.newPassword}
                  onChange={(e) => setResetForm((current) => ({ ...current, newPassword: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white focus:outline-none focus:border-brand-primary/50 transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Confirm Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={resetForm.confirmPassword}
                  onChange={(e) => setResetForm((current) => ({ ...current, confirmPassword: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white focus:outline-none focus:border-brand-primary/50 transition-colors"
                />
              </div>
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
