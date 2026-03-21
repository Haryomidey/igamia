import { useEffect, useState } from 'react';
import { api } from '../api/axios';

export type MatchActivity = {
  _id: string;
  gameId: string;
  gameTitle: string;
  title: string;
  hostUserId?: string;
  hostUsername: string;
  scheduledFor: string;
  prizePool: number;
  minimumStakeUsd: number;
  maxPlayers: number;
  status: 'open' | 'live' | 'closed' | 'settled';
  mode: string;
  participants: Array<{
    userId: string;
    username: string;
    joinedAt: string;
  }>;
};

export function usePledges(autoLoad = true) {
  const [matches, setMatches] = useState<MatchActivity[]>([]);
  const [activities, setActivities] = useState<MatchActivity[]>([]);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState<string | null>(null);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const [{ data: matchesData }, { data: activitiesData }] = await Promise.all([
        api.get<MatchActivity[]>('/pledges/matches'),
        api.get<MatchActivity[]>('/pledges/activities'),
      ]);
      setMatches(matchesData);
      setActivities(activitiesData);
      setError(null);
      return { matchesData, activitiesData };
    } catch (err: any) {
      const message = err?.response?.data?.message ?? 'Unable to fetch pledge activities';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const createMatch = async (payload: {
    gameId: string;
    title: string;
    scheduledFor: string;
    minimumStakeUsd?: number;
    maxPlayers?: number;
  }) => {
    const { data } = await api.post('/pledges/matches', payload);
    await fetchMatches();
    return data;
  };

  const joinMatch = async (matchId: string) => {
    const { data } = await api.post(`/pledges/matches/${matchId}/join`);
    await fetchMatches();
    return data;
  };

  const placePledge = async (matchId: string, amountUsd: number) => {
    const { data } = await api.post(`/pledges/matches/${matchId}/pledge`, { amountUsd });
    await fetchMatches();
    return data;
  };

  useEffect(() => {
    if (autoLoad) {
      void fetchMatches();
    }
  }, [autoLoad]);

  return {
    matches,
    activities,
    loading,
    error,
    fetchMatches,
    createMatch,
    joinMatch,
    placePledge,
  };
}
