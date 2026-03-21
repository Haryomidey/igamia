import React, { useState } from 'react';
import { ChevronLeft, Users, Heart, Share2, MessageSquare, Send, Maximize2, Volume2, Settings, Play, Gift, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export default function GamePlay() {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([
    { id: 1, user: 'Alex_Pro', text: 'That headshot was insane! 🔥', color: '#9d7cf0' },
    { id: 2, user: 'Sarah_Gamer', text: 'How do you get that weapon?', color: '#f0b429' },
    { id: 3, user: 'Ninja_X', text: 'Go left! There is a secret chest.', color: '#10b981' },
    { id: 4, user: 'Cyber_King', text: 'LFG!!! 🚀🚀🚀', color: '#3b82f6' },
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
        alert(`Gift of $${amount} sent to ProGamer_99! Platform took 10% fee.`);
      } else {
        alert('Insufficient balance');
      }
      setIsProcessingGift(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col lg:flex-row overflow-hidden">
      {/* Main Game View */}
      <div className="flex-1 relative group">
        {/* Cinematic Background/Video */}
        <div className="absolute inset-0">
          <img 
            src="https://picsum.photos/seed/cyberpunk/1920/1080" 
            alt="Game View" 
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
        </div>

        {/* Top Overlay */}
        <div className="absolute top-0 left-0 right-0 p-8 flex items-center justify-between z-10">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate(-1)}
              className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white hover:bg-white/20 transition-all"
            >
              <ChevronLeft size={24} />
            </button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-black text-white uppercase italic">Cyberpunk 2077</h1>
                <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest animate-pulse">Live</span>
              </div>
              <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Action RPG • CD Projekt Red</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
              <Users size={16} className="text-brand-primary" />
              <span className="text-white text-xs font-black">12.5k</span>
            </div>
            <button 
              onClick={() => setIsGifting(true)}
              className="bg-brand-primary text-white px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-brand-accent hover:text-black transition-all flex items-center gap-2"
            >
              <Gift size={14} /> Gift
            </button>
            <button className="bg-white/10 text-white px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white/20 transition-all">
              Follow
            </button>
          </div>
        </div>

        {/* Center Play Button Overlay (Simulated) */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-24 h-24 bg-brand-primary/20 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/20 group/play"
          >
            <div className="w-16 h-16 bg-brand-primary rounded-full flex items-center justify-center shadow-2xl shadow-brand-primary/40 group-hover/play:bg-brand-accent transition-colors">
              <Play size={32} className="text-white fill-current ml-1" />
            </div>
          </motion.button>
        </div>

        {/* Bottom Controls Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-8 flex items-center justify-between z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-brand-primary">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=ProGamer" alt="Streamer" className="w-full h-full object-cover" />
              </div>
              <div>
                <h4 className="text-white font-black uppercase italic text-sm">ProGamer_99</h4>
                <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">Playing Cyberpunk 2077</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button className="text-white/60 hover:text-white transition-colors"><Volume2 size={20} /></button>
            <button className="text-white/60 hover:text-white transition-colors"><Settings size={20} /></button>
            <button className="text-white/60 hover:text-white transition-colors"><Maximize2 size={20} /></button>
          </div>
        </div>
      </div>

      {/* Chat Sidebar */}
      <div className="w-full lg:w-[400px] bg-[#0f0b21] border-l border-white/10 flex flex-col">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] italic flex items-center gap-3">
            <MessageSquare size={18} className="text-brand-primary" /> Live Chat
          </h3>
          <div className="flex gap-4">
            <button className="text-zinc-500 hover:text-white transition-colors"><Heart size={18} /></button>
            <button className="text-zinc-500 hover:text-white transition-colors"><Share2 size={18} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          {chat.map((msg) => (
            <div key={msg.id} className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: msg.color }}>{msg.user}</span>
                <span className="text-[8px] text-zinc-600 font-bold">12:45 PM</span>
              </div>
              <p className="text-zinc-300 text-xs leading-relaxed">{msg.text}</p>
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-white/10 bg-black/20">
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

      {/* Gifting Modal */}
      <AnimatePresence>
        {isGifting && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0f0b21]/90 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-[#1a1635] border border-white/10 rounded-[3rem] p-10 relative shadow-2xl"
            >
              <button 
                onClick={() => setIsGifting(false)}
                className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
              <div className="flex flex-col items-center text-center mb-10">
                <div className="w-24 h-24 rounded-[1.5rem] overflow-hidden bg-white/5 border border-white/10 mb-6 p-2">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=ProGamer" alt="ProGamer" className="w-full h-full object-cover rounded-[1rem]" />
                </div>
                <h3 className="text-2xl font-black text-white uppercase italic">Gift ProGamer_99</h3>
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-2">Support your favorite gamer with a gift.</p>
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
