import React, { useEffect, useMemo, useState } from 'react';
import { Search, Filter, Users, Star, Clock, TrendingUp, X, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSearchParams } from 'react-router-dom';
import { useGames, type Game } from '../../../hooks/useGames';
import { usePledges, type MatchActivity } from '../../../hooks/usePledges';
import { useWallet } from '../../../hooks/useWallet';
import { useToast } from '../../../components/ToastProvider';

export default function GameLibrary() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedMatch, setSelectedMatch] = useState<MatchActivity | null>(null);
  const [betAmount, setBetAmount] = useState('');
  const [isBetting, setIsBetting] = useState(false);
  const toast = useToast();

  const { games, loading: gamesLoading, error: gamesError } = useGames({
    search,
    popular: activeTab === 'popular' ? true : undefined,
    featured: activeTab === 'featured' ? true : undefined,
  });
  const { activities, loading: pledgesLoading, error: pledgesError, placePledge } = usePledges(true);
  const { walletData } = useWallet(true);

  const tabs = [
    { id: 'all', label: 'All Games' },
    { id: 'popular', label: 'Popular' },
    { id: 'featured', label: 'Featured' },
    { id: 'coop', label: 'Co-op Pledges' },
  ];

  const matchesByGameId = useMemo(() => {
    return activities.reduce<Record<string, MatchActivity[]>>((acc, match) => {
      acc[match.gameId] ??= [];
      acc[match.gameId].push(match);
      return acc;
    }, {});
  }, [activities]);

  const visibleGames = useMemo(() => {
    const source = activeTab === 'coop' ? games.filter((game) => matchesByGameId[game._id]?.length) : games;
    return source;
  }, [activeTab, games, matchesByGameId]);

  useEffect(() => {
    const matchId = searchParams.get('matchId');
    if (!matchId) {
      return;
    }

    const matchingActivity = activities.find((item) => item._id === matchId);
    if (matchingActivity) {
      setSelectedMatch(matchingActivity);
      setBetAmount(String(matchingActivity.minimumStakeUsd));
    }
  }, [activities, searchParams]);

  useEffect(() => {
    const message = gamesError ?? pledgesError;
    if (message) {
      toast.error(message, { title: 'Library Error' });
    }
  }, [gamesError, pledgesError, toast]);

  const handleOpenPledge = (game: Game) => {
    const match = matchesByGameId[game._id]?.[0];
    if (!match) {
      toast.info(`No live pledge activity is available for ${game.title} right now.`);
      return;
    }

    setSelectedMatch(match);
    setBetAmount(String(match.minimumStakeUsd));
  };

  const handleBet = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedMatch) {
      return;
    }

    try {
      setIsBetting(true);
      await placePledge(selectedMatch._id, Number(betAmount));
      toast.success(`Stake placed successfully for ${selectedMatch.title}.`);
      setSelectedMatch(null);
      setBetAmount('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to place stake.');
    } finally {
      setIsBetting(false);
    }
  };

  return (
    <div className="space-y-12 pb-12">
      <header className="space-y-8">
        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-accent">Discover & Play</span>
          <h1 className="text-5xl font-black tracking-tighter uppercase italic text-white">Game Library</h1>
          <p className="text-sm text-zinc-500">Games and pledge entries are now backed by the hooks and API.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-brand-primary transition-colors" size={20} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search games, categories..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-brand-primary/50 transition-all"
            />
          </div>
          <div className="flex items-center justify-center gap-3 bg-white/5 border border-white/10 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-zinc-400">
            <Filter size={18} /> Balance: ${walletData?.wallet.usdBalance.toFixed(2) ?? '0.00'}
          </div>
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
        {visibleGames.map((game, i) => {
          const primaryMatch = matchesByGameId[game._id]?.[0];
          return (
            <motion.div
              key={game._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
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
                    <Star size={12} className="text-brand-accent fill-brand-accent" /> {game.rating ?? 0}
                  </span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f0b21] via-transparent to-transparent" />
              </div>
              <div className="p-8">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em]">{game.genre}</span>
                  <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                    <Users size={14} className="text-brand-primary" /> {(game.activePlayers ?? 0).toLocaleString()}
                  </div>
                </div>
                <h3 className="mb-3 text-xl font-black text-white uppercase italic leading-tight">{game.title}</h3>
                <p className="mb-6 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  {primaryMatch ? `${primaryMatch.participants.length}/${primaryMatch.maxPlayers} players joined` : `${game.liveStreams ?? 0} live streams`}
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => handleOpenPledge(game)}
                    className="flex-1 bg-brand-primary text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-accent hover:text-black transition-all shadow-lg shadow-brand-primary/20 disabled:opacity-60"
                    disabled={!primaryMatch}
                  >
                    {primaryMatch ? `Pledge $${primaryMatch.minimumStakeUsd}` : 'No Open Pledge'}
                  </button>
                  <button
                    onClick={() => primaryMatch && handleOpenPledge(game)}
                    className="w-14 h-14 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-brand-primary/10 text-brand-primary transition-all disabled:opacity-40"
                    disabled={!primaryMatch}
                  >
                    <TrendingUp size={20} />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {!visibleGames.length && !(gamesLoading || pledgesLoading) && (
        <div className="rounded-[2rem] border border-white/10 bg-white/5 px-8 py-12 text-center text-zinc-500">
          No games matched this view.
        </div>
      )}

      <section className="bg-brand-primary/10 rounded-[3rem] p-12 border border-brand-primary/20 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
          <div className="space-y-6 text-center lg:text-left">
            <h2 className="text-4xl font-black tracking-tighter uppercase italic text-white">CO-OP CHALLENGE</h2>
            <p className="text-zinc-400 max-w-md text-sm leading-relaxed">
              Open match activity now comes from the pledge hook, so the available stake flows reflect real backend data.
            </p>
            <div className="flex flex-wrap justify-center lg:justify-start gap-6">
              <div className="flex items-center gap-3 text-xs font-black text-white uppercase tracking-widest">
                <Clock size={20} className="text-brand-primary" /> {activities[0] ? new Date(activities[0].scheduledFor).toLocaleString() : 'Awaiting next match'}
              </div>
              <div className="flex items-center gap-3 text-xs font-black text-white uppercase tracking-widest">
                <Users size={20} className="text-brand-primary" /> {activities[0]?.participants.length ?? 0} Joined
              </div>
            </div>
          </div>
          <button
            onClick={() => activities[0] ? setSelectedMatch(activities[0]) : toast.warning('No co-op challenge is open right now.')}
            className="bg-white text-black px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-brand-primary hover:text-white transition-all shadow-2xl shadow-white/5"
          >
            Join Co-op
          </button>
        </div>
      </section>

      <AnimatePresence>
        {selectedMatch && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0f0b21]/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-[#1a1635] border border-white/10 rounded-[3rem] p-10 relative shadow-2xl"
            >
              <button
                onClick={() => setSelectedMatch(null)}
                className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
              <div className="flex flex-col items-center text-center mb-10">
                <div className="w-24 h-24 rounded-3xl overflow-hidden bg-white/5 border border-white/10 mb-6 p-2">
                  <img src={`https://picsum.photos/seed/${selectedMatch.gameId}/200/200`} alt={selectedMatch.gameTitle} className="w-full h-full object-cover rounded-2xl" />
                </div>
                <h3 className="text-2xl font-black text-white uppercase italic">Stake on {selectedMatch.gameTitle}</h3>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-2">
                  Minimum stake: ${selectedMatch.minimumStakeUsd} • Prize pool: ${selectedMatch.prizePool.toLocaleString()}
                </p>
              </div>
              <form onSubmit={handleBet} className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-1">Stake Amount (USD)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-primary" size={20} />
                    <input
                      type="number"
                      min={selectedMatch.minimumStakeUsd}
                      step="0.01"
                      value={betAmount}
                      onChange={(e) => setBetAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 pl-12 pr-6 text-white font-black focus:outline-none focus:border-brand-primary/50 transition-all"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest ml-1">Backend minimum applies to this pledge.</p>
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
