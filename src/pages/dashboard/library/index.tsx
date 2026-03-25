import React, { useEffect, useMemo, useState } from 'react';
import { Search, Filter, Users, Star, Clock, TrendingUp, X, DollarSign, PlusCircle, Swords, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSearchParams } from 'react-router-dom';
import { useGames, type Game } from '../../../hooks/useGames';
import { usePledges, type MatchActivity } from '../../../hooks/usePledges';
import { useWallet } from '../../../hooks/useWallet';
import { useToast } from '../../../components/ToastProvider';
import { useAuth } from '../../../hooks/useAuth';

type PledgeMode = 'join' | 'create';

export default function GameLibrary() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedMatch, setSelectedMatch] = useState<MatchActivity | null>(null);
  const [selectedGameForCreate, setSelectedGameForCreate] = useState<Game | null>(null);
  const [pledgeMode, setPledgeMode] = useState<PledgeMode>('join');
  const [betAmount, setBetAmount] = useState('');
  const [isBetting, setIsBetting] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    scheduledFor: '',
    minimumStakeUsd: '10',
    maxPlayers: '2',
  });
  const toast = useToast();
  const { user } = useAuth();

  const { games, loading: gamesLoading, error: gamesError } = useGames({
    search,
    popular: activeTab === 'popular' ? true : undefined,
    featured: activeTab === 'featured' ? true : undefined,
  });
  const {
    activities,
    loading: pledgesLoading,
    error: pledgesError,
    joinMatch,
    createMatch,
    fetchMatches,
  } = usePledges(true);
  const { walletData } = useWallet(true);

  const tabs = [
    { id: 'all', label: 'All Games' },
    { id: 'popular', label: 'Popular' },
    { id: 'featured', label: 'Featured' },
    { id: 'active', label: 'Active Pledges' },
  ];

  const matchesByGameId = useMemo(() => {
    return activities.reduce<Record<string, MatchActivity[]>>((acc, match) => {
      acc[match.gameId] ??= [];
      acc[match.gameId].push(match);
      return acc;
    }, {});
  }, [activities]);

  const visibleGames = useMemo(() => {
    if (activeTab === 'active') {
      return games.filter((game) => matchesByGameId[game._id]?.length);
    }

    return games;
  }, [activeTab, games, matchesByGameId]);

  useEffect(() => {
    const matchId = searchParams.get('matchId');
    if (!matchId) {
      return;
    }

    const matchingActivity = activities.find((item) => item._id === matchId);
    if (matchingActivity) {
      openJoinPledge(matchingActivity);
    }
  }, [activities, searchParams]);

  useEffect(() => {
    const message = gamesError ?? pledgesError;
    if (message) {
      toast.error(message, { title: 'Library Error' });
    }
  }, [gamesError, pledgesError, toast]);

  useEffect(() => {
    const isModalOpen = Boolean(selectedMatch || selectedGameForCreate);
    const dashboardScroller = document.querySelector<HTMLElement>('[data-dashboard-scroll]');
    const previousBodyOverflow = document.body.style.overflow;
    const previousScrollerOverflow = dashboardScroller?.style.overflow;

    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
      if (dashboardScroller) {
        dashboardScroller.style.overflow = 'hidden';
      }
    }

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      if (dashboardScroller && previousScrollerOverflow !== undefined) {
        dashboardScroller.style.overflow = previousScrollerOverflow;
      }
    };
  }, [selectedGameForCreate, selectedMatch]);

  const clearMatchQuery = () => {
    if (searchParams.get('matchId')) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('matchId');
      setSearchParams(nextParams, { replace: true });
    }
  };

  const closePledgeModal = () => {
    setSelectedMatch(null);
    setSelectedGameForCreate(null);
    setBetAmount('');
    setPledgeMode('join');
    clearMatchQuery();
  };

  const openJoinPledge = (match: MatchActivity) => {
    if (isOwnMatch(match)) {
      toast.info('Use the notification bell to accept or reject join requests for your pledge.', {
        title: 'Manage Your Pledge',
      });
      return;
    }

    setPledgeMode('join');
    setSelectedMatch(match);
    setSelectedGameForCreate(null);
    setBetAmount(String(match.minimumStakeUsd));
  };

  const openCreatePledge = (game: Game) => {
    const defaultDate = new Date(Date.now() + 60 * 60 * 1000);
    setPledgeMode('create');
    setSelectedGameForCreate(game);
    setSelectedMatch(null);
    setCreateForm({
      title: `${game.title} Live Challenge`,
      scheduledFor: defaultDate.toISOString().slice(0, 16),
      minimumStakeUsd: '10',
      maxPlayers: '2',
    });
  };

  const isOwnMatch = (match: MatchActivity) => Boolean(user?._id && match.hostUserId === user._id);

  const handleOpenPledge = (game: Game) => {
    const match = matchesByGameId[game._id]?.find((item) => item.status === 'open');
    if (match) {
      if (isOwnMatch(match)) {
        toast.info('Use the notification bell to manage requests for your pledge.', {
          title: 'Manage Your Pledge',
        });
        return;
      }

      openJoinPledge(match);
      return;
    }

    openCreatePledge(game);
  };

  const handleBet = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedMatch || !user?._id) {
      return;
    }

    try {
      setIsBetting(true);
      await joinMatch(selectedMatch._id, Number(betAmount));
      toast.success(`Join request sent for ${selectedMatch.title}. Wait for the host to respond.`);
      closePledgeModal();
    } catch (err: any) {
      if (err?.response?.status === 404) {
        await fetchMatches();
        closePledgeModal();
        toast.error('That pledge is no longer available. The list has been refreshed.');
      } else {
        toast.error(err?.response?.data?.message ?? 'Unable to place stake.');
      }
    } finally {
      setIsBetting(false);
    }
  };

  const handleCreatePledge = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedGameForCreate) {
      return;
    }

    try {
      setIsBetting(true);
      await createMatch({
        gameId: selectedGameForCreate._id,
        title: createForm.title.trim(),
        scheduledFor: new Date(createForm.scheduledFor).toISOString(),
        minimumStakeUsd: Number(createForm.minimumStakeUsd),
        maxPlayers: Number(createForm.maxPlayers),
      });
      toast.success('Pledge created. Other players can now join you live.');
      closePledgeModal();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to create pledge.');
    } finally {
      setIsBetting(false);
    }
  };

  const activeOpenActivities = activities.filter((activity) => activity.status === 'open');

  return (
    <div className="space-y-12 pb-12">
      <header className="space-y-8">
        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-accent">Discover & Play</span>
          <h1 className="text-5xl font-black tracking-tighter uppercase italic text-white">Game Library</h1>
          <p className="text-sm text-zinc-500">Start a pledge if none exists, or join an active one and play live with other users.</p>
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

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-white uppercase italic">Active Pledges</h2>
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
            {activeOpenActivities.length} open
          </span>
        </div>

        {activeOpenActivities.length ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {activeOpenActivities.slice(0, 6).map((activity) => (
              <div key={activity._id} className="rounded-[2.5rem] border border-white/10 bg-white/5 p-8 space-y-5">
                <div className="flex items-center justify-between gap-4">
                  <span className="rounded-full bg-brand-primary/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary">
                    {activity.mode}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    {activity.participants.length}/{activity.maxPlayers} players
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase italic text-white">{activity.gameTitle}</h3>
                  <p className="mt-2 text-sm text-zinc-400">{activity.title}</p>
                </div>
                <div className="space-y-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  <div className="flex items-center gap-2">
                    <Calendar size={12} className="text-brand-primary" />
                    {new Date(activity.scheduledFor).toLocaleString()}
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign size={12} className="text-brand-accent" />
                    Minimum ${activity.minimumStakeUsd} • Pool ${activity.prizePool.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={12} className="text-brand-primary" />
                    Host: {activity.hostUsername}
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (isOwnMatch(activity)) {
                      toast.info('Use the notification bell to manage requests for your pledge.', {
                        title: 'Manage Your Pledge',
                      });
                      return;
                    }

                    openJoinPledge(activity);
                  }}
                  disabled={isOwnMatch(activity)}
                  className="w-full rounded-2xl bg-brand-primary px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-brand-accent hover:text-black disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-brand-primary disabled:hover:text-white"
                >
                  {isOwnMatch(activity) ? 'Your Pledge' : 'Join Active Pledge'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[3rem] border border-white/10 bg-white/5 px-8 py-12 text-center text-zinc-500">
            No open pledges yet. Pick a game below and start one.
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {visibleGames.map((game, i) => {
          const primaryMatch = matchesByGameId[game._id]?.find((item) => item.status === 'open');
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
                  {primaryMatch
                    ? `${primaryMatch.participants.length}/${primaryMatch.maxPlayers} players ready to go live`
                    : 'No active pledge yet. Start one now.'}
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => handleOpenPledge(game)}
                    className="flex-1 bg-brand-primary text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-accent hover:text-black transition-all shadow-lg shadow-brand-primary/20"
                  >
                    {primaryMatch ? (isOwnMatch(primaryMatch) ? 'Your Pledge' : 'Join Pledge') : 'Start Pledge'}
                  </button>
                  <button
                    onClick={() => {
                      if (!primaryMatch) {
                        openCreatePledge(game);
                        return;
                      }

                      if (isOwnMatch(primaryMatch)) {
                        toast.info('Use the notification bell to manage requests for your pledge.', {
                          title: 'Manage Your Pledge',
                        });
                        return;
                      }

                      openJoinPledge(primaryMatch);
                    }}
                    className="w-14 h-14 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-brand-primary/10 text-brand-primary transition-all"
                  >
                    {primaryMatch ? <Swords size={20} /> : <PlusCircle size={20} />}
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

      <AnimatePresence>
        {(selectedMatch || selectedGameForCreate) && (
          <div className="fixed inset-0 z-[100] overflow-hidden bg-[#0f0b21]/90 p-4 backdrop-blur-md sm:p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative mx-auto my-0 flex h-full w-full max-w-md flex-col overflow-y-auto rounded-[3rem] border border-white/10 bg-[#1a1635] p-6 shadow-2xl sm:max-h-[calc(100vh-3rem)] sm:h-auto sm:my-6 sm:p-10"
            >
              <button onClick={closePledgeModal} className="absolute right-6 top-6 text-zinc-500 transition-colors hover:text-white sm:right-8 sm:top-8">
                <X size={24} />
              </button>

              {pledgeMode === 'join' && selectedMatch && (
                <>
                  <div className="flex flex-col items-center text-center mb-10">
                    <div className="w-24 h-24 rounded-3xl overflow-hidden bg-white/5 border border-white/10 mb-6 p-2">
                      <img src={`https://picsum.photos/seed/${selectedMatch.gameId}/200/200`} alt={selectedMatch.gameTitle} className="w-full h-full object-cover rounded-2xl" />
                    </div>
                    <h3 className="text-2xl font-black text-white uppercase italic">Join {selectedMatch.gameTitle}</h3>
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-2">
                      Hosted by {selectedMatch.hostUsername} • {selectedMatch.participants.length}/{selectedMatch.maxPlayers} players
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
                      <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest ml-1">
                        Minimum ${selectedMatch.minimumStakeUsd} • Pool ${selectedMatch.prizePool.toLocaleString()}
                      </p>
                    </div>
                    <button type="submit" disabled={isBetting} className="w-full bg-brand-primary text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-brand-accent hover:text-black transition-all disabled:opacity-50 shadow-lg shadow-brand-primary/20">
                      {isBetting ? 'Sending...' : 'Request To Join'}
                    </button>
                  </form>
                </>
              )}

              {pledgeMode === 'create' && selectedGameForCreate && (
                <>
                  <div className="flex flex-col items-center text-center mb-10">
                    <div className="w-24 h-24 rounded-3xl overflow-hidden bg-white/5 border border-white/10 mb-6 p-2">
                      <img src={selectedGameForCreate.thumbnail} alt={selectedGameForCreate.title} className="w-full h-full object-cover rounded-2xl" />
                    </div>
                    <h3 className="text-2xl font-black text-white uppercase italic">Start {selectedGameForCreate.title}</h3>
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-2">
                      Create a live pledge so other players can join you.
                    </p>
                  </div>
                  <form onSubmit={handleCreatePledge} className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-1">Pledge Title</label>
                      <input
                        value={createForm.title}
                        onChange={(e) => setCreateForm((current) => ({ ...current, title: e.target.value }))}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-white font-black focus:outline-none focus:border-brand-primary/50 transition-all"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-1">Start Time</label>
                      <input
                        type="datetime-local"
                        value={createForm.scheduledFor}
                        onChange={(e) => setCreateForm((current) => ({ ...current, scheduledFor: e.target.value }))}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-white font-black focus:outline-none focus:border-brand-primary/50 transition-all"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-1">Min Stake</label>
                        <input
                          type="number"
                          min="1"
                          step="0.01"
                          value={createForm.minimumStakeUsd}
                          onChange={(e) => setCreateForm((current) => ({ ...current, minimumStakeUsd: e.target.value }))}
                          className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-white font-black focus:outline-none focus:border-brand-primary/50 transition-all"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-1">Players</label>
                        <input
                          type="number"
                          min="2"
                          max="2"
                          value={createForm.maxPlayers}
                          readOnly
                          disabled
                          className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-white/70 font-black transition-all cursor-not-allowed"
                          required
                        />
                      </div>
                    </div>
                    <button type="submit" disabled={isBetting} className="w-full bg-brand-primary text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-brand-accent hover:text-black transition-all disabled:opacity-50 shadow-lg shadow-brand-primary/20">
                      {isBetting ? 'Creating...' : 'Create Pledge'}
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
