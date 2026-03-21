import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet as WalletIcon, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  CreditCard, 
  ShieldCheck, 
  X, 
  ChevronRight, 
  Coins, 
  DollarSign 
} from 'lucide-react';

import { Link } from 'react-router-dom';

export default function Wallet() {
  const [user, setUser] = useState<any>({ usd_balance: 500, igc_balance: 1250 });
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([
    { type: 'mining', description: 'Daily Mining Session', amount: 50, currency: 'IGC', created_at: new Date().toISOString() },
    { type: 'gift_received', description: 'Gift from EliteQueen', amount: 15, currency: 'USD', created_at: new Date().toISOString() },
    { type: 'winning', description: 'Cyber Strike Pledge Win', amount: 45, currency: 'USD', created_at: new Date().toISOString() },
    { type: 'pledge', description: 'Neon Racer Entry', amount: 10, currency: 'USD', created_at: new Date().toISOString() },
  ]);

  useEffect(() => {
    // No backend, just use mock data
  }, []);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate withdrawal
    setTimeout(() => {
      const amount = parseFloat(withdrawAmount);
      if (user.usd_balance >= amount) {
        setUser((prev: any) => ({ ...prev, usd_balance: prev.usd_balance - amount }));
        setTransactions((prev) => [
          { type: 'withdrawal', description: 'USD Withdrawal', amount: amount, currency: 'USD', created_at: new Date().toISOString() },
          ...prev
        ]);
        setIsWithdrawOpen(false);
        setWithdrawAmount('');
        alert('Withdrawal request submitted!');
      } else {
        alert('Insufficient balance');
      }
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="space-y-12 pb-12">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-white uppercase italic">Wallet</h1>
        <Link to="/token" className="bg-white/5 border border-white/10 text-white px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
          Learn About iGamia Coins
        </Link>
      </header>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Available Funds Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#9d7cf0] to-[#6b46c1] p-10 rounded-[2.5rem] shadow-2xl group">
          <div className="relative z-10 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <WalletIcon className="text-white" size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-white/80 uppercase tracking-widest">Available Funds</p>
                  <p className="text-[8px] font-bold text-white/60 uppercase tracking-widest">Withdrawable USD balance</p>
                </div>
              </div>
              <span className="bg-white/20 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Withdrawable</span>
            </div>
            
            <p className="text-6xl font-black text-white italic">${user?.usd_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            
            <div className="flex gap-4">
              <button 
                onClick={() => alert('Deposit feature coming soon!')}
                className="flex-1 bg-white/20 backdrop-blur-md border border-white/30 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white/30 transition-all"
              >
                Deposit
              </button>
              <button 
                onClick={() => setIsWithdrawOpen(true)}
                className="flex-1 bg-white/20 backdrop-blur-md border border-white/30 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white/30 transition-all"
              >
                Withdraw
              </button>
            </div>
          </div>
          {/* Abstract background shapes */}
          <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-white/10 rotate-45 rounded-[3rem]" />
        </div>

        {/* iGamia Coins Card */}
        <div className="relative overflow-hidden bg-[#fdf2d7] p-10 rounded-[2.5rem] shadow-2xl group">
          <div className="relative z-10 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#f0b429]/20 rounded-xl flex items-center justify-center">
                  <Coins className="text-[#f0b429]" size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-[#856404] uppercase tracking-widest">iGamia Coins Balance</p>
                  <p className="text-[8px] font-bold text-[#856404]/60 uppercase tracking-widest">Earned through mining and gaming</p>
                </div>
              </div>
              <span className="bg-[#f0b429]/20 text-[#856404] text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Non-Withdrawable</span>
            </div>
            
            <p className="text-6xl font-black text-[#1a1635] italic">{user?.igc_balance.toLocaleString()}</p>
            
            <div className="flex">
              <button 
                onClick={() => alert('Move Coins feature coming soon!')}
                className="bg-[#f0b429] text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-[#d39e00] transition-all shadow-lg shadow-[#f0b429]/20"
              >
                Move Coins
              </button>
            </div>
          </div>
          {/* Abstract background shapes */}
          <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-[#f0b429]/10 rotate-45 rounded-[3rem]" />
        </div>
      </div>

      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black uppercase italic text-white">Transaction History</h3>
          <button className="flex items-center gap-2 text-[10px] font-black text-brand-primary uppercase tracking-widest hover:text-brand-accent transition-colors">
            See All <ChevronRight size={14} />
          </button>
        </div>

        <div className="space-y-12">
          {/* Today Group */}
          <div className="space-y-6">
            <div className="inline-block bg-[#f0b429] px-6 py-2 rounded-tr-2xl rounded-bl-2xl">
              <span className="text-[10px] font-black text-white uppercase tracking-widest">Today</span>
            </div>
            <div className="space-y-4">
              {transactions.slice(0, 4).map((tx, i) => (
                <div key={i} className="flex items-center justify-between p-6 bg-white/5 rounded-[2rem] border border-white/5 hover:bg-white/10 transition-all group">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center border border-white/10">
                      <div className="w-8 h-8 bg-brand-primary/20 rounded-full flex items-center justify-center">
                        <DollarSign size={16} className="text-brand-primary" />
                      </div>
                    </div>
                    <div>
                      <p className="font-black text-white uppercase text-xs tracking-widest mb-1">{tx.description}</p>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">12:55 PM April 23, 2025</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-white italic">
                      {['mining', 'gift_received', 'winning'].includes(tx.type) ? '+' : '-'}${tx.amount.toFixed(2)}
                    </p>
                    <p className="text-[8px] text-emerald-500 uppercase tracking-widest font-black">Successful</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 24th April Group */}
          <div className="space-y-6">
            <div className="inline-block bg-[#f0b429] px-6 py-2 rounded-tr-2xl rounded-bl-2xl">
              <span className="text-[10px] font-black text-white uppercase tracking-widest">24th April, 2025</span>
            </div>
            <div className="space-y-4">
              {transactions.slice(0, 4).map((tx, i) => (
                <div key={i} className="flex items-center justify-between p-6 bg-white/5 rounded-[2rem] border border-white/5 hover:bg-white/10 transition-all group">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center border border-white/10">
                      <div className="w-8 h-8 bg-brand-primary/20 rounded-full flex items-center justify-center">
                        <DollarSign size={16} className="text-brand-primary" />
                      </div>
                    </div>
                    <div>
                      <p className="font-black text-white uppercase text-xs tracking-widest mb-1">{tx.description}</p>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">12:55 PM April 23, 2025</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-white italic">
                      {['mining', 'gift_received', 'winning'].includes(tx.type) ? '+' : '-'}${tx.amount.toFixed(2)}
                    </p>
                    <p className="text-[8px] text-emerald-500 uppercase tracking-widest font-black">Successful</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isWithdrawOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0f0b21]/90 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-[#1a1635] border border-white/10 rounded-[3rem] p-10 relative shadow-2xl"
            >
              <button 
                onClick={() => setIsWithdrawOpen(false)}
                className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
              <h3 className="text-3xl font-black text-white uppercase italic mb-8">Withdraw Funds</h3>
              <form onSubmit={handleWithdraw} className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-1">Amount (USD)</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-primary font-black">$</span>
                    <input 
                      type="number" 
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 pl-12 pr-6 text-white font-black focus:outline-none focus:border-brand-primary/50 transition-all"
                      required
                    />
                  </div>
                </div>
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-brand-primary text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-brand-accent hover:text-black transition-all disabled:opacity-50 shadow-lg shadow-brand-primary/20"
                >
                  {isLoading ? 'Processing...' : 'Confirm Withdrawal'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
