import React, { useState, useEffect } from 'react';
import { Search, Filter, Gamepad2, Users, Star, Clock, TrendingUp, X, DollarSign } from 'lucide-react';
import { FEATURED_GAMES } from '../../../constants';
import { motion, AnimatePresence } from 'motion/react';

export default function GameLibrary() {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [betAmount, setBetAmount] = useState('');
  const [isBetting, setIsBetting] = useState(false);
  const [user, setUser] = useState<any>({ balance: 500 });

  useEffect(() => {
    // No backend, just use mock data
  }, []);

  const tabs = [
    { id: 'all', label: 'All Games' },
    { id: 'popular', label: 'Popular' },
    { id: 'new', label: 'New Releases' },
    { id: 'coop', label: 'Co-op Pledges' },
  ];

  const handleBet = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBetting(true);
    
    // Simulate betting
    setTimeout(() => {
      const amount = parseFloat(betAmount);
      if (user.balance >= amount) {
        setUser((prev: any) => ({ ...prev, balance: prev.balance - amount }));
        setSelectedGame(null);
        setBetAmount('');
        alert('Bet placed successfully! Platform takes 10% of winnings.');
      } else {
        alert('Insufficient balance');
      }
      setIsBetting(false);
    }, 1000);
  };

  return (
    <div className="space-y-12 pb-12">
      <header className="space-y-8">
        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-accent">Discover & Play</span>
          <h1 className="text-5xl font-black tracking-tighter uppercase italic text-white">Game Library</h1>
        </div>
        
        <div className="flex flex-col md:flex-row gap-6">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-brand-primary transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search games, categories..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-brand-primary/50 transition-all"
            />
          </div>
          <button className="flex items-center justify-center gap-3 bg-white/5 border border-white/10 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-colors">
            <Filter size={18} /> Filters
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab.id 
                  ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' 
                  : 'bg-white/5 text-zinc-500 hover:text-white border border-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {FEATURED_GAMES.map((game, i) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white/5 rounded-[2.5rem] overflow-hidden border border-white/10 group"
          >
            <div className="relative aspect-[4/3]">
              <img 
                src={game.thumbnail} 
                alt={game.title} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-6 right-6 flex gap-2">
                <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-black px-3 py-1.5 rounded-xl flex items-center gap-1.5 border border-white/10">
                  <Star size={12} className="text-brand-accent fill-brand-accent" /> 4.8
                </span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f0b21] via-transparent to-transparent" />
            </div>
            <div className="p-8">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em]">{game.category}</span>
                <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                  <Users size={14} className="text-brand-primary" /> {game.players.toLocaleString()}
                </div>
              </div>
              <h3 className="text-xl font-black text-white uppercase italic leading-tight mb-8">{game.title}</h3>
              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    setSelectedGame(game);
                    setBetAmount('10');
                  }}
                  className="flex-1 bg-brand-primary text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-accent hover:text-black transition-all shadow-lg shadow-brand-primary/20"
                >
                  Pledge $10
                </button>
                <button 
                  onClick={() => setSelectedGame(game)}
                  className="w-14 h-14 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-brand-primary/10 text-brand-primary transition-all"
                >
                  <TrendingUp size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <section className="bg-brand-primary/10 rounded-[3rem] p-12 border border-brand-primary/20 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
          <div className="space-y-6 text-center lg:text-left">
            <h2 className="text-4xl font-black tracking-tighter uppercase italic text-white">CO-OP CHALLENGE</h2>
            <p className="text-zinc-400 max-w-md text-sm leading-relaxed">
              Join a team of 3 and pledge together to win a massive prize pool. New challenges every weekend.
            </p>
            <div className="flex flex-wrap justify-center lg:justify-start gap-6">
              <div className="flex items-center gap-3 text-xs font-black text-white uppercase tracking-widest">
                <Clock size={20} className="text-brand-primary" /> Starts in 04:22:10
              </div>
              <div className="flex items-center gap-3 text-xs font-black text-white uppercase tracking-widest">
                <Users size={20} className="text-brand-primary" /> 1,240 Joined
              </div>
            </div>
          </div>
          <button 
            onClick={() => alert('Co-op Challenge joined! Team matching in progress...')}
            className="bg-white text-black px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-brand-primary hover:text-white transition-all shadow-2xl shadow-white/5"
          >
            Join Co-op
          </button>
        </div>
      </section>

      <AnimatePresence>
        {selectedGame && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0f0b21]/90 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-[#1a1635] border border-white/10 rounded-[3rem] p-10 relative shadow-2xl"
            >
              <button 
                onClick={() => setSelectedGame(null)}
                className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
              <div className="flex flex-col items-center text-center mb-10">
                <div className="w-24 h-24 rounded-3xl overflow-hidden bg-white/5 border border-white/10 mb-6 p-2">
                  <img src={selectedGame.thumbnail} alt={selectedGame.title} className="w-full h-full object-cover rounded-2xl" />
                </div>
                <h3 className="text-2xl font-black text-white uppercase italic">Stake on {selectedGame.title}</h3>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-2">Bet on top players and win big.</p>
              </div>
              <form onSubmit={handleBet} className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-1">Stake Amount (USD)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-primary" size={20} />
                    <input 
                      type="number" 
                      value={betAmount}
                      onChange={(e) => setBetAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 pl-12 pr-6 text-white font-black focus:outline-none focus:border-brand-primary/50 transition-all"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest ml-1">Platform Fee: 10% on winnings</p>
                </div>
                <button 
                  type="submit"
                  disabled={isBetting}
                  className="w-full bg-brand-primary text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-brand-accent hover:text-black transition-all disabled:opacity-50 shadow-lg shadow-brand-primary/20"
                >
                  {isBetting ? 'Processing...' : 'Place Stake'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
