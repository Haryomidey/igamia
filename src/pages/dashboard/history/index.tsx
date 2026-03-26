import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Trophy, Play, Users, ChevronRight, Calendar, Clock, Trash2, Pause, Volume2, Maximize2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '../../../components/ToastProvider';
import { useGames } from '../../../hooks/useGames';
import { useStream, type Stream } from '../../../hooks/useStream';
import { cn } from '../../../lib/utils';

type RecordingVideo = {
  id: string;
  title: string;
  recordingUrl?: string;
  thumbnail: string;
  duration: string;
  recordedAt: string;
  description: string;
};

function formatClockTime(totalSeconds: number) {
  const safeSeconds = Number.isFinite(totalSeconds) ? Math.max(0, Math.floor(totalSeconds)) : 0;
  const hrs = Math.floor(safeSeconds / 3600);
  const mins = Math.floor((safeSeconds % 3600) / 60);
  const secs = safeSeconds % 60;

  if (hrs > 0) {
    return [hrs, mins, secs].map((value) => String(value).padStart(2, '0')).join(':');
  }

  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

const VideoCard = ({
  video,
  onDelete,
  isDeleting,
}: {
  video: RecordingVideo;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState('00:00');
  const [runtime, setRuntime] = useState(video.duration);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const element = videoRef.current;
    if (!element) {
      return;
    }

    const updateProgress = () => {
      const duration = Number.isFinite(element.duration) ? element.duration : 0;
      const current = Number.isFinite(element.currentTime) ? element.currentTime : 0;
      setProgress(duration > 0 ? (current / duration) * 100 : 0);
      setCurrentTime(formatClockTime(current));
    };

    const updateDuration = () => {
      const duration = Number.isFinite(element.duration) ? element.duration : 0;
      setRuntime(duration > 0 ? formatClockTime(duration) : video.duration);
    };

    const handlePause = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);

    element.addEventListener('timeupdate', updateProgress);
    element.addEventListener('loadedmetadata', updateDuration);
    element.addEventListener('durationchange', updateDuration);
    element.addEventListener('pause', handlePause);
    element.addEventListener('play', handlePlay);
    updateProgress();
    updateDuration();

    return () => {
      element.removeEventListener('timeupdate', updateProgress);
      element.removeEventListener('loadedmetadata', updateDuration);
      element.removeEventListener('durationchange', updateDuration);
      element.removeEventListener('pause', handlePause);
      element.removeEventListener('play', handlePlay);
    };
  }, [video.duration, video.recordingUrl]);

  const togglePlayback = () => {
    const element = videoRef.current;
    if (!element) {
      return;
    }

    if (element.paused) {
      void element.play();
      return;
    }

    element.pause();
  };

  const openFullscreen = async () => {
    const element = videoRef.current;
    if (!element) {
      return;
    }

    if (document.fullscreenElement === element) {
      await document.exitFullscreen().catch(() => undefined);
      return;
    }

    await element.requestFullscreen().catch(() => undefined);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative overflow-hidden rounded-[2rem] border border-white/5 bg-zinc-900/40 shadow-2xl backdrop-blur-xl transition-all duration-500 hover:border-white/20"
    >
      <div className="relative aspect-video overflow-hidden">
        {video.recordingUrl ? (
          <video
            ref={videoRef}
            src={video.recordingUrl}
            poster={video.thumbnail}
            preload="metadata"
            playsInline
            className={cn(
              'h-full w-full object-cover transition-transform duration-1000 ease-out',
              isPlaying ? 'scale-110' : 'scale-100 group-hover:scale-105',
            )}
          />
        ) : (
          <img
            src={video.thumbnail}
            alt={video.title}
            className={cn(
              'h-full w-full object-cover transition-transform duration-1000 ease-out',
              isPlaying ? 'scale-110' : 'scale-100 group-hover:scale-105',
            )}
            referrerPolicy="no-referrer"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 transition-opacity duration-500 group-hover:opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        <div className="absolute inset-x-0 bottom-0 translate-y-4 p-6 opacity-0 transition-all duration-500 ease-out group-hover:translate-y-0 group-hover:opacity-100">
          <div className="flex flex-col gap-4">
            <div className="group/progress relative h-1.5 w-full cursor-pointer overflow-hidden rounded-full bg-white/10">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
              <div className="absolute inset-0 bg-white/5 opacity-0 transition-opacity group-hover/progress:opacity-100" />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-5">
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    togglePlayback();
                  }}
                  className="text-white transition-all duration-200 hover:scale-125 active:scale-95"
                >
                  {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
                </button>
                <div className="flex items-center gap-3">
                  <Volume2 size={18} className="cursor-pointer text-white/60 transition-colors hover:text-white" />
                  <span className="font-mono text-[10px] tracking-[0.2em] text-white/80 tabular-nums">
                    {currentTime} <span className="mx-1 text-white/20">/</span> {runtime}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    void openFullscreen();
                  }}
                  title="Open full screen"
                  aria-label="Open full screen"
                  className="text-white/40 transition-colors hover:text-white"
                >
                  <Maximize2 size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.button
              initial={false}
              animate={{ scale: isPlaying ? 0.8 : 1, opacity: isPlaying ? 0 : 1 }}
              onClick={(event) => {
                event.stopPropagation();
                togglePlayback();
              }}
              type="button"
              className="flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-2xl backdrop-blur-2xl"
            >
              <Play size={28} fill="currentColor" className="ml-1" />
            </motion.button>
          </div>
        )}

        <div className="absolute left-4 top-4 flex gap-2">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1 backdrop-blur-md">
            <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white">Recorded</span>
          </div>
        </div>
      </div>

      <div className="p-8">
        <div className="mb-4 flex items-start justify-between">
          <div className="min-w-0 flex-1 pr-4">
            <h3 className="mb-2 truncate text-xl font-bold leading-tight text-white transition-colors group-hover:text-white">
              {video.title}
            </h3>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-white/20" />
                <span>{video.recordedAt}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-white/20" />
                <span>{video.duration}</span>
              </div>
            </div>
          </div>
          <button
            onClick={(event) => {
              event.stopPropagation();
              onDelete(video.id);
            }}
            disabled={isDeleting}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-white/20 transition-all duration-300 hover:bg-red-500/10 hover:text-red-500 active:scale-90"
          >
            <span className="text-[9px] font-black uppercase tracking-[0.12em] text-inherit">
              {isDeleting ? '...' : ''}
            </span>
            {!isDeleting && <Trash2 size={20} />}
          </button>
        </div>

        <p className="line-clamp-2 text-sm font-medium leading-relaxed text-white/50">
          {video.description}
        </p>
        {isDeleting && (
          <p className="mt-4 text-[10px] font-black uppercase tracking-[0.16em] text-rose-300">
            Deleting...
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default function History() {
  const toast = useToast();
  const { featuredGames } = useGames({ featured: true });
  const { activeStreams, fetchActiveStreams, fetchMyRecordings, deleteRecording } = useStream();
  const [recordings, setRecordings] = useState<Stream[]>([]);
  const [deletingRecordingId, setDeletingRecordingId] = useState<string | null>(null);
  const featuredGame = featuredGames[0];

  useEffect(() => {
    void fetchActiveStreams();
    void fetchMyRecordings().then(setRecordings).catch(() => setRecordings([]));
    // The stream hook recreates helpers on render, so this initial fetch is mount-only by design.
  }, []);

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

  const handleDeleteRecording = async (recordingId: string, recordingTitle: string) => {
    const confirmed = window.confirm(`Delete "${recordingTitle}" from your recorded streams?`);
    if (!confirmed) {
      return;
    }

    try {
      setDeletingRecordingId(recordingId);
      await deleteRecording(recordingId);
      setRecordings((current) => current.filter((entry) => entry._id !== recordingId));
      toast.success('Recorded stream deleted.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to delete media.');
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
              <VideoCard
                key={recording._id}
                video={{
                  id: recording._id,
                  title: recording.title,
                  recordingUrl: recording.recordingUrl,
                  thumbnail: `https://picsum.photos/seed/${recording._id}/900/600`,
                  duration: formatRecordingDuration(recording.recordingDurationSeconds),
                  recordedAt: recording.recordedAt ? new Date(recording.recordedAt).toLocaleDateString() : 'Saved stream',
                  description: 'Replay a saved live session with the original stream audio and timeline controls.',
                }}
                isDeleting={deletingRecordingId === recording._id}
                onDelete={(recordingId) => {
                  if (deletingRecordingId === recordingId) {
                    return;
                  }

                  void handleDeleteRecording(recordingId, recording.title);
                }}
              />
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
