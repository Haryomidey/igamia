import React, { useEffect, useMemo, useState } from 'react';
import { MessageSquare, Search, Gift, X, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSocial, type SocialUser } from '../../../hooks/useSocial';
import { useWallet } from '../../../hooks/useWallet';
import { useToast } from '../../../components/ToastProvider';

export default function Social() {
  const [activeTab, setActiveTab] = useState<'discover' | 'requests'>('discover');
  const [selectedGamer, setSelectedGamer] = useState<SocialUser | null>(null);
  const [giftAmount, setGiftAmount] = useState('10');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const toast = useToast();

  const { discoverUsers, requests, loading, error, sendRequest, acceptRequest, fetchSocial } = useSocial(true);
  const { walletData, gift } = useWallet(true);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return discoverUsers;
    }

    return discoverUsers.filter((user) => {
      return [user.username, user.fullName, user.bio].join(' ').toLowerCase().includes(query);
    });
  }, [discoverUsers, search]);

  useEffect(() => {
    if (error) {
      toast.error(error, { title: 'Community Error' });
    }
  }, [error, toast]);

  const handleSendRequest = async (targetUserId: string) => {
    try {
      await sendRequest(targetUserId);
      toast.success('Connection request sent.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to send request.');
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await acceptRequest(requestId);
      toast.success('Connection request accepted.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to accept request.');
    }
  };

  const handleGift = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedGamer) {
      return;
    }

    try {
      setIsSubmitting(true);
      await gift({
        receiverUserId: selectedGamer.id,
        amount: Number(giftAmount),
        description: `Gift sent to ${selectedGamer.username}`,
      });
      toast.success(`Gift sent successfully to ${selectedGamer.username}.`);
      setSelectedGamer(null);
      setGiftAmount('10');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to send gift.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-12 pb-12">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white uppercase italic">Community</h1>
          <p className="mt-2 text-sm text-zinc-500">Discover users, accept requests, and send gifts through the live hooks.</p>
        </div>
        <button
          onClick={() => void fetchSocial()}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all"
        >
          <RefreshCcw size={14} />
          Refresh
        </button>
      </header>

      <div className="space-y-10">
        <div className="flex gap-10 border-b border-white/10">
          {[
            { id: 'discover', label: 'Discover' },
            { id: 'requests', label: `Requests (${requests.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'discover' | 'requests')}
              className={`pb-6 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${
                activeTab === tab.id ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && <motion.div layoutId="socialTab" className="absolute bottom-0 left-0 right-0 h-1 bg-[#f0b429] rounded-full" />}
            </button>
          ))}
        </div>

        {activeTab === 'requests' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {requests.length ? (
              requests.map((request) => {
                const fromUser = request.fromUserId;
                const username = fromUser?.username ?? 'Unknown';
                return (
                  <motion.div
                    key={request._id}
                    whileHover={{ y: -8 }}
                    className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 relative group hover:bg-white/10 transition-all shadow-xl"
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#1a1635] shadow-2xl mb-6">
                        <img src={fromUser?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`} alt={username} className="w-full h-full object-cover" />
                      </div>
                      <h4 className="text-lg font-black text-white uppercase italic mb-1">{fromUser?.fullName ?? username}</h4>
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-8">@{username}</p>
                      <div className="flex gap-3 w-full">
                        <button
                          onClick={() => void handleAcceptRequest(request._id)}
                          className="flex-1 bg-[#9d7cf0] text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-brand-accent hover:text-black transition-all shadow-xl shadow-[#9d7cf0]/20"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() =>
                            setSelectedGamer({
                              id: fromUser?._id ?? '',
                              username,
                              name: username,
                              fullName: fromUser?.fullName ?? username,
                              avatarUrl: fromUser?.avatarUrl ?? '',
                              bio: '',
                            })
                          }
                          className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-brand-accent hover:bg-brand-accent/10 transition-all"
                          disabled={!fromUser?._id}
                        >
                          <Gift size={20} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="col-span-full rounded-[2rem] border border-white/10 bg-white/5 px-8 py-12 text-center text-zinc-500">
                {loading ? 'Loading requests...' : 'No pending requests.'}
              </div>
            )}
          </div>
        )}

        {activeTab === 'discover' && (
          <div className="grid lg:grid-cols-12 gap-12 min-h-[600px]">
            <div className="lg:col-span-4 space-y-8">
              <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-brand-primary transition-colors" size={18} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search people"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-white text-sm focus:outline-none focus:border-brand-primary/50 transition-all"
                />
              </div>
              <div className="space-y-4">
                {filteredUsers.map((gamer) => (
                  <div
                    key={gamer.id}
                    onClick={() => setSelectedGamer(gamer)}
                    className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all cursor-pointer relative group"
                  >
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/10">
                        <img src={gamer.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${gamer.username}`} alt={gamer.username} className="w-full h-full object-cover" />
                      </div>
                      <div className="absolute top-0 right-0 w-3 h-3 bg-[#f0b429] rounded-full border-2 border-[#1a1635]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-black text-white uppercase italic truncate">{gamer.fullName || gamer.username}</h4>
                      </div>
                      <p className="text-[10px] text-zinc-500 truncate font-bold uppercase tracking-widest">@{gamer.username}</p>
                    </div>
                  </div>
                ))}

                {!filteredUsers.length && (
                  <div className="rounded-[2rem] border border-white/10 bg-white/5 px-6 py-10 text-center text-zinc-500">
                    No users matched your search.
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-8 flex flex-col items-center justify-center bg-white/5 rounded-[3rem] border border-white/10 p-12 text-center">
              <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-8 relative">
                <div className="absolute inset-0 bg-[#9d7cf0]/20 blur-2xl rounded-full" />
                <MessageSquare size={40} className="text-[#9d7cf0] relative z-10" />
              </div>
              {selectedGamer ? (
                <>
                  <p className="text-white font-black uppercase tracking-widest mb-4">{selectedGamer.fullName || selectedGamer.username}</p>
                  <p className="text-zinc-400 max-w-md mb-8">{selectedGamer.bio || 'This player is ready to connect on iGamia.'}</p>
                  <div className="flex flex-wrap items-center justify-center gap-4">
                    <button
                      onClick={() => void handleSendRequest(selectedGamer.id)}
                      className="bg-[#9d7cf0] text-white px-12 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-brand-accent hover:text-black transition-all shadow-xl shadow-[#9d7cf0]/20"
                    >
                      Send Request
                    </button>
                    <button
                      onClick={() => setSelectedGamer(selectedGamer)}
                      className="bg-white/5 border border-white/10 text-white px-12 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white/10 transition-all"
                    >
                      Send Gift
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-zinc-400 font-black uppercase tracking-widest mb-8">Select a player to connect or gift</p>
                  <p className="text-sm text-zinc-500">Wallet balance: ${walletData?.wallet.usdBalance.toFixed(2) ?? '0.00'}</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedGamer && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0f0b21]/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-[#1a1635] border border-white/10 rounded-[3rem] p-10 relative shadow-2xl"
            >
              <button onClick={() => setSelectedGamer(null)} className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
              <div className="flex flex-col items-center text-center mb-10">
                <div className="w-24 h-24 rounded-[1.5rem] overflow-hidden bg-white/5 border border-white/10 mb-6 p-2">
                  <img src={selectedGamer.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedGamer.username}`} alt={selectedGamer.username} className="w-full h-full object-cover rounded-[1rem]" />
                </div>
                <h3 className="text-2xl font-black text-white uppercase italic">Gift {selectedGamer.fullName || selectedGamer.username}</h3>
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-2">Wallet-backed transfer to this player.</p>
              </div>
              <form onSubmit={handleGift} className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-1">Gift Amount (USD)</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-primary font-black">$</span>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      value={giftAmount}
                      onChange={(e) => setGiftAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 pl-12 pr-6 text-white font-black focus:outline-none focus:border-brand-primary/50 transition-all"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-brand-primary text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-brand-accent hover:text-black transition-all disabled:opacity-50 shadow-lg shadow-brand-primary/20"
                >
                  {isSubmitting ? 'Sending...' : 'Send Gift'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
