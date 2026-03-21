import React from 'react';
import { 
  ArrowLeft, 
  Trophy, 
  Play, 
  Users, 
  Circle, 
  MoreVertical,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function History() {
  const streams = Array(8).fill({
    title: 'IGC 2024 Play For Fun',
    streamer: 'Michael Tims',
    viewers: '1.2K',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
    thumbnail: 'https://picsum.photos/seed/stream/400/600'
  });

  const games = Array(8).fill({
    title: 'Planet Legends',
    players: '12K',
    image: 'https://picsum.photos/seed/game/400/500'
  });

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/home" className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-black text-white uppercase italic tracking-tight">Mega Game</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/leaderboard" className="flex items-center gap-2 bg-white/5 border border-white/10 px-5 py-2.5 rounded-xl text-[10px] font-black text-zinc-400 uppercase tracking-widest hover:bg-white/10 transition-all">
            <Trophy size={14} className="text-brand-accent" />
            Tournament
          </Link>
          <Link to="/library" className="flex items-center gap-2 bg-brand-primary/20 border border-brand-primary/30 px-5 py-2.5 rounded-xl text-[10px] font-black text-brand-primary uppercase tracking-widest hover:bg-brand-primary/30 transition-all">
            <Play size={14} className="fill-current" />
            Play
          </Link>
        </div>
      </div>

      {/* Featured Video Area */}
      <div className="relative aspect-video w-full rounded-[3rem] overflow-hidden border border-white/10 group shadow-2xl shadow-black/50">
        <img 
          src="https://picsum.photos/seed/megagame/1920/1080" 
          alt="Mega Game" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0b21] via-transparent to-transparent opacity-60" />
        
        {/* Resume Playing Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-[#1a1635]/80 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] flex flex-col items-center gap-4 shadow-2xl">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <Circle size={64} className="text-brand-primary/20 absolute" strokeWidth={4} />
              <Circle size={64} className="text-brand-primary absolute" strokeWidth={4} strokeDasharray="100 200" />
              <Play size={24} className="text-white fill-current ml-1" />
            </div>
            <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Resume Playing</span>
          </div>
        </div>

        {/* Video Controls Placeholder */}
        <div className="absolute bottom-10 left-10 right-10 flex flex-col gap-4">
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
            <div className="h-full w-1/3 bg-brand-accent rounded-full" />
          </div>
          <div className="flex items-center justify-between text-[10px] font-black text-zinc-400 uppercase tracking-widest">
            <div className="flex items-center gap-6">
              <Play size={16} className="text-white fill-current" />
              <span>00:00 / 02:30</span>
            </div>
            <MoreVertical size={16} />
          </div>
        </div>
      </div>

      {/* Ongoing Streams */}
      <section className="space-y-8">
        <h2 className="text-sm font-black text-white uppercase tracking-[0.3em] italic">Ongoing Streams</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {streams.map((stream, i) => (
            <div key={i} className="group cursor-pointer">
              <div className="relative aspect-[3/4] rounded-[2.5rem] overflow-hidden border border-white/10 mb-4">
                <img 
                  src={`${stream.thumbnail}?sig=${i}`} 
                  alt={stream.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f0b21] via-transparent to-transparent" />
                
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-brand-primary px-3 py-1 rounded-full">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  <span className="text-[8px] font-black text-white uppercase tracking-widest">Live</span>
                </div>

                <div className="absolute bottom-6 left-6 right-6 space-y-3">
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-2xl">
                    <p className="text-[10px] font-black text-white uppercase tracking-tight leading-tight mb-2">{stream.title}</p>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full overflow-hidden border border-white/20">
                        <img src={stream.avatar} alt={stream.streamer} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[8px] font-bold text-zinc-300">{stream.streamer}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">
                    <Users size={10} />
                    <span>{stream.viewers} watching</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* You Might Want To Play */}
      <section className="space-y-8">
        <h2 className="text-sm font-black text-white uppercase tracking-[0.3em] italic">You Might Want To Play</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {games.map((game, i) => (
            <div key={i} className="group cursor-pointer">
              <div className="relative aspect-square rounded-[2.5rem] overflow-hidden border border-white/10 mb-4">
                <img 
                  src={`${game.image}?sig=${i + 10}`} 
                  alt={game.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f0b21] via-transparent to-transparent opacity-60" />
              </div>
              <div className="px-2">
                <h3 className="text-xs font-black text-white uppercase italic tracking-tight mb-1">{game.title}</h3>
                <div className="flex items-center gap-1.5 text-[8px] font-black text-zinc-500 uppercase tracking-widest">
                  <Users size={10} />
                  <span>{game.players} players</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
