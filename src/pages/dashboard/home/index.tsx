import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Play,
  Users,
  TrendingUp,
  Search,
  Coins,
  ChevronRight,
  ChevronLeft,
  Calendar,
  DollarSign,
  RefreshCcw,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useGames } from '../../../hooks/useGames';
import { usePledges } from '../../../hooks/usePledges';
import { useStream } from '../../../hooks/useStream';
import { useWallet } from '../../../hooks/useWallet';
import { useToast } from '../../../components/ToastProvider';

function formatViewers(value: number) {
  return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : `${value}`;
}

export default function Home() {
  const [search, setSearch] = useState('');
  const [activeStreamIndex, setActiveStreamIndex] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { user, isAuthenticated } = useAuth();
  const { walletData } = useWallet(isAuthenticated);
  const { featuredGames, loading: gamesLoading, error: gamesError, fetchGames, fetchFeaturedGames } = useGames({ search });
  const { activities, loading: pledgesLoading, error: pledgesError, fetchMatches } = usePledges(true);
  const { activeStreams, loading: streamsLoading, error: streamsError, fetchActiveStreams } = useStream();

  React.useEffect(() => {
    void fetchActiveStreams();
    // The stream hook returns fresh function references, so we intentionally run once on mount here.
  }, []);

  const normalizedActiveStreamIndex =
    activeStreams.length > 0 ? Math.min(activeStreamIndex, activeStreams.length - 1) : 0;
  const activeParticipationStream = user?._id
    ? activeStreams.find((stream) =>
        stream.participants.some((participant) => participant.userId === user._id),
      ) ?? null
    : null;
  const resolvedActiveStreamIndex = activeParticipationStream
    ? activeStreams.findIndex((stream) => stream._id === activeParticipationStream._id)
    : normalizedActiveStreamIndex;
  const topStream = activeStreams[resolvedActiveStreamIndex];
  const secondaryStream =
    activeStreams.length > 1 && !activeParticipationStream
      ? activeStreams[(resolvedActiveStreamIndex + 1) % activeStreams.length]
      : null;

  const displayedGames = useMemo(() => featuredGames.slice(0, 4), [featuredGames]);
  const displayedActivities = useMemo(() => activities.slice(0, 4), [activities]);

  const refreshAll = async () => {
    await Promise.all([fetchActiveStreams(), fetchMatches(), fetchGames(), fetchFeaturedGames()]);
  };

  const canBrowseStreams = activeStreams.length > 1 && !activeParticipationStream;

  const requireLogin = (message: string) => {
    toast.info(message, { title: 'Login Required' });
    navigate('/login', { state: { from: location } });
  };

  const openStream = (targetStreamId?: string | null) => {
    if (!targetStreamId) {
      return;
    }

    if (!isAuthenticated) {
      requireLogin('Log in first to watch or join a live stream.');
      return;
    }

    navigate(`/stream?streamId=${targetStreamId}`);
  };

  const showPreviousStream = () => {
    if (!canBrowseStreams) {
      return;
    }

    setActiveStreamIndex((current) =>
      current === 0 ? activeStreams.length - 1 : current - 1,
    );
  };

  const showNextStream = () => {
    if (!canBrowseStreams) {
      return;
    }

    setActiveStreamIndex((current) => (current + 1) % activeStreams.length);
  };

  return (
    <div className="space-y-12 pb-12">
      <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Gear up and game hard{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}!
          </h1>
          <p className="mt-2 text-sm text-zinc-500">Games, streams, pledges, and wallet balances are now loading from your live hooks.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-brand-primary transition-colors" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search games..."
              className="bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-6 text-sm focus:outline-none focus:border-brand-primary/50 w-full md:w-64 transition-all"
            />
          </div>
          <button
            onClick={() => void refreshAll()}
            className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <RefreshCcw size={18} className="text-zinc-400" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (!isAuthenticated) {
                requireLogin('Log in first to start a live stream.');
                return;
              }

              navigate('/stream?start=1');
            }}
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-brand-primary px-5 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-brand-accent hover:text-black"
          >
            Go Live
          </button>
          <div className="flex items-center gap-3 bg-brand-primary/10 border border-brand-primary/20 px-4 py-2.5 rounded-2xl">
            <div className="w-6 h-6 bg-brand-primary rounded-lg flex items-center justify-center">
              <Coins size={14} className="text-white" />
            </div>
            <span className="text-sm font-black text-white">
              {(walletData?.wallet.igcBalance ?? 0).toLocaleString()} <span className="text-brand-primary">IGC</span>
            </span>
          </div>
        </div>
      </header>

      {(gamesError || pledgesError || streamsError) && (
        <div className="rounded-[2rem] border border-rose-500/20 bg-rose-500/10 px-6 py-4 text-sm text-rose-200">
          {streamsError ?? pledgesError ?? gamesError}
        </div>
      )}

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black uppercase tracking-widest text-white italic">Ongoing Streams</h2>
          <div className="flex items-center gap-3">
            {topStream && (
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-300">
                {activeStreams.length > 1
                  ? `${resolvedActiveStreamIndex + 1} of ${activeStreams.length}`
                  : '1 live'}
              </span>
            )}
            {canBrowseStreams && (
              <div className="flex gap-2">
                <button
                  onClick={showPreviousStream}
                  aria-label="Show previous ongoing stream"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition-colors hover:bg-white/10"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={showNextStream}
                  aria-label="Show next ongoing stream"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition-colors hover:bg-white/10"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>
        </div>

        {!topStream ? (
          <div className="rounded-[2.5rem] border border-white/10 bg-white/5 px-8 py-16 text-center text-zinc-500">
            {streamsLoading ? 'Loading active streams...' : 'No active streams right now.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-9 relative group rounded-[2.5rem] overflow-hidden border border-white/10 aspect-video lg:aspect-auto lg:h-[400px]">
              <img
                src={topStream.participants[0]?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${topStream.participants[0]?.username ?? topStream.title}`}
                alt={topStream.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              <div className="absolute top-6 left-6 flex flex-col gap-4">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-xl inline-flex items-center gap-2">
                  <span className="text-xs font-black text-white uppercase tracking-widest">{topStream.title}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border-2 border-brand-primary overflow-hidden">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${topStream.participants[0]?.username ?? topStream.title}`} alt="Streamer" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{topStream.participants[0]?.username ?? 'Live Host'}</p>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest flex items-center gap-1">
                      <Users size={10} /> {formatViewers(topStream.viewersCount)} viewers
                    </p>
                  </div>
                </div>
              </div>

              <div className="absolute top-6 right-6">
                <span className="bg-rose-500 text-white text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg shadow-rose-500/20">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE
                </span>
              </div>

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <button
                    type="button"
                    onClick={() => openStream(topStream?._id)}
                    className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-primary text-white shadow-2xl shadow-brand-primary/40 transition-transform hover:scale-110 group-hover:bg-brand-accent group-hover:text-black"
                  >
                    <Play size={32} className="fill-current ml-1" />
                  </button>
                  <div className="flex flex-wrap items-center justify-center gap-3 px-4">
                    <button
                      type="button"
                      onClick={() => openStream(topStream?._id)}
                      className="rounded-full border border-white/15 bg-black/35 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white backdrop-blur-md transition-colors hover:bg-white/15"
                    >
                      Watch This Stream
                    </button>
                    {canBrowseStreams && (
                      <button
                        onClick={showNextStream}
                        className="rounded-full border border-white/15 bg-black/35 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white backdrop-blur-md transition-colors hover:bg-white/15"
                      >
                        Next Live
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {secondaryStream && (
              <button
                type="button"
                onClick={() => openStream(secondaryStream._id)}
                className="lg:col-span-3 hidden lg:block relative rounded-[2.5rem] overflow-hidden border border-white/10 transition-transform hover:-translate-y-1"
              >
                <img
                  src={secondaryStream.participants[0]?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${secondaryStream.participants[0]?.username ?? secondaryStream.title}`}
                  alt={secondaryStream.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-40 grayscale"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-l from-rose-500/20 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <p className="text-xs font-black text-white uppercase tracking-widest mb-2">{secondaryStream.title}</p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full border border-white/20 overflow-hidden">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${secondaryStream.participants[0]?.username ?? secondaryStream.title}`} alt="Streamer" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-zinc-400">{secondaryStream.participants[0]?.username ?? 'Live Host'}</p>
                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/80">Open This Live</p>
                    </div>
                  </div>
                </div>
              </button>
            )}
          </div>
        )}
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black uppercase tracking-widest text-white italic">Pledging Activities</h2>
          <Link to="/library" className="text-brand-primary text-xs font-bold uppercase tracking-widest hover:text-brand-accent transition-colors">View All</Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayedActivities.map((activity) => (
            <motion.div
              key={activity._id}
              whileHover={{ y: -5 }}
              className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden group"
            >
              <div className="relative aspect-square">
                <img
                  src={`https://picsum.photos/seed/${activity.gameId}/500/500`}
                  alt={activity.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f0b21] via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-xl">
                  <div className="w-6 h-6 rounded-full overflow-hidden border border-brand-primary">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${activity.hostUsername}`} alt={activity.hostUsername} />
                  </div>
                  <span className="text-[10px] font-bold text-white">{activity.hostUsername}</span>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <h3 className="font-black text-white text-sm uppercase leading-tight">{activity.title}</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    <Calendar size={12} className="text-brand-primary" /> Until {new Date(activity.scheduledFor).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    <TrendingUp size={12} className="text-brand-primary" /> {activity.mode}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    <DollarSign size={12} className="text-brand-accent" /> Prize Pool: <span className="text-white">${activity.prizePool.toLocaleString()}</span>
                  </div>
                </div>
                <Link to={`/library?matchId=${activity._id}`} className="block w-full bg-brand-primary text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-brand-accent hover:text-black transition-all shadow-lg shadow-brand-primary/20 text-center">
                  Pledge With Us
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {!displayedActivities.length && !pledgesLoading && (
          <div className="rounded-[2rem] border border-white/10 bg-white/5 px-8 py-12 text-center text-zinc-500">
            No pledge activities available.
          </div>
        )}
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black uppercase tracking-widest text-white italic">Favorite Games</h2>
          <Link to="/library" className="text-brand-primary text-xs font-bold uppercase tracking-widest hover:text-brand-accent transition-colors">View All</Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayedGames.map((game) => (
            <motion.div
              key={game._id}
              whileHover={{ y: -5 }}
              className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden group"
            >
              <div className="relative aspect-square">
                <img
                  src={game.thumbnail}
                  alt={game.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f0b21] via-transparent to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => requireLogin('Log in first to open and play games.')}
                    className="w-12 h-12 bg-brand-primary rounded-full flex items-center justify-center shadow-xl"
                  >
                    <Play size={20} className="text-white fill-current ml-1" />
                  </button>
                </div>
                <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-xl">
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest">{game.genre}</span>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <h3 className="font-black text-white text-sm uppercase leading-tight">{game.title}</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    <Users size={12} className="text-brand-primary" /> {game.activePlayers.toLocaleString()} Active
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    <TrendingUp size={12} className="text-brand-primary" /> {game.liveStreams} Live Streams
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => requireLogin('Log in first to open and play games.')}
                  className="block w-full bg-white/5 border border-white/10 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-brand-primary transition-all text-center"
                >
                  View Game
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {!displayedGames.length && !gamesLoading && (
          <div className="rounded-[2rem] border border-white/10 bg-white/5 px-8 py-12 text-center text-zinc-500">
            No games matched your current search.
          </div>
        )}
      </section>
    </div>
  );
}
