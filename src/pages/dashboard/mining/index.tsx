import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Pickaxe, Play, CheckCircle2, AlertCircle, Timer, Coins, ExternalLink } from 'lucide-react';

export default function Mining() {
  const [isMining, setIsMining] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [progress, setProgress] = useState(0);
  const [minedToday, setMinedToday] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [user, setUser] = useState<any>({ igc_balance: 1250 });
  const [videos, setVideos] = useState<any[]>([
    { id: 1, title: 'Cyber Strike: Pro Tips', reward: 50 },
    { id: 2, title: 'Neon Racer: Speedrun Guide', reward: 75 },
    { id: 3, title: 'Shadow Quest: Hidden Secrets', reward: 100 },
  ]);

  useEffect(() => {
    // No backend, just use mock data
  }, []);

  const startMining = () => {
    if (videos.length === 0) return;
    
    setIsMining(true);
    setSessionComplete(false);
    setShowAd(false);
    setProgress(0);

    // Simulate video playing
    let current = 0;
    const interval = setInterval(() => {
      current += 1;
      setProgress(current);
      
      // Show ad at 50%
      if (current === 50) {
        setShowAd(true);
      }
      
      if (current >= 100) {
        clearInterval(interval);
        completeMining();
      }
    }, 100);
  };

  const completeMining = () => {
    const video = videos[currentVideoIndex];
    setIsMining(false);
    setShowAd(false);
    setSessionComplete(true);
    setMinedToday(prev => prev + video.reward);
    setUser((prev: any) => ({ ...prev, igc_balance: prev.igc_balance + video.reward }));
    setCurrentVideoIndex((prev) => (prev + 1) % videos.length);
  };

  const currentVideo = videos[currentVideoIndex];

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-12">
      <header className="text-center space-y-6">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-brand-primary/10 rounded-[2rem] border border-brand-primary/20 mb-4 shadow-lg shadow-brand-primary/10">
          <Pickaxe className="text-brand-primary" size={44} />
        </div>
        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-accent">Earn Rewards</span>
          <h1 className="text-5xl font-black tracking-tighter uppercase italic text-white">Mine IGC</h1>
        </div>
        <p className="text-zinc-500 max-w-md mx-auto text-sm leading-relaxed">
          Watch daily videos to mine iGamia Coins. These coins can be used for exclusive rewards and future trading.
        </p>
      </header>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 text-center group hover:bg-white/10 transition-all">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Total Mined</p>
          <p className="text-4xl font-black text-white italic">{user?.igc_balance || 0}</p>
          <p className="text-[10px] font-black text-brand-primary mt-2 uppercase tracking-widest">IGC Balance</p>
        </div>
        <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 text-center group hover:bg-white/10 transition-all">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Daily Limit</p>
          <p className="text-4xl font-black text-white italic">{minedToday} / 500</p>
          <p className="text-[10px] font-black text-zinc-500 mt-2 uppercase tracking-widest">IGC Today</p>
        </div>
        <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 text-center group hover:bg-white/10 transition-all">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Next Reset</p>
          <p className="text-4xl font-black text-white italic">14:22:05</p>
          <p className="text-[10px] font-black text-zinc-500 mt-2 uppercase tracking-widest">Hours Left</p>
        </div>
      </div>

      <div className="bg-white/5 rounded-[3rem] border border-white/10 overflow-hidden relative shadow-2xl">
        <div className="aspect-video bg-black/40 relative flex items-center justify-center overflow-hidden">
          <AnimatePresence>
            {showAd && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute inset-0 z-50 bg-[#0f0b21]/95 backdrop-blur-md flex flex-col items-center justify-center p-10 text-center"
              >
                <div className="bg-brand-primary/20 text-brand-primary text-[10px] font-black px-3 py-1.5 rounded-xl mb-6 uppercase tracking-widest border border-brand-primary/20">Sponsored Advertisement</div>
                <h3 className="text-3xl font-black text-white uppercase italic mb-4">Upgrade to iGamia Pro</h3>
                <p className="text-zinc-400 text-sm mb-8 max-w-xs leading-relaxed">Get 2x mining speed and zero platform fees on all gifts and bets.</p>
                <button 
                  onClick={() => setShowAd(false)}
                  className="bg-white text-black px-10 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-brand-primary hover:text-white transition-all"
                >
                  Skip in 5s
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {!isMining && !sessionComplete && (
            <div className="text-center space-y-8">
              {currentVideo && (
                <div className="mb-4">
                  <h3 className="text-2xl font-black text-white uppercase italic mb-2">{currentVideo.title}</h3>
                  <div className="flex items-center justify-center gap-3">
                    <span className="bg-brand-primary/20 text-brand-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-brand-primary/20">
                      Reward: {currentVideo.reward} IGC
                    </span>
                  </div>
                </div>
              )}
              <button 
                onClick={startMining}
                className="group flex flex-col items-center gap-6"
              >
                <div className="w-24 h-24 bg-brand-primary text-white rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xl shadow-brand-primary/40 group-hover:bg-brand-accent group-hover:text-black">
                  <Play size={40} className="fill-current ml-1" />
                </div>
                <span className="font-black text-white uppercase tracking-[0.2em] text-xs">Start Mining Session</span>
              </button>
            </div>
          )}

          {isMining && (
            <div className="w-full max-w-md px-10 text-center space-y-8">
              <div className="relative h-3 bg-white/5 rounded-full overflow-hidden border border-white/10">
                <motion.div 
                  className="absolute inset-y-0 left-0 bg-brand-primary shadow-[0_0_20px_rgba(157,124,240,0.5)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                <span className="text-zinc-500 flex items-center gap-2">
                  <Timer size={16} className="text-brand-primary" /> {showAd ? 'Ad playing...' : 'Mining in progress...'}
                </span>
                <span className="text-brand-primary">{progress}% Complete</span>
              </div>
            </div>
          )}

          {sessionComplete && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-8"
            >
              <div className="w-24 h-24 bg-brand-primary/20 rounded-full flex items-center justify-center mx-auto border border-brand-primary/30 shadow-lg shadow-brand-primary/10">
                <CheckCircle2 className="text-brand-primary" size={48} />
              </div>
              <div>
                <h3 className="text-3xl font-black text-white uppercase italic mb-3">Mining Successful!</h3>
                <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">You've earned <span className="text-brand-primary">{videos[currentVideoIndex]?.reward} IGC</span></p>
              </div>
              <button 
                onClick={startMining}
                className="bg-white text-black px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-brand-primary hover:text-white transition-all"
              >
                Mine Next Video
              </button>
            </motion.div>
          )}
        </div>

        <div className="p-10 bg-white/5 border-t border-white/10">
          <div className="flex items-start gap-6">
            <div className="p-4 bg-brand-accent/10 rounded-[1.5rem] border border-brand-accent/20">
              <AlertCircle className="text-brand-accent" size={28} />
            </div>
            <div>
              <h4 className="font-black text-white uppercase italic mb-2">How it works</h4>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Complete the full video to receive your rewards. You can mine up to 500 IGC daily. 
                Adverts may appear during the mining process to support the ecosystem.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
