import React, { useEffect, useState } from 'react';
import { ArrowLeft, Trophy, Play, Users, Circle, MoreVertical, ChevronRight, Video, CalendarClock, Trash2, Radio } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CommunityVideoPlayer } from '../../../components/CommunityVideoPlayer';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../components/ToastProvider';
import { useGames } from '../../../hooks/useGames';
import { useStream, type Stream } from '../../../hooks/useStream';

export default function History() {
  const { user } = useAuth();
  const toast = useToast();
  const { featuredGames } = useGames({ featured: true });
  const { activeStreams, fetchActiveStreams, fetchMyRecordings, deleteRecording } = useStream();
  const [recordings, setRecordings] = useState<Stream[]>([]);
  const [deletingRecordingId, setDeletingRecordingId] = useState<string | null>(null);

  useEffect(() => {
    void fetchActiveStreams();
    void fetchMyRecordings().then(setRecordings).catch(() => setRecordings([]));
    // The stream hook recreates helpers on render, so this initial fetch is mount-only by design.
  }, []);

  const featuredGame = featuredGames[0];
  const activeParticipationStream = user?._id
    ? activeStreams.find((stream) =>
        stream.participants.some((participant) => participant.userId === user._id),
      ) ?? null
    : null;
  const formatRecordingDuration = (seconds?: number) => {
    const total = Math.max(0, seconds ?? 0);
    const hrs = Math.floor(total / 3600);
    const mins = Math.floor((total % 3600) / 60);
    const secs = total % 60;

    if (hrs > 0) {
      return [hrs, mins, secs].map((value) => String(value).padStart(2, '0')).join(':');
    }

    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleDeleteRecording = async (recording: Stream) => {
    const confirmed = window.confirm(`Delete "${recording.title}" from your recorded streams?`);
    if (!confirmed) {
      return;
    }

    try {
      setDeletingRecordingId(recording._id);
      await deleteRecording(recording._id);
      setRecordings((current) => current.filter((entry) => entry._id !== recording._id));
      toast.success('Recorded stream deleted.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to delete recorded stream.');
    } finally {
      setDeletingRecordingId(null);
    }
  };

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
          {activeParticipationStream ? (
            <Link
              to={`/stream?streamId=${activeParticipationStream._id}`}
              className="bg-[#1a1635]/85 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] flex flex-col items-center gap-4 shadow-2xl transition-transform hover:scale-[1.02]"
            >
              <div className="relative w-16 h-16 flex items-center justify-center">
                <Circle size={64} className="text-brand-primary/20 absolute" strokeWidth={4} />
                <Circle size={64} className="text-brand-primary absolute" strokeWidth={4} strokeDasharray="100 200" />
                <Radio size={22} className="text-white" />
              </div>
              <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Resume Live</span>
            </Link>
          ) : (
            <div className="bg-[#1a1635]/80 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] flex flex-col items-center gap-4 shadow-2xl">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <Circle size={64} className="text-brand-primary/20 absolute" strokeWidth={4} />
                <Circle size={64} className="text-brand-primary absolute" strokeWidth={4} strokeDasharray="100 200" />
                <Play size={24} className="text-white fill-current ml-1" />
              </div>
              <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Resume Playing</span>
            </div>
          )}
        </div>

        <div className="absolute bottom-10 left-10 right-10 flex flex-col gap-4">
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
            <div className="h-full w-1/3 bg-brand-accent rounded-full" />
          </div>
          <div className="flex items-center justify-between text-[10px] font-black text-zinc-400 uppercase tracking-widest">
            <div className="flex items-center gap-6">
              <Play size={16} className="text-white fill-current" />
              <span>
                {activeParticipationStream
                  ? `${activeParticipationStream.title} / ${activeParticipationStream.participants[0]?.username ?? 'Live Host'}`
                  : `${featuredGame?.genre ?? 'Game'} / ${featuredGame?.publisher ?? 'Publisher'}`}
              </span>
            </div>
            <MoreVertical size={16} />
          </div>
        </div>
      </div>

      <section className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.32em] text-brand-accent">History Vault</p>
            <h2 className="mt-2 text-lg font-black uppercase italic tracking-[0.12em] text-white sm:text-xl">Recorded Streams</h2>
          </div>
          <p className="max-w-md text-xs leading-relaxed text-zinc-500 sm:text-sm">
            Rewatch saved broadcasts with cleaner playback controls and compact recording details.
          </p>
        </div>
        {recordings.length ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {recordings.map((recording) => (
              <article key={recording._id} className="group overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] shadow-xl shadow-black/20">
                <div className="relative aspect-video overflow-hidden">
                  <CommunityVideoPlayer
                    src={recording.recordingUrl}
                    className="h-full w-full rounded-none bg-black"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0f0b21]/90 via-transparent to-transparent" />
                  <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 rounded-full border border-white/10 bg-black/55 px-3 py-1.5 backdrop-blur-md sm:left-4 sm:top-4">
                    <Video size={12} className="text-brand-primary" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-white">Recorded</span>
                  </div>
                  <div className="pointer-events-none absolute bottom-3 right-3 rounded-full border border-white/10 bg-black/55 px-3 py-1 text-[8px] font-black uppercase tracking-[0.2em] text-zinc-100 backdrop-blur-md sm:bottom-4 sm:right-4">
                    {formatRecordingDuration(recording.recordingDurationSeconds)}
                  </div>
                </div>
                <div className="space-y-4 p-4 sm:p-5">
                  <div className="space-y-2">
                    <h3 className="text-sm font-black uppercase italic leading-snug text-white sm:text-base">
                      {recording.title}
                    </h3>
                    <p className="text-xs leading-relaxed text-zinc-400">
                      Replay a saved live session with the original stream audio and timeline controls.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-300">
                      <CalendarClock size={12} className="text-brand-primary" />
                      {recording.recordedAt ? new Date(recording.recordedAt).toLocaleDateString() : 'Saved stream'}
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-300">
                      <Play size={12} className="text-brand-accent fill-current" />
                      {formatRecordingDuration(recording.recordingDurationSeconds)}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => void handleDeleteRecording(recording)}
                      disabled={deletingRecordingId === recording._id}
                      className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-red-200 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                    >
                      <Trash2 size={12} />
                      {deletingRecordingId === recording._id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </article>
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
