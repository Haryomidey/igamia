import React, { useEffect, useState } from 'react';
import { PlayCircle, TrendingUp, Gift, CheckCircle2, RefreshCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWatchEarn } from '../../../hooks/useWatchEarn';
import { useToast } from '../../../components/ToastProvider';

export default function WatchEarn() {
  const { watchEarn, loading, error, completeVideo, fetchTodayVideos } = useWatchEarn(true);
  const toast = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);
 
  useEffect(() => {
    if (error) {
      toast.error(error, { title: 'Watch & Earn Error' });
    }
  }, [error, toast]);

  const handleComplete = async (videoId: string) => {
    try {
      setProcessingId(videoId);
      const result = await completeVideo(videoId);
      toast.success(result?.message ?? 'Reward claimed.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to complete this video.');
    } finally {
      setProcessingId(null);
    }
  };

  const totalRemaining = Math.max((watchEarn?.totalVideosPerDay ?? 0) - (watchEarn?.completedCount ?? 0), 0);

  return (
    <div className="space-y-12 pb-12">
      <header className="space-y-3">
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-accent">Passive Rewards</span>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-5xl font-black tracking-tighter uppercase italic text-white">Watch & Earn</h1>
            <p className="text-zinc-500 text-sm">Today&apos;s watch-to-earn queue is now loading from the backend.</p>
          </div>
          <button
            onClick={() => void fetchTodayVideos()}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all"
          >
            <RefreshCcw size={14} />
            Refresh
          </button>
        </div>
      </header>

      <div className="grid md:grid-cols-3 gap-8">
        {[
          { icon: PlayCircle, title: 'Available Today', value: `${watchEarn?.totalVideosPerDay ?? 0} Videos`, desc: 'Fresh reward clips for today.', color: 'text-brand-primary' },
          { icon: TrendingUp, title: 'Completed', value: `${watchEarn?.completedCount ?? 0} Finished`, desc: `${totalRemaining} clips left to claim.`, color: 'text-brand-accent' },
          { icon: Gift, title: 'Earned Today', value: `${watchEarn?.totalEarnedIgc ?? 0} IGC`, desc: 'Rewards already credited to your wallet.', color: 'text-emerald-500' },
        ].map((item, i) => (
          <div key={i} className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] space-y-4">
            <div className={`w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 ${item.color}`}>
              <item.icon size={24} />
            </div>
            <h3 className="text-xl font-black text-white uppercase italic">{item.title}</h3>
            <p className="text-2xl font-black text-white">{item.value}</p>
            <p className="text-zinc-500 text-sm leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black uppercase italic text-white">Today&apos;s Reward Videos</h2>
          {watchEarn?.dayKey && (
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{watchEarn.dayKey}</p>
          )}
        </div>

        {loading && !watchEarn ? (
          <div className="rounded-[3rem] border border-white/10 bg-white/5 px-8 py-16 text-center text-zinc-500">
            Loading your reward queue...
          </div>
        ) : watchEarn?.videos.length ? (
          <div className="grid lg:grid-cols-3 gap-8">
            {watchEarn.videos.map((video) => (
              <div key={video._id} className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5">
                <div className="relative aspect-video">
                  <img src={video.thumbnailUrl} alt={video.title} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f0b21] via-transparent to-transparent" />
                  <div className="absolute left-4 top-4 rounded-full bg-black/60 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
                    Slot {video.daySlot}
                  </div>
                  <div className="absolute right-4 top-4 rounded-full bg-brand-accent/90 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-black">
                    +{video.rewardIgc} IGC
                  </div>
                </div>
                <div className="space-y-5 p-6">
                  <div>
                    <h3 className="text-lg font-black uppercase italic text-white">{video.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-500">{video.description}</p>
                  </div>
                  <a
                    href={video.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-center text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300 hover:bg-black/30"
                  >
                    Open Video
                  </a>
                  <button
                    onClick={() => void handleComplete(video._id)}
                    disabled={video.completed || processingId === video._id}
                    className="w-full rounded-xl bg-brand-primary px-4 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-brand-accent hover:text-black disabled:cursor-not-allowed disabled:bg-emerald-500/20 disabled:text-emerald-300"
                  >
                    {video.completed ? (
                      <span className="inline-flex items-center gap-2">
                        <CheckCircle2 size={14} />
                        Reward Claimed
                      </span>
                    ) : processingId === video._id ? (
                      'Claiming...'
                    ) : (
                      'Mark as Watched'
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[3rem] border border-white/10 bg-white/5 px-8 py-16 text-center text-zinc-500">
            No active watch-to-earn videos are available right now.
          </div>
        )}
      </section>

      <div className="bg-brand-primary/10 border border-brand-primary/20 p-12 rounded-[3rem] text-center space-y-6">
        <h2 className="text-3xl font-black text-white uppercase italic">Want more active rewards?</h2>
        <p className="text-zinc-400 max-w-xl mx-auto">Jump into live streams or the game library to stack more activity across the platform.</p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link to="/home" className="inline-block bg-brand-primary text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-brand-accent hover:text-black transition-all shadow-xl shadow-brand-primary/20">
            Go to Streams
          </Link>
          <Link to="/library" className="inline-block bg-white/5 border border-white/10 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all">
            Explore Games
          </Link>
        </div>
      </div>
    </div>
  );
}
