import { useEffect, useState } from 'react';
import { api } from '../api/axios';

export type WatchEarnVideo = {
  _id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  rewardIgc: number;
  durationSeconds: number;
  active: boolean;
  daySlot: number;
  completed: boolean;
  unlocked: boolean;
  availableNow: boolean;
  availableAt: string | null;
  startedWatching: boolean;
  watchStartedAt: string | null;
  eligibleToClaimAt: string | null;
};

export type WatchEarnToday = {
  dayKey: string;
  totalVideosPerDay: number;
  completedCount: number;
  totalEarnedIgc: number;
  waitIntervalMinutes: number;
  nextVideoAvailableAt: string | null;
  canWatchNow: boolean;
  serverTime: string;
  videos: WatchEarnVideo[];
};

export function useWatchEarn(autoLoad = true) {
  const [watchEarn, setWatchEarn] = useState<WatchEarnToday | null>(null);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState<string | null>(null);

  const fetchTodayVideos = async () => {
    try {
      setLoading(true);
      const { data } = await api.get<WatchEarnToday>('/watch-earn/today');
      setWatchEarn(data);
      setError(null);
      return data;
    } catch (err: any) {
      const message = err?.response?.data?.message ?? 'Unable to fetch watch videos';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const completeVideo = async (videoId: string) => {
    const { data } = await api.post(`/watch-earn/videos/${videoId}/complete`);
    await fetchTodayVideos();
    return data;
  };

  const startVideo = async (videoId: string) => {
    const { data } = await api.post(`/watch-earn/videos/${videoId}/start`);
    await fetchTodayVideos();
    return data;
  };

  useEffect(() => {
    if (autoLoad) {
      void fetchTodayVideos();
    }
  }, [autoLoad]);

  return {
    watchEarn,
    loading,
    error,
    fetchTodayVideos,
    startVideo,
    completeVideo,
  };
}
