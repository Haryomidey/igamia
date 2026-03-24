import React, { useEffect } from 'react';
import { Medal, Trophy, Video, Flame } from 'lucide-react';
import { motion } from 'motion/react';
import { usePledges } from '../../../hooks/usePledges';
import { useToast } from '../../../components/ToastProvider';

export default function Leaderboard() {
  const { leaderboard, fetchLeaderboard, error } = usePledges(true);
  const toast = useToast();

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error, toast]);

  const leaders = leaderboard.slice(0, 3);

  return (
    <div className="space-y-12 pb-12">
      <header className="space-y-4">
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-accent">
          Win Rate Rankings
        </span>
        <h1 className="text-5xl font-black tracking-tighter uppercase italic text-white">
          Leaderboard
        </h1>
        <p className="max-w-2xl text-zinc-400 leading-relaxed">
          Rankings are now driven by actual pledge win rate, with extra rank points from wins,
          draws, and hosted streams.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {leaders.map((leader, index) => (
          <motion.div
            key={leader.userId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className={`rounded-[2.5rem] border p-8 ${
              index === 0
                ? 'border-brand-primary/30 bg-brand-primary/15'
                : 'border-white/10 bg-white/5'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">
                Rank #{leader.rank}
              </p>
              <Medal
                size={28}
                className={
                  index === 0 ? 'text-brand-accent' : index === 1 ? 'text-zinc-300' : 'text-amber-700'
                }
              />
            </div>
            <div className="mt-6 flex items-center gap-4">
              <img
                src={leader.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${leader.username}`}
                alt={leader.username}
                className="h-16 w-16 rounded-2xl border border-white/10 object-cover"
              />
              <div>
                <h3 className="text-xl font-black uppercase italic text-white">{leader.username}</h3>
                <p className="text-sm font-bold text-brand-primary">{leader.winRate}% win rate</p>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl bg-black/20 px-3 py-4">
                <p className="text-lg font-black text-white">{leader.wins}</p>
                <p className="text-[10px] uppercase tracking-widest text-zinc-500">Wins</p>
              </div>
              <div className="rounded-2xl bg-black/20 px-3 py-4">
                <p className="text-lg font-black text-white">{leader.draws}</p>
                <p className="text-[10px] uppercase tracking-widest text-zinc-500">Draws</p>
              </div>
              <div className="rounded-2xl bg-black/20 px-3 py-4">
                <p className="text-lg font-black text-white">{leader.streamsHosted}</p>
                <p className="text-[10px] uppercase tracking-widest text-zinc-500">Streams</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5">
        <div className="flex items-center justify-between border-b border-white/10 p-6">
          <h2 className="text-xl font-black uppercase italic text-white">Competitive Ladder</h2>
          <button
            onClick={() => void fetchLeaderboard()}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white"
          >
            Refresh
          </button>
        </div>
        <div className="divide-y divide-white/5">
          {leaderboard.map((leader) => (
            <div key={leader.userId} className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <span className="w-8 text-2xl font-black text-zinc-600">{leader.rank}</span>
                <img
                  src={leader.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${leader.username}`}
                  alt={leader.username}
                  className="h-12 w-12 rounded-full border border-white/10 object-cover"
                />
                <div>
                  <h4 className="font-black text-white">{leader.username}</h4>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {leader.achievements.slice(0, 3).map((achievement) => (
                      <span
                        key={achievement}
                        className="rounded-full bg-white/5 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-zinc-300"
                      >
                        {achievement}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center sm:gap-8">
                <div className="text-right">
                  <p className="flex items-center justify-end gap-1 text-sm font-black text-white">
                    <Flame size={14} className="text-brand-primary" /> {leader.winRate}%
                  </p>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500">Win Rate</p>
                </div>
                <div className="text-right">
                  <p className="flex items-center justify-end gap-1 text-sm font-black text-white">
                    <Trophy size={14} className="text-brand-accent" /> {leader.rankPoints}
                  </p>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500">Rank Pts</p>
                </div>
                <div className="text-right">
                  <p className="flex items-center justify-end gap-1 text-sm font-black text-white">
                    <Video size={14} className="text-zinc-300" /> {leader.streamsHosted}
                  </p>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500">Streams</p>
                </div>
              </div>
            </div>
          ))}
          {!leaderboard.length && (
            <div className="p-12 text-center text-zinc-500">No ranked players yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
