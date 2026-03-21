import React, { useState, useEffect } from 'react';
import { Settings, Edit3, Users, Play, Trophy, Share2, Grid, List, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export default function Profile() {
  const [user, setUser] = useState<any>({
    username: 'AlexGamer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AlexGamer',
    subscribers: 12500,
    balance: 500,
    igc_balance: 1250
  });
  const [activeTab, setActiveTab] = useState('recorded');
  const [bets, setBets] = useState<any[]>([
    { id: 1, game_title: 'Cyber Strike', game_thumbnail: 'https://picsum.photos/seed/cs1/400/225', amount: 20, status: 'won', created_at: new Date().toISOString() },
    { id: 2, game_title: 'Neon Racer', game_thumbnail: 'https://picsum.photos/seed/nr1/400/225', amount: 10, status: 'lost', created_at: new Date().toISOString() },
  ]);

  useEffect(() => {
    // No backend, just use mock data
  }, []);

  if (!user) return null;

  return (
    <div className="space-y-12 pb-12">
      <header className="relative">
        <div className="h-56 md:h-80 bg-gradient-to-r from-brand-deep to-brand-primary rounded-[3rem] overflow-hidden relative group">
          <img 
            src="https://picsum.photos/seed/profile-banner/1920/600" 
            alt="Banner" 
            className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a1635] via-transparent to-transparent" />
        </div>
        <div className="px-10 -mt-24 flex flex-col lg:flex-row items-end justify-between gap-8 relative z-10">
          <div className="flex flex-col md:flex-row items-end gap-8">
            <div className="relative">
              <div className="w-40 h-40 md:w-48 md:h-48 rounded-[3rem] border-[12px] border-[#1a1635] overflow-hidden bg-[#1a1635] shadow-2xl">
                <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
              </div>
              <button 
                onClick={() => alert('Avatar editing coming soon!')}
                className="absolute bottom-4 right-4 p-3 bg-brand-primary rounded-2xl text-white shadow-xl hover:bg-brand-accent hover:text-black transition-all"
              >
                <Edit3 size={20} />
              </button>
            </div>
            <div className="pb-6 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">{user.username}</h1>
                {user.subscribers >= 1 && (
                  <div className="w-6 h-6 bg-brand-primary rounded-full flex items-center justify-center shadow-lg shadow-brand-primary/20">
                    <CheckCircle2 className="text-white" size={14} />
                  </div>
                )}
              </div>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em]">@{user.username.toLowerCase()}</p>
            </div>
          </div>
          <div className="flex gap-4 pb-6 w-full lg:w-auto">
            <button 
              onClick={() => alert('Share profile link copied to clipboard!')}
              className="flex-1 lg:flex-none p-4 bg-white/5 border border-white/10 rounded-2xl text-zinc-400 hover:text-white transition-all"
            >
              <Share2 size={22} />
            </button>
            <Link 
              to="/more"
              className="flex-1 lg:flex-none p-4 bg-white/5 border border-white/10 rounded-2xl text-zinc-400 hover:text-white transition-all flex items-center justify-center"
            >
              <Settings size={22} />
            </Link>
            <Link 
              to="/more"
              className="flex-[2] lg:flex-none bg-brand-primary text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-brand-accent hover:text-black transition-all shadow-xl shadow-brand-primary/20 flex items-center justify-center"
            >
              Edit Profile
            </Link>
          </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-4 gap-12">
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white/5 p-8 rounded-[3rem] border border-white/10 shadow-2xl">
            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-6">About</h3>
            <p className="text-zinc-400 text-sm leading-relaxed mb-8">
              Professional gamer and streamer. Join my pledges and let's win together!
            </p>
            <div className="flex justify-between border-t border-white/5 pt-8">
              <div className="text-center">
                <p className="text-2xl font-black text-white italic">{user.subscribers.toLocaleString()}</p>
                <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Followers</p>
              </div>
              <div className="w-px bg-white/5" />
              <div className="text-center">
                <p className="text-2xl font-black text-white italic">452</p>
                <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Following</p>
              </div>
            </div>
            {user.subscribers >= 1 && (
              <div className="mt-8 p-6 bg-brand-primary/10 rounded-[2rem] border border-brand-primary/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
                <p className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] mb-2 relative z-10">Status</p>
                <p className="text-sm text-white font-black uppercase italic relative z-10">Monetization Active</p>
                <p className="text-[10px] text-zinc-500 mt-2 font-bold uppercase tracking-widest relative z-10">Earning from gifts and bets enabled.</p>
              </div>
            )}
          </div>

          <div className="bg-white/5 p-8 rounded-[3rem] border border-white/10 shadow-2xl">
            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-6">Achievements</h3>
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-square bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center group cursor-pointer hover:bg-brand-primary/20 hover:border-brand-primary/30 transition-all">
                  <Trophy size={20} className="text-zinc-700 group-hover:text-brand-primary transition-all" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-10">
          <div className="flex items-center justify-between">
            <div className="flex gap-10 border-b border-white/10 w-full">
              {[
                { id: 'recorded', label: 'Recorded Games' },
                { id: 'pledged', label: 'Pledged History' },
                { id: 'clips', label: 'Clips' },
              ].map((tab) => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-6 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${
                    activeTab === tab.id 
                      ? 'text-white' 
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div 
                      layoutId="profileTab"
                      className="absolute bottom-0 left-0 right-0 h-1 bg-brand-primary rounded-full"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'recorded' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {[
                { title: 'Epic Win in Cyber Strike', date: '2 days ago', views: '1.2k', thumb: 'https://picsum.photos/seed/rec1/400/225' },
                { title: 'Neon Racer Speedrun', date: '5 days ago', views: '850', thumb: 'https://picsum.photos/seed/rec2/400/225' },
                { title: 'Shadow Quest Boss Fight', date: '1 week ago', views: '2.4k', thumb: 'https://picsum.photos/seed/rec3/400/225' },
                { title: 'Co-op Challenge Highlights', date: '2 weeks ago', views: '3.1k', thumb: 'https://picsum.photos/seed/rec4/400/225' },
              ].map((rec, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ y: -8 }}
                  className="bg-white/5 rounded-[2.5rem] overflow-hidden border border-white/10 group cursor-pointer hover:bg-white/10 transition-all shadow-xl"
                >
                  <div className="relative aspect-video">
                    <img src={rec.thumb} alt={rec.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-[#0f0b21]/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                      <div className="w-16 h-16 bg-brand-primary text-white rounded-full flex items-center justify-center shadow-2xl shadow-brand-primary/40">
                        <Play size={32} className="fill-current ml-1" />
                      </div>
                    </div>
                    <span className="absolute bottom-4 right-4 bg-[#0f0b21]/80 backdrop-blur-md text-white text-[10px] font-black px-3 py-1.5 rounded-xl border border-white/10">
                      12:45
                    </span>
                  </div>
                  <div className="p-8">
                    <h4 className="font-black text-white uppercase italic text-lg mb-3 group-hover:text-brand-primary transition-colors">{rec.title}</h4>
                    <div className="flex items-center justify-between text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                      <span className="flex items-center gap-2"><List size={14} className="text-brand-primary" /> {rec.date}</span>
                      <span className="flex items-center gap-2"><Play size={14} className="text-brand-primary" /> {rec.views} Views</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === 'pledged' && (
            <div className="space-y-6">
              {bets.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-[3rem] border border-white/10">
                  <p className="text-zinc-500 font-black uppercase tracking-widest">No pledge history found.</p>
                </div>
              ) : (
                bets.map((bet) => (
                  <div key={bet.id} className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 flex items-center justify-between group hover:bg-white/10 transition-all">
                    <div className="flex items-center gap-6">
                      <div className="w-24 h-16 rounded-2xl overflow-hidden bg-white/5 border border-white/10 p-1">
                        <img src={bet.game_thumbnail} alt={bet.game_title} className="w-full h-full object-cover rounded-xl" />
                      </div>
                      <div>
                        <h4 className="font-black text-white uppercase italic text-lg mb-1">{bet.game_title}</h4>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Amount: <span className="text-white">${bet.amount.toFixed(2)}</span> • {new Date(bet.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-5 py-2 rounded-xl border ${
                        bet.status === 'won' ? 'bg-brand-primary/10 text-brand-primary border-brand-primary/20' : 
                        bet.status === 'lost' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 
                        'bg-white/5 text-zinc-500 border-white/10'
                      }`}>
                        {bet.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'clips' && (
            <div className="text-center py-20 bg-white/5 rounded-[3rem] border border-white/10">
              <p className="text-zinc-500 font-black uppercase tracking-widest">No clips available yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
