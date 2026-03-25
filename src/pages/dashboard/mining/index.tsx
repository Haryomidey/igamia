import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Coins, Lock, PlayCircle, RefreshCcw, Timer, X } from 'lucide-react';
import { useToast } from '../../../components/ToastProvider';
import { useAuth } from '../../../hooks/useAuth';
import { useWallet } from '../../../hooks/useWallet';
import { useWatchEarn, type WatchEarnVideo } from '../../../hooks/useWatchEarn';

function formatCountdown(totalMs: number) {
  if (totalMs <= 0) {
    return '00:00:00';
  }

  const totalSeconds = Math.floor(totalMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
}

function formatUtcResetCountdown(nowMs: number) {
  const now = new Date(nowMs);
  const nextReset = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0,
    0,
    0,
    0,
  );

  return formatCountdown(nextReset - nowMs);
}

function formatUnlockTime(isoDate: string | null) {
  if (!isoDate) {
    return null;
  }

  return new Date(isoDate).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatIntervalLabel(totalMinutes: number) {
  if (totalMinutes % 60 === 0) {
    const hours = totalMinutes / 60;
    return `${hours} hour${hours === 1 ? '' : 's'}`;
  }

  return `${totalMinutes} minutes`;
}

export default function Mining() {
  const { user } = useAuth();
  const { watchEarn, loading, error, startVideo, completeVideo, fetchTodayVideos } = useWatchEarn(true);
  const { walletData, fetchWallet } = useWallet(true);
  const toast = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [startingId, setStartingId] = useState<string | null>(null);
  const [playerVideo, setPlayerVideo] = useState<WatchEarnVideo | null>(null);
  const [watchedToEnd, setWatchedToEnd] = useState<Record<string, boolean>>({});
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    if (!error) {
      return;
    }

    toast.error(error, { title: 'Video Rewards Error' });
  }, [error, toast]);

  useEffect(() => {
    if (!watchEarn?.serverTime) {
      return;
    }

    setNowMs(new Date(watchEarn.serverTime).getTime());
  }, [watchEarn?.serverTime]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    setWatchedToEnd({});
    setPlayerVideo(null);
    setProcessingId(null);
    setStartingId(null);
  }, [user?._id]);

  const activeVideo = useMemo(
    () => watchEarn?.videos.find((video) => !video.completed && video.unlocked) ?? null,
    [watchEarn?.videos],
  );

  const nextUnlockMs = watchEarn?.nextVideoAvailableAt
    ? Math.max(new Date(watchEarn.nextVideoAvailableAt).getTime() - nowMs, 0)
    : 0;

  const handleRefresh = async () => {
    await Promise.all([fetchTodayVideos(), fetchWallet()]);
  };

  const handleComplete = async (video: WatchEarnVideo) => {
    try {
      setProcessingId(video._id);
      const result = await completeVideo(video._id);
      await fetchWallet();
      setWatchedToEnd((current) => ({ ...current, [video._id]: false }));
      setPlayerVideo(null);
      toast.success(result?.message ?? 'Reward credited.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to claim this video reward.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenVideo = async (video: WatchEarnVideo) => {
    try {
      setStartingId(video._id);
      await startVideo(video._id);
      setWatchedToEnd((current) => ({ ...current, [video._id]: false }));
      setPlayerVideo(video);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to start this video.');
    } finally {
      setStartingId(null);
    }
  };

  const handleVideoEnded = (videoId: string) => {
    setWatchedToEnd((current) => ({ ...current, [videoId]: true }));
    toast.success('Video finished. You can now claim the reward.');
  };

  return (
    <div className="mx-auto max-w-6xl space-y-12 pb-12">
      <header className="space-y-4 text-center">
        <div className="mx-auto inline-flex h-24 w-24 items-center justify-center rounded-4xl border border-brand-primary/20 bg-brand-primary/10 shadow-lg shadow-brand-primary/10">
          <PlayCircle className="text-brand-primary" size={44} />
        </div>
        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-accent">Daily Video Rewards</span>
          <h1 className="text-5xl font-black uppercase italic tracking-tighter text-white">Watch Videos, Earn IGC</h1>
        </div>
        <p className="mx-auto max-w-2xl text-sm leading-relaxed text-zinc-500">
          Each user can claim rewards from 3 videos per day. Finish the unlocked video, wait for the next slot to open,
          and your IGC reward is credited straight to your wallet.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-4xl border border-white/10 bg-white/5 p-8 text-center">
          <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-zinc-500">IGC Balance</p>
          <p className="text-4xl font-black italic text-white">{(walletData?.wallet.igcBalance ?? 0).toLocaleString()}</p>
          <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-brand-primary">Wallet Synced</p>
        </div>
        <div className="rounded-4xl border border-white/10 bg-white/5 p-8 text-center">
          <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-zinc-500">Videos Watched Today</p>
          <p className="text-4xl font-black italic text-white">
            {watchEarn?.completedCount ?? 0} / {watchEarn?.totalVideosPerDay ?? 0}
          </p>
          <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">
            {(watchEarn?.totalEarnedIgc ?? 0).toLocaleString()} IGC earned
          </p>
        </div>
        <div className="rounded-4xl border border-white/10 bg-white/5 p-8 text-center">
          <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-zinc-500">
            {watchEarn?.canWatchNow ? 'Next Daily Reset' : 'Next Video Unlock'}
          </p>
          <p className="text-4xl font-black italic text-white">
            {watchEarn?.canWatchNow ? formatUtcResetCountdown(nowMs) : formatCountdown(nextUnlockMs)}
          </p>
          <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">
            {watchEarn?.canWatchNow
              ? 'Queue resets at 00:00 UTC'
              : `Wait ${formatIntervalLabel(watchEarn?.waitIntervalMinutes ?? 180)} between videos`}
          </p>
        </div>
      </div>

      <section className="overflow-hidden rounded-[3rem] border border-white/10 bg-white/5 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-8 py-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-brand-accent">Video Queue</p>
            <h2 className="text-2xl font-black uppercase italic text-white">Today&apos;s Reward Videos</h2>
          </div>
          <button
            onClick={() => void handleRefresh()}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-white/10"
          >
            <RefreshCcw size={14} />
            Refresh
          </button>
        </div>

        {loading && !watchEarn ? (
          <div className="px-8 py-16 text-center text-zinc-500">Loading your daily video rewards...</div>
        ) : watchEarn?.videos.length ? (
          <div className="grid gap-8 p-8 lg:grid-cols-3">
            {watchEarn.videos.map((video) => {
              const isProcessing = processingId === video._id;
              const isStarting = startingId === video._id;
              const isLocked = !video.completed && !video.availableNow;
              const isCurrent = activeVideo?._id === video._id && video.availableNow;
              const canClaim = Boolean(video.startedWatching && watchedToEnd[video._id]);
              const unlockLabel =
                isLocked && video.availableAt
                  ? `Unlocks at ${formatUnlockTime(video.availableAt)}`
                  : video.completed
                    ? 'Reward claimed'
                    : isCurrent
                      ? 'Ready to watch'
                      : 'Locked';

              return (
                <div key={video._id} className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-black/20">
                  <div className="relative aspect-video">
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className={`h-full w-full object-cover ${isLocked ? 'opacity-40 grayscale-[0.45]' : ''}`}
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-[#0f0b21] via-transparent to-transparent" />
                    <div className="absolute left-4 top-4 rounded-full bg-black/60 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
                      Video {video.daySlot}
                    </div>
                    <div className="absolute right-4 top-4 rounded-full bg-brand-accent/90 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-black">
                      +{video.rewardIgc} IGC
                    </div>
                    {isLocked && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="rounded-full border border-white/10 bg-black/70 p-4 text-white">
                          <Lock size={28} />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-5 p-6">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{unlockLabel}</p>
                      <h3 className="mt-2 text-lg font-black uppercase italic text-white">{video.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-zinc-500">{video.description}</p>
                    </div>

                    <button
                      onClick={() => void handleOpenVideo(video)}
                      disabled={isLocked || isStarting || isProcessing}
                      className={`block rounded-xl border border-white/10 px-4 py-3 text-center text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                        isLocked || isStarting
                          ? 'pointer-events-none bg-black/20 text-zinc-600'
                          : 'bg-black/30 text-zinc-200 hover:bg-black/40'
                      }`}
                    >
                      {video.completed ? 'Watched' : isStarting ? 'Opening Player...' : 'Watch Video'}
                    </button>

                    <button
                      onClick={() => void handleComplete(video)}
                      disabled={video.completed || !video.availableNow || isProcessing || !canClaim}
                      className="w-full rounded-xl bg-brand-primary px-4 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-brand-accent hover:text-black disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-zinc-500"
                    >
                      {video.completed
                        ? 'Reward Claimed'
                        : isProcessing
                          ? 'Claiming...'
                          : canClaim
                            ? 'Claim Video Reward'
                            : 'Watch Full Video First'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-8 py-16 text-center text-zinc-500">
            No daily reward videos have been scheduled yet. Once all 3 videos are added for today, they will appear here.
          </div>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-[3rem] border border-white/10 bg-white/5 p-8">
          <div className="flex items-start gap-4">
            <div className="rounded-3xl border border-brand-accent/20 bg-brand-accent/10 p-4">
              <AlertCircle className="text-brand-accent" size={26} />
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-black uppercase italic text-white">How it works</h3>
              <p className="text-sm leading-relaxed text-zinc-500">
                Only one reward video unlocks at a time. After you claim a video, the next one stays locked for{' '}
                {formatIntervalLabel(watchEarn?.waitIntervalMinutes ?? 180)}. Each account can complete up to 3 videos
                per day.
              </p>
              <p className="text-sm leading-relaxed text-zinc-500">
                The reward is credited from the backend when you press claim, and videos only show when today&apos;s full
                3-video lineup has been scheduled.
              </p>
              <p className="text-sm leading-relaxed text-zinc-500">
                Rewards stay locked until the player finishes the current video. Users can no longer claim by only clicking
                the reward button.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[3rem] border border-brand-primary/20 bg-brand-primary/10 p-8">
          <div className="space-y-4">
            <div className="inline-flex rounded-full border border-brand-primary/20 bg-brand-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-brand-primary">
              Current Status
            </div>
            {watchEarn?.completedCount === watchEarn?.totalVideosPerDay && watchEarn?.totalVideosPerDay ? (
              <>
                <CheckCircle2 className="text-emerald-400" size={36} />
                <h3 className="text-2xl font-black uppercase italic text-white">All 3 videos completed</h3>
                <p className="text-sm leading-relaxed text-zinc-400">
                  You&apos;ve claimed every reward video for today. Come back after the daily reset for a fresh queue.
                </p>
              </>
            ) : watchEarn?.canWatchNow && activeVideo ? (
              <>
                <PlayCircle className="text-brand-primary" size={36} />
                <h3 className="text-2xl font-black uppercase italic text-white">Video {activeVideo.daySlot} is ready</h3>
                <p className="text-sm leading-relaxed text-zinc-400">
                  Open the current video, watch it, then claim your {activeVideo.rewardIgc} IGC reward to unlock the next step.
                </p>
              </>
            ) : (
              <>
                <Timer className="text-brand-accent" size={36} />
                <h3 className="text-2xl font-black uppercase italic text-white">Next video is on cooldown</h3>
                <p className="text-sm leading-relaxed text-zinc-400">
                  Your next reward video unlocks in {formatCountdown(nextUnlockMs)}.
                  {watchEarn?.nextVideoAvailableAt ? ` It should be available around ${formatUnlockTime(watchEarn.nextVideoAvailableAt)}.` : ''}
                </p>
              </>
            )}

            <div className="rounded-4xl border border-white/10 bg-black/20 p-5">
              <div className="flex items-center gap-3 text-sm text-zinc-300">
                <Coins size={18} className="text-brand-primary" />
                <span>{(watchEarn?.totalEarnedIgc ?? 0).toLocaleString()} IGC earned today</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {playerVideo && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
          <div className="flex min-h-full items-center justify-center">
            <div className="my-6 w-full max-w-4xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#0f0b21] shadow-2xl max-h-[calc(100vh-3rem)]">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-brand-accent">Watch Before Claim</p>
                <h3 className="text-xl font-black uppercase italic text-white">{playerVideo.title}</h3>
              </div>
              <button
                onClick={() => setPlayerVideo(null)}
                className="rounded-full border border-white/10 bg-white/5 p-3 text-zinc-300 transition-all hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5 overflow-y-auto p-6 max-h-[calc(100vh-10rem)]">
              <video
                key={playerVideo._id}
                src={playerVideo.videoUrl}
                controls
                autoPlay
                playsInline
                controlsList="nodownload"
                onEnded={() => handleVideoEnded(playerVideo._id)}
                className="aspect-video w-full max-h-[60vh] rounded-4xl bg-black object-contain"
              />

              <div className="flex flex-wrap items-center justify-between gap-4 rounded-4xl border border-white/10 bg-white/5 px-5 py-4">
                <p className="text-sm text-zinc-400">
                  Watch the full video to unlock the reward button. Required watch length: about {playerVideo.durationSeconds} seconds.
                </p>
                <div className="text-[10px] font-black uppercase tracking-widest text-brand-primary">
                  {watchedToEnd[playerVideo._id] ? 'Video completed' : 'Reward locked until video ends'}
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}