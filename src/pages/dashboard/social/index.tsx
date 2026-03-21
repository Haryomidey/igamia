import React, { useState, useEffect } from 'react';
import { Users, UserPlus, MessageSquare, Search, MoreHorizontal, Check, UserCheck, Gift, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

const GAMERS = [
  { id: 1, name: 'ProGamer99', level: 45, followers: 12400, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ProGamer99', connected: false },
  { id: 2, name: 'EliteQueen', level: 38, followers: 8200, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=EliteQueen', connected: true },
  { id: 3, name: 'ShadowNinja', level: 52, followers: 24100, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ShadowNinja', connected: false },
  { id: 4, name: 'CyberPunk', level: 29, followers: 4500, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CyberPunk', connected: true },
  { id: 5, name: 'PixelMaster', level: 41, followers: 15700, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PixelMaster', connected: false },
];

export default function Social() {
  const [activeTab, setActiveTab] = useState('discover');
  const [selectedGamer, setSelectedGamer] = useState<any>(null);
  const [giftAmount, setGiftAmount] = useState('');
  const [isGifting, setIsGifting] = useState(false);
  const [user, setUser] = useState<any>({ balance: 500 });

  useEffect(() => {
    // No backend, just use mock data
  }, []);

  const handleGift = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGifting(true);
    
    // Simulate gifting
    setTimeout(() => {
      const amount = parseFloat(giftAmount);
      if (user.balance >= amount) {
        setUser((prev: any) => ({ ...prev, balance: prev.balance - amount }));
        setSelectedGamer(null);
        setGiftAmount('');
        alert('Gift sent successfully! Platform took 10% fee.');
      } else {
        alert('Insufficient balance');
      }
      setIsGifting(false);
    }, 1000);
  };

  return (
    <div className="space-y-12 pb-12">
      <header>
        <h1 className="text-3xl font-black text-white uppercase italic">Community</h1>
      </header>

      <div className="space-y-10">
        <div className="flex gap-10 border-b border-white/10">
          {[
            { id: 'chat', label: 'Chat' },
            { id: 'requests', label: 'Requests' },
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id === 'chat' ? 'discover' : 'requests')}
              className={`pb-6 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${
                (tab.id === 'chat' && activeTab === 'discover') || (tab.id === 'requests' && activeTab === 'requests')
                  ? 'text-white' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab.label}
              {((tab.id === 'chat' && activeTab === 'discover') || (tab.id === 'requests' && activeTab === 'requests')) && (
                <motion.div 
                  layoutId="socialTab"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-[#f0b429] rounded-full"
                />
              )}
            </button>
          ))}
        </div>

        {activeTab === 'requests' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {GAMERS.map((gamer) => (
              <motion.div 
                key={gamer.id}
                whileHover={{ y: -8 }}
                className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 relative group hover:bg-white/10 transition-all shadow-xl"
              >
                <button className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors">
                  <X size={18} />
                </button>
                <div className="flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#1a1635] shadow-2xl mb-6">
                    <img src={gamer.avatar} alt={gamer.name} className="w-full h-full object-cover" />
                  </div>
                  <h4 className="text-lg font-black text-white uppercase italic mb-1">{gamer.name}</h4>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-8">@{gamer.name.toLowerCase()}</p>
                  <div className="flex gap-3 w-full">
                    <button 
                      onClick={() => alert(`Connection request from ${gamer.name} accepted!`)}
                      className="flex-1 bg-[#9d7cf0] text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-brand-accent hover:text-black transition-all shadow-xl shadow-[#9d7cf0]/20"
                    >
                      Accept
                    </button>
                    <button 
                      onClick={() => setSelectedGamer(gamer)}
                      className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-brand-accent hover:bg-brand-accent/10 transition-all"
                    >
                      <Gift size={20} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === 'discover' && (
          <div className="grid lg:grid-cols-12 gap-12 min-h-[600px]">
            {/* Conversations List */}
            <div className="lg:col-span-4 space-y-8">
              <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-brand-primary transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder="Search"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-white text-sm focus:outline-none focus:border-brand-primary/50 transition-all"
                />
              </div>
              <div className="space-y-4">
                {GAMERS.slice(0, 4).map((gamer) => (
                  <div 
                    key={gamer.id} 
                    onClick={() => setSelectedGamer(gamer)}
                    className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all cursor-pointer relative group"
                  >
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/10">
                        <img src={gamer.avatar} alt={gamer.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="absolute top-0 right-0 w-3 h-3 bg-[#f0b429] rounded-full border-2 border-[#1a1635]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-black text-white uppercase italic truncate">{gamer.name}</h4>
                        <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">12/03/25</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 truncate font-bold uppercase tracking-widest">Hi, John! Is the correct way to display 1,200...</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Area Placeholder */}
            <div className="lg:col-span-8 flex flex-col items-center justify-center bg-white/5 rounded-[3rem] border border-white/10 p-12 text-center">
              <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-8 relative">
                <div className="absolute inset-0 bg-[#9d7cf0]/20 blur-2xl rounded-full" />
                <MessageSquare size={40} className="text-[#9d7cf0] relative z-10" />
              </div>
              <p className="text-zinc-400 font-black uppercase tracking-widest mb-8">Start a conversation with your connections</p>
              <button className="bg-[#9d7cf0] text-white px-12 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-brand-accent hover:text-black transition-all shadow-xl shadow-[#9d7cf0]/20">
                Start a conversation
              </button>
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
              <button 
                onClick={() => setSelectedGamer(null)}
                className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
              <div className="flex flex-col items-center text-center mb-10">
                <div className="w-24 h-24 rounded-[1.5rem] overflow-hidden bg-white/5 border border-white/10 mb-6 p-2">
                  <img src={selectedGamer.avatar} alt={selectedGamer.name} className="w-full h-full object-cover rounded-[1rem]" />
                </div>
                <h3 className="text-2xl font-black text-white uppercase italic">Gift {selectedGamer.name}</h3>
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-2">Support your favorite player with a gift.</p>
              </div>
              <form onSubmit={handleGift} className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-1">Gift Amount (USD)</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-primary font-black">$</span>
                    <input 
                      type="number" 
                      value={giftAmount}
                      onChange={(e) => setGiftAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 pl-12 pr-6 text-white font-black focus:outline-none focus:border-brand-primary/50 transition-all"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest ml-1">Platform Fee: 10%</p>
                </div>
                <button 
                  type="submit"
                  disabled={isGifting}
                  className="w-full bg-brand-primary text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-brand-accent hover:text-black transition-all disabled:opacity-50 shadow-lg shadow-brand-primary/20"
                >
                  {isGifting ? 'Sending...' : 'Send Gift'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
