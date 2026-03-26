import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Wallet as WalletIcon,
  ChevronRight,
  Coins,
  DollarSign,
  X,
  RefreshCcw,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useWallet, type WalletSnapshot } from '../../../hooks/useWallet';
import { useToast } from '../../../components/ToastProvider';
import { useAuth } from '../../../hooks/useAuth';

const inflowTypes = new Set([
  'mining_reward',
  'gift_received',
  'referral_reward',
  'winning',
  'deposit',
  'igc_purchase_credit',
  'igc_conversion_credit',
]);

function formatCurrency(amount: number, currency: 'USD' | 'NGN' | 'IGC') {
  if (currency === 'USD' || currency === 'NGN') {
    return `${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  return `${amount.toLocaleString()} IGC`;
}

export default function Wallet() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { walletData, loading, error, withdraw, fetchWallet, initializePayment, verifyPayment, convertIgc, buyIgc } = useWallet(true);
  const toast = useToast();
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isBuyIgcOpen, setIsBuyIgcOpen] = useState(false);
  const [isConvertIgcOpen, setIsConvertIgcOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [buyIgcAmount, setBuyIgcAmount] = useState('');
  const [convertIgcAmount, setConvertIgcAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifyingDeposit, setIsVerifyingDeposit] = useState(false);

  const groupedTransactions = useMemo(() => {
    const transactions = walletData?.transactions ?? [];

    return transactions.reduce<Record<string, typeof transactions>>((groups, tx) => {
      const dateKey = tx.createdAt
        ? new Date(tx.createdAt).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })
        : 'Recent';

      groups[dateKey] ??= [];
      groups[dateKey].push(tx);
      return groups;
    }, {});
  }, [walletData]);

  const transactionGroups = Object.entries(groupedTransactions) as Array<
    [string, NonNullable<WalletSnapshot['transactions']>]
  >;

  useEffect(() => {
    if (error) {
      toast.error(error, { title: 'Wallet Error' });
    }
  }, [error, toast]);

  useEffect(() => {
    const reference = searchParams.get('reference') ?? searchParams.get('trxref');
    if (!reference || isVerifyingDeposit) {
      return;
    }

    let cancelled = false;

    const finalizeDeposit = async () => {
      try {
        setIsVerifyingDeposit(true);
        const result = await verifyPayment(reference);
        if (cancelled) {
          return;
        }

        if (result?.payment?.status === 'successful') {
          toast.success('Deposit completed successfully.');
        } else {
          toast.warning(result?.paystack?.message ?? 'Deposit verification is still pending.');
        }
      } catch (err: any) {
        if (!cancelled) {
          toast.error(err?.response?.data?.message ?? 'Unable to verify deposit.');
        }
      } finally {
        if (!cancelled) {
          setIsVerifyingDeposit(false);
          const nextParams = new URLSearchParams(searchParams);
          nextParams.delete('reference');
          nextParams.delete('trxref');
          setSearchParams(nextParams, { replace: true });
        }
      }
    };

    void finalizeDeposit();

    return () => {
      cancelled = true;
    };
  }, [searchParams, setSearchParams, toast, verifyPayment, isVerifyingDeposit]);

  const handleDeposit = async (event: React.FormEvent) => {
    event.preventDefault();

    const amount = Number(depositAmount);
    if (!amount || amount <= 0) {
      toast.warning('Enter a valid deposit amount.');
      return;
    }

    if (!user?.email) {
      toast.error('Your account email is required to initialize this payment.');
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await initializePayment({
        amount,
        email: user.email,
        purpose: 'wallet deposit',
      });

      const authorizationUrl = result?.paystack?.data?.authorization_url;
      if (!authorizationUrl) {
        toast.error(result?.paystack?.message ?? 'Unable to initialize Paystack payment.');
        return;
      }

      window.location.href = authorizationUrl;
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to start deposit.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdraw = async (event: React.FormEvent) => {
    event.preventDefault();

    const amount = Number(withdrawAmount);
    if (!amount || amount <= 0) {
      toast.warning('Enter a valid withdrawal amount.');
      return;
    }

    try {
      setIsSubmitting(true);
      await withdraw(amount);
      setIsWithdrawOpen(false);
      setWithdrawAmount('');
      toast.success('Withdrawal request submitted successfully.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to process withdrawal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBuyIgc = async (event: React.FormEvent) => {
    event.preventDefault();

    const amount = Number(buyIgcAmount);
    if (!amount || amount <= 0) {
      toast.warning('Enter a valid NGN amount.');
      return;
    }

    try {
      setIsSubmitting(true);
      await buyIgc(amount);
      setIsBuyIgcOpen(false);
      setBuyIgcAmount('');
      toast.success('IGC purchased from your NGN wallet.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to buy IGC.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConvertIgc = async (event: React.FormEvent) => {
    event.preventDefault();

    const amount = Number(convertIgcAmount);
    if (!amount || amount <= 0) {
      toast.warning('Enter a valid IGC amount.');
      return;
    }

    try {
      setIsSubmitting(true);
      await convertIgc(amount);
      setIsConvertIgcOpen(false);
      setConvertIgcAmount('');
      toast.success('IGC converted to NGN successfully.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to convert IGC.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-12 pb-12">
      <header className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-white uppercase italic">Wallet</h1>
          <p className="text-sm text-zinc-500">Your balances and recent transaction activity are now synced with the backend.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => void fetchWallet()}
            className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-white px-4 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
          >
            <RefreshCcw size={14} />
            Refresh
          </button>
          <Link to="/token" className="bg-white/5 border border-white/10 text-white px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
            Learn About iGamia Coins
          </Link>
        </div>
      </header>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#9d7cf0] to-[#6b46c1] p-10 rounded-[2.5rem] shadow-2xl group">
          <div className="relative z-10 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <WalletIcon className="text-white" size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-white/80 uppercase tracking-widest">Available Funds</p>
                  <p className="text-[8px] font-bold text-white/60 uppercase tracking-widest">Withdrawable NGN balance</p>
                </div>
              </div>
              <span className="bg-white/20 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Withdrawable</span>
            </div>

            <p className="text-6xl font-black text-white italic">
              {loading && !walletData ? '...' : formatCurrency(walletData?.summary.fiatBalance ?? walletData?.wallet.usdBalance ?? 0, 'NGN')}
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => setIsDepositOpen(true)}
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
          <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-white/10 rotate-45 rounded-[3rem]" />
        </div>

        <div className="relative overflow-hidden bg-[#fdf2d7] p-10 rounded-[2.5rem] shadow-2xl group">
          <div className="relative z-10 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#f0b429]/20 rounded-xl flex items-center justify-center">
                  <Coins className="text-[#f0b429]" size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-[#856404] uppercase tracking-widest">iGamia Coins Balance</p>
                  <p className="text-[8px] font-bold text-[#856404]/60 uppercase tracking-widest">Use IGC for gifts or convert it to NGN</p>
                </div>
              </div>
              <span className="bg-[#f0b429]/20 text-[#856404] text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                1 IGC = NGN {(walletData?.summary.igcToNgnRate ?? 10).toLocaleString()}
              </span>
            </div>

            <p className="text-6xl font-black text-[#1a1635] italic">
              {loading && !walletData ? '...' : (walletData?.wallet.igcBalance ?? 0).toLocaleString()}
            </p>

            <p className="text-sm font-bold text-[#856404]/80">
              Estimated value: {formatCurrency(walletData?.summary.igcEstimatedValueNgn ?? 0, 'NGN')}
            </p>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setIsBuyIgcOpen(true)}
                className="bg-[#f0b429] text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-[#d39e00] transition-all shadow-lg shadow-[#f0b429]/20"
              >
                Buy IGC
              </button>
              <button
                onClick={() => setIsConvertIgcOpen(true)}
                className="bg-[#1a1635] text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-black transition-all"
              >
                Convert to NGN
              </button>
            </div>
          </div>
          <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-[#f0b429]/10 rotate-45 rounded-[3rem]" />
        </div>
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-white/5 px-6 py-5 text-sm text-zinc-400">
        Portfolio value: <span className="font-black text-white">{formatCurrency(walletData?.summary.totalPortfolioNgn ?? 0, 'NGN')}</span> •
        Gift fee: <span className="font-black text-white"> {Math.round((walletData?.summary.platformFeeRate ?? 0.1) * 100)}%</span>
      </div>

      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black uppercase italic text-white">Transaction History</h3>
          <button
            onClick={() => void fetchWallet()}
            className="flex items-center gap-2 text-[10px] font-black text-brand-primary uppercase tracking-widest hover:text-brand-accent transition-colors"
          >
            Reload <ChevronRight size={14} />
          </button>
        </div>

        {Object.keys(groupedTransactions).length === 0 ? (
          <div className="rounded-[2rem] border border-white/10 bg-white/5 px-8 py-12 text-center text-zinc-500">
            No transactions yet.
          </div>
        ) : (
          <div className="space-y-12">
            {transactionGroups.map(([dateKey, transactions]) => (
              <div key={dateKey} className="space-y-6">
                <div className="inline-block bg-[#f0b429] px-6 py-2 rounded-tr-2xl rounded-bl-2xl">
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">{dateKey}</span>
                </div>
                <div className="space-y-4">
                  {transactions.map((tx) => {
                    const isInflow = inflowTypes.has(tx.type);
                    return (
                      <div key={tx._id} className="flex items-center justify-between gap-6 p-6 bg-white/5 rounded-[2rem] border border-white/5 hover:bg-white/10 transition-all group">
                        <div className="flex items-center gap-6 min-w-0">
                          <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center border border-white/10">
                            <div className="w-8 h-8 bg-brand-primary/20 rounded-full flex items-center justify-center">
                              <DollarSign size={16} className="text-brand-primary" />
                            </div>
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-white uppercase text-xs tracking-widest mb-1 truncate">{tx.description}</p>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                              {tx.createdAt
                                ? new Date(tx.createdAt).toLocaleString('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })
                                : 'Recently'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-lg font-black text-white italic">
                            {isInflow ? '+' : '-'}
                            {formatCurrency(tx.amount, tx.currency)}
                          </p>
                          <p className="text-[8px] uppercase tracking-widest font-black text-emerald-500">{tx.status}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isBuyIgcOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0f0b21]/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-[#1a1635] border border-white/10 rounded-[3rem] p-10 relative shadow-2xl"
            >
              <button onClick={() => setIsBuyIgcOpen(false)} className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
              <h3 className="text-3xl font-black text-white uppercase italic mb-3">Buy IGC</h3>
              <p className="mb-8 text-sm text-zinc-500">
                Use your NGN wallet balance to buy IGC at 1 IGC = NGN {(walletData?.summary.igcToNgnRate ?? 10).toLocaleString()}.
              </p>
              <form onSubmit={handleBuyIgc} className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-1">Amount (NGN)</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-primary font-black">NGN</span>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      value={buyIgcAmount}
                      onChange={(e) => setBuyIgcAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 pl-16 pr-6 text-white font-black focus:outline-none focus:border-brand-primary/50 transition-all"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-brand-primary text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-brand-accent hover:text-black transition-all disabled:opacity-50 shadow-lg shadow-brand-primary/20"
                >
                  {isSubmitting ? 'Processing...' : 'Buy IGC'}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {isConvertIgcOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0f0b21]/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-[#1a1635] border border-white/10 rounded-[3rem] p-10 relative shadow-2xl"
            >
              <button onClick={() => setIsConvertIgcOpen(false)} className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
              <h3 className="text-3xl font-black text-white uppercase italic mb-3">Convert IGC</h3>
              <p className="mb-8 text-sm text-zinc-500">
                Convert IGC into withdrawable NGN at the current default rate.
              </p>
              <form onSubmit={handleConvertIgc} className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-1">Amount (IGC)</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-primary font-black">IGC</span>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      value={convertIgcAmount}
                      onChange={(e) => setConvertIgcAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 pl-16 pr-6 text-white font-black focus:outline-none focus:border-brand-primary/50 transition-all"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-brand-primary text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-brand-accent hover:text-black transition-all disabled:opacity-50 shadow-lg shadow-brand-primary/20"
                >
                  {isSubmitting ? 'Processing...' : 'Convert to NGN'}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {isDepositOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0f0b21]/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-[#1a1635] border border-white/10 rounded-[3rem] p-10 relative shadow-2xl"
            >
              <button
                onClick={() => setIsDepositOpen(false)}
                className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
              <h3 className="text-3xl font-black text-white uppercase italic mb-3">Deposit Funds</h3>
              <p className="mb-8 text-sm text-zinc-500">
                Continue to Paystack to fund your wallet. Your NGN wallet will be credited after successful verification.
              </p>
              <form onSubmit={handleDeposit} className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-1">Amount</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-primary font-black">NGN</span>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 pl-16 pr-6 text-white font-black focus:outline-none focus:border-brand-primary/50 transition-all"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-brand-primary text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-brand-accent hover:text-black transition-all disabled:opacity-50 shadow-lg shadow-brand-primary/20"
                >
                  {isSubmitting ? 'Redirecting...' : 'Continue To Paystack'}
                </button>
              </form>
            </motion.div>
          </div>
        )}

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
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-1">Amount (NGN)</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-primary font-black">NGN</span>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 pl-16 pr-6 text-white font-black focus:outline-none focus:border-brand-primary/50 transition-all"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-brand-primary text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-brand-accent hover:text-black transition-all disabled:opacity-50 shadow-lg shadow-brand-primary/20"
                >
                  {isSubmitting ? 'Processing...' : 'Confirm Withdrawal'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
