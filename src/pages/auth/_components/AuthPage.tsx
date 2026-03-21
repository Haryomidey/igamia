import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Gamepad2, Mail, Lock, User, ArrowRight, Github, Chrome, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AuthProps {
  mode: 'login' | 'signup' | 'verify' | 'forgot-password' | 'reset-password';
}

export default function Auth({ mode: initialMode }: AuthProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '']);
  const mode = initialMode;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate auth flow
    setTimeout(() => {
      setIsLoading(false);
      if (mode === 'signup') {
        navigate('/verify');
      } else if (mode === 'forgot-password') {
        navigate('/reset-password');
      } else {
        navigate('/home');
      }
    }, 1500);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Auto focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
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
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="Alex Johnson"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white focus:outline-none focus:border-brand-primary/50 transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  placeholder="alex@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white focus:outline-none focus:border-brand-primary/50 transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Password</label>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white focus:outline-none focus:border-brand-primary/50 transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Referral Code (Optional)</label>
                <input 
                  type="text" 
                  placeholder="IGAMIA-2024"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white focus:outline-none focus:border-brand-primary/50 transition-colors"
                />
              </div>
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-brand-primary text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-brand-accent hover:text-black transition-all shadow-lg shadow-brand-primary/20 disabled:opacity-50"
              >
                {isLoading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </form>
            <p className="text-center text-xs text-zinc-500">
              Already have an account?{' '}
              <button onClick={() => navigate('/login')} className="text-brand-primary font-bold hover:underline">Log In</button>
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
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  placeholder="alex@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white focus:outline-none focus:border-brand-primary/50 transition-colors"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Password</label>
                  <button 
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="text-[10px] font-bold text-brand-primary hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white focus:outline-none focus:border-brand-primary/50 transition-colors"
                />
              </div>
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-brand-primary text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-brand-accent hover:text-black transition-all shadow-lg shadow-brand-primary/20 disabled:opacity-50"
              >
                {isLoading ? 'Signing In...' : 'Login'}
              </button>
            </form>
            <p className="text-center text-xs text-zinc-500">
              Don't have an account?{' '}
              <button onClick={() => navigate('/signup')} className="text-brand-primary font-bold hover:underline">Sign Up</button>
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
            <button onClick={() => navigate('/signup')} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">
              <ChevronLeft size={16} /> Back
            </button>
            <div className="space-y-2">
              <h1 className="text-4xl font-black tracking-tighter uppercase italic">Verify</h1>
              <p className="text-zinc-500 text-sm">Enter the 4-digit code sent to your email.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="flex justify-between gap-4">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl text-center text-2xl font-black text-brand-primary focus:outline-none focus:border-brand-primary transition-colors"
                  />
                ))}
              </div>
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-brand-primary text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-brand-accent hover:text-black transition-all shadow-lg shadow-brand-primary/20 disabled:opacity-50"
              >
                {isLoading ? 'Verifying...' : 'Verify'}
              </button>
            </form>
            <p className="text-center text-xs text-zinc-500">
              Didn't receive the code?{' '}
              <button onClick={() => alert('Code resent!')} className="text-brand-primary font-bold hover:underline">Resend Code</button>
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
            <button onClick={() => navigate('/login')} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">
              <ChevronLeft size={16} /> Back
            </button>
            <div className="space-y-2">
              <h1 className="text-4xl font-black tracking-tighter uppercase italic leading-tight">Forgot Password?</h1>
              <p className="text-zinc-500 text-sm">Enter your email to receive a reset link.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  placeholder="alex@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white focus:outline-none focus:border-brand-primary/50 transition-colors"
                />
              </div>
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-brand-primary text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-brand-accent hover:text-black transition-all shadow-lg shadow-brand-primary/20 disabled:opacity-50"
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
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
              <p className="text-zinc-500 text-sm">Enter your new password below.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">New Password</label>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white focus:outline-none focus:border-brand-primary/50 transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Confirm Password</label>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white focus:outline-none focus:border-brand-primary/50 transition-colors"
                />
              </div>
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-brand-primary text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-brand-accent hover:text-black transition-all shadow-lg shadow-brand-primary/20 disabled:opacity-50"
              >
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0b21] text-white flex overflow-hidden font-sans">
      {/* Left Side: Form */}
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

      {/* Right Side: Character Image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#0f0b21] z-10" />
        <img 
          src="https://picsum.photos/seed/gamer-auth/1000/1500" 
          alt="Character" 
          className="w-full h-full object-cover opacity-60"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0b21] via-transparent to-transparent z-10" />
        
        {/* Decorative elements matching the image */}
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-brand-primary/20 blur-[120px] rounded-full -translate-y-1/2" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-brand-accent/10 blur-[100px] rounded-full" />
      </div>
    </div>
  );
}
