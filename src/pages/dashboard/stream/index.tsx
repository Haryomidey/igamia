import React, { useState } from 'react';
import { ChevronLeft, Users, Heart, Share2, MessageSquare, Send, Maximize2, Volume2, Settings, Play, Gift, Shield, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export default function LiveStream() {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([
    { id: 1, user: 'GamerX', text: 'This stream is fire! 🔥', color: '#9d7cf0' },
    { id: 2, user: 'Pro_Sarah', text: 'Can you show your loadout?', color: '#f0b429' },
    { id: 3, user: 'Shadow_Ninja', text: 'Donated 500 IGC! 🚀', color: '#10b981' },
    { id: 4, user: 'Cyber_Punk', text: 'LFG!!! 🚀🚀🚀', color: '#3b82f6' },
  ]);

  const [isGifting, setIsGifting] = useState(false);
  const [giftAmount, setGiftAmount] = useState('');
  const [isProcessingGift, setIsProcessingGift] = useState(false);
  const [user, setUser] = useState({ balance: 500 });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setChat([...chat, { id: Date.now(), user: 'You', text: message, color: '#ec4899' }]);
    setMessage('');
  };

  const handleGift = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessingGift(true);
    setTimeout(() => {
      const amount = parseFloat(giftAmount);
      if (user.balance >= amount) {
        setUser(prev => ({ ...prev, balance: prev.balance - amount }));
        setChat([...chat, { id: Date.now(), user: 'You', text: `Sent a gift of $${amount}! 🎁`, color: '#f0b429' }]);
        setIsGifting(false);
        setGiftAmount('');
        alert(`Gift of $${amount} sent to EliteQueen_Gaming! Platform took 10% fee.`);
      } else {
        alert('Insufficient balance');
      }
      setIsProcessingGift(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-[#0a0817] z-50 flex flex-col lg:flex-row overflow-hidden">
      <div className="flex-1 flex flex-col">
        <div className="flex-1 relative group bg-black">
          <div className="absolute inset-0">
            <img
              src="https://picsum.photos/seed/stream/1920/1080"
              alt="Live Stream"
              className="w-full h-full object-cover opacity-90"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-black/40" />
          </div>

          <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-10">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center text-white hover:bg-white/20 transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-red-600 px-3 py-1 rounded-lg">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-white text-[10px] font-black uppercase tracking-widest">Live</span>
              </div>
              <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10">
                <span className="text-white text-[10px] font-black uppercase tracking-widest">01:24:45</span>
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-6 flex items-center justify-between z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-4">
              <button className="text-white/80 hover:text-white transition-colors"><Play size={24} fill="currentColor" /></button>
              <div className="flex items-center gap-2">
                <Volume2 size={20} className="text-white/80" />
                <div className="w-24 h-1 bg-white/20 rounded-full overflow-hidden">
                  <div className="w-2/3 h-full bg-brand-primary" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="text-white/80 hover:text-white transition-colors"><Settings size={20} /></button>
              <button className="text-white/80 hover:text-white transition-colors"><Maximize2 size={20} /></button>
            </div>
          </div>
        </div>

        <div className="bg-brand-deep p-6 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-brand-primary p-1">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=EliteQueen" alt="Streamer" className="w-full h-full object-cover rounded-xl" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-brand-primary rounded-full border-2 border-brand-deep flex items-center justify-center">
                <Shield size={10} className="text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase italic mb-1">EliteQueen_Gaming</h2>
              <div className="flex items-center gap-4">
                <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">Valorant Ranked • Immortal Grind</p>
                <div className="flex items-center gap-2 text-brand-primary">
                  <Users size={14} />
                  <span className="text-[10px] font-black">8,420 Watching</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsGifting(true)}
              className="bg-white/5 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all border border-white/10 flex items-center gap-2"
            >
              <Gift size={16} className="text-brand-accent" /> Send Gift
            </button>
            <button className="bg-brand-primary text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-accent hover:text-black transition-all shadow-lg shadow-brand-primary/20">
              Follow
            </button>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-100 bg-[#0f0b21] border-l border-white/10 flex flex-col">
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/20">
          <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] italic">Live Chat</h3>
          <div className="flex gap-4">
            <button className="text-zinc-500 hover:text-white transition-colors"><Share2 size={18} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          <div className="bg-brand-primary/10 border border-brand-primary/20 p-4 rounded-xl mb-4">
            <p className="text-[10px] text-brand-primary font-black uppercase tracking-widest mb-1">Welcome to the chat!</p>
            <p className="text-[10px] text-zinc-400 font-medium">Remember to be kind and follow the community guidelines.</p>
          </div>
          {chat.map((msg) => (
            <div key={msg.id} className="flex gap-3 group">
              <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-white/10">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.user}`} alt={msg.user} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-widest truncate" style={{ color: msg.color }}>{msg.user}</span>
                  {(msg.text.includes('Donated') || msg.text.includes('gift')) && (
                    <span className="bg-brand-accent/20 text-brand-accent text-[8px] px-1.5 py-0.5 rounded font-black uppercase">Supporter</span>
                  )}
                </div>
                <p className="text-zinc-300 text-xs leading-relaxed wrap-break-word">{msg.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-white/10 bg-black/40">
          <form onSubmit={handleSendMessage} className="relative">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Send a message..."
              className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-6 pr-14 text-white text-xs focus:outline-none focus:border-brand-primary/50 transition-all"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-brand-primary text-white rounded-lg flex items-center justify-center hover:bg-brand-accent hover:text-black transition-all"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>

      <AnimatePresence>
        {isGifting && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-6 bg-[#0f0b21]/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-brand-deep border border-white/10 rounded-[3rem] p-10 relative shadow-2xl"
            >
              <button
                onClick={() => setIsGifting(false)}
                className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
              <div className="flex flex-col items-center text-center mb-10">
                <div className="w-24 h-24 rounded-3xl overflow-hidden bg-white/5 border border-white/10 mb-6 p-2">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=EliteQueen" alt="EliteQueen" className="w-full h-full object-cover rounded-2xl" />
                </div>
                <h3 className="text-2xl font-black text-white uppercase italic">Gift EliteQueen</h3>
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-2">Support your favorite streamer with a gift.</p>
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
                  disabled={isProcessingGift}
                  className="w-full bg-brand-primary text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-brand-accent hover:text-black transition-all disabled:opacity-50 shadow-lg shadow-brand-primary/20"
                >
                  {isProcessingGift ? 'Sending...' : 'Send Gift'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
