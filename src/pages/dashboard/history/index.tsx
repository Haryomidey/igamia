import React, { useEffect, useState } from 'react';
import { ArrowLeft, Trophy, Play, Users, Circle, MoreVertical, ChevronRight, Video } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGames } from '../../../hooks/useGames';
import { useStream } from '../../../hooks/useStream';

export default function History() {
  const { featuredGames } = useGames({ featured: true });
  const { activeStreams, fetchActiveStreams, fetchMyRecordings } = useStream();
  const [recordings, setRecordings] = useState<any[]>([]);

  useEffect(() => {
    void fetchActiveStreams();
    void fetchMyRecordings().then(setRecordings).catch(() => setRecordings([]));
    // The stream hook recreates helpers on render, so this initial fetch is mount-only by design.
  }, []);

  const featuredGame = featuredGames[0];

  return (
    <div className="space-y-10 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/home" className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-black text-white uppercase italic tracking-tight">{featuredGame?.title ?? 'History'}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/leaderboard" className="flex items-center gap-2 bg-white/5 border border-white/10 px-5 py-2.5 rounded-xl text-[10px] font-black text-zinc-400 uppercase tracking-widest hover:bg-white/10 transition-all">
            <Trophy size={14} className="text-brand-accent" />
            Tournament
          </Link>
          {featuredGame && (
            <Link to={`/play?gameId=${featuredGame._id}`} className="flex items-center gap-2 bg-brand-primary/20 border border-brand-primary/30 px-5 py-2.5 rounded-xl text-[10px] font-black text-brand-primary uppercase tracking-widest hover:bg-brand-primary/30 transition-all">
              <Play size={14} className="fill-current" />
              Play
            </Link>
          )}
        </div>
      </div>

      <div className="relative aspect-video w-full rounded-[3rem] overflow-hidden border border-white/10 group shadow-2xl shadow-black/50">
        <img src={featuredGame?.heroImage ?? 'https://picsum.photos/seed/history/1920/1080'} alt={featuredGame?.title ?? 'Featured'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0b21] via-transparent to-transparent opacity-60" />

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

        <div className="absolute bottom-10 left-10 right-10 flex flex-col gap-4">
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
            <div className="h-full w-1/3 bg-brand-accent rounded-full" />
          </div>
          <div className="flex items-center justify-between text-[10px] font-black text-zinc-400 uppercase tracking-widest">
            <div className="flex items-center gap-6">
              <Play size={16} className="text-white fill-current" />
              <span>{featuredGame?.genre ?? 'Game'} / {featuredGame?.publisher ?? 'Publisher'}</span>
            </div>
            <MoreVertical size={16} />
          </div>
        </div>
      </div>

      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-white uppercase tracking-[0.3em] italic">Recorded Streams</h2>
        </div>
        {recordings.length ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recordings.map((recording) => (
              <div key={recording._id} className="group overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5">
                <div className="relative aspect-video overflow-hidden">
                  <video
                    src={recording.recordingUrl}
                    controls
                    preload="metadata"
                    className="h-full w-full object-cover"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0f0b21] via-transparent to-transparent" />
                  <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 backdrop-blur-md">
                    <Video size={12} className="text-brand-primary" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-white">Recorded</span>
                  </div>
                </div>
                <div className="space-y-3 p-5">
                  <h3 className="text-sm font-black uppercase italic text-white">{recording.title}</h3>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                    {recording.recordedAt ? new Date(recording.recordedAt).toLocaleString() : 'Saved stream'}
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                    Duration: {recording.recordingDurationSeconds ?? 0}s
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-white/10 bg-white/5 px-8 py-12 text-center text-zinc-500">
            No recorded streams yet.
          </div>
        )}
      </section>

      <section className="space-y-8">
        <h2 className="text-sm font-black text-white uppercase tracking-[0.3em] italic">Ongoing Streams</h2>
        {activeStreams.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {activeStreams.slice(0, 8).map((stream) => (
              <Link key={stream._id} to={`/stream?streamId=${stream._id}`} className="group cursor-pointer">
                <div className="relative aspect-[3/4] rounded-[2.5rem] overflow-hidden border border-white/10 mb-4">
                  <img src={`https://picsum.photos/seed/${stream._id}/400/600`} alt={stream.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
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
                          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${stream.participants[0]?.username ?? stream.title}`} alt={stream.participants[0]?.username ?? stream.title} className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[8px] font-bold text-zinc-300">{stream.participants[0]?.username ?? 'Host'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">
                      <Users size={10} />
                      <span>{stream.viewersCount} watching</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-white/10 bg-white/5 px-8 py-12 text-center text-zinc-500">
            No live streams are active right now.
          </div>
        )}
      </section>

      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-white uppercase tracking-[0.3em] italic">You Might Want To Play</h2>
          <Link to="/library" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-primary">
            View More <ChevronRight size={14} />
          </Link>
        </div>
        {featuredGames.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredGames.slice(0, 8).map((game) => (
              <Link key={game._id} to={`/play?gameId=${game._id}`} className="group cursor-pointer">
                <div className="relative aspect-square rounded-[2.5rem] overflow-hidden border border-white/10 mb-4">
                  <img src={game.thumbnail} alt={game.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f0b21] via-transparent to-transparent opacity-60" />
                </div>
                <div className="px-2">
                  <h3 className="text-xs font-black text-white uppercase italic tracking-tight mb-1">{game.title}</h3>
                  <div className="flex items-center gap-1.5 text-[8px] font-black text-zinc-500 uppercase tracking-widest">
                    <Users size={10} />
                    <span>{game.activePlayers.toLocaleString()} players</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-white/10 bg-white/5 px-8 py-12 text-center text-zinc-500">
            No game suggestions are available right now.
          </div>
        )}
      </section>
    </div>
  );
}
