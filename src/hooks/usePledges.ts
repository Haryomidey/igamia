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
  status: 'open' | 'live' | 'awaiting_confirmation' | 'disputed' | 'settled';
  mode: string;
  participants: Array<{
    userId: string;
    username: string;
    joinedAt: string;
  }>;
  pendingRequests?: Array<{
    userId: string;
    username: string;
    amountUsd: number;
    requestedAt: string;
  }>;
  streamId?: string;
  resultClaim?: {
    claimedByUserId?: string;
    claimedByUsername?: string;
    outcome?: 'win' | 'loss' | 'draw';
    status?: 'pending' | 'approved' | 'rejected';
    note?: string;
    createdAt?: string;
    respondedAt?: string;
  } | null;
  winnerUserId?: string;
  loserUserId?: string;
  isDraw?: boolean;
  settledAt?: string;
  dispute?: {
    open: boolean;
    openedByUserId?: string;
    openedByUsername?: string;
    reason?: string;
    openedAt?: string;
    messages: Array<{
      senderUserId?: string;
      senderUsername: string;
      senderRole: 'streamer' | 'assistant';
      message: string;
      attachments?: Array<{
        url: string;
        kind: 'image' | 'video';
        mimeType?: string;
        fileName?: string;
      }>;
      createdAt: string;
    }>;
  };
};

export type LeaderboardEntry = {
  rank: number;
  userId: string;
  username: string;
  avatarUrl: string;
  wins: number;
  losses: number;
  draws: number;
  matches: number;
  winRate: number;
  streamsHosted: number;
  rankPoints: number;
  medals: string[];
  achievements: string[];
};

export function usePledges(autoLoad = true) {
  const [matches, setMatches] = useState<MatchActivity[]>([]);
  const [activities, setActivities] = useState<MatchActivity[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
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

  const fetchMatch = async (matchId: string) => {
    const { data } = await api.get<MatchActivity>(`/pledges/matches/${matchId}`);
    return data;
  };

  const fetchLeaderboard = async () => {
    const { data } = await api.get<LeaderboardEntry[]>('/pledges/leaderboard');
    setLeaderboard(data);
    return data;
  };

  const fetchMyStats = async () => {
    const { data } = await api.get<LeaderboardEntry | Record<string, unknown>>('/pledges/me/stats');
    return data;
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

  const joinMatch = async (matchId: string, amountUsd: number) => {
    const { data } = await api.post(`/pledges/matches/${matchId}/join`, { amountUsd });
    await fetchMatches();
    return data;
  };

  const acceptJoinRequest = async (matchId: string, requestUserId: string) => {
    const { data } = await api.post(`/pledges/matches/${matchId}/requests/${requestUserId}/accept`);
    await fetchMatches();
    return data;
  };

  const rejectJoinRequest = async (matchId: string, requestUserId: string) => {
    const { data } = await api.post(`/pledges/matches/${matchId}/requests/${requestUserId}/reject`);
    await fetchMatches();
    return data;
  };

  const placePledge = async (matchId: string, amountUsd: number) => {
    const { data } = await api.post(`/pledges/matches/${matchId}/pledge`, { amountUsd });
    await fetchMatches();
    return data;
  };

  const submitResultClaim = async (
    matchId: string,
    payload: { outcome: 'win' | 'loss' | 'draw' | 'dispute'; note?: string },
  ) => {
    const { data } = await api.post(`/pledges/matches/${matchId}/result-claim`, payload);
    return data;
  };

  const respondToResultClaim = async (
    matchId: string,
    payload: { decision: 'approve' | 'reject' },
  ) => {
    const { data } = await api.post(`/pledges/matches/${matchId}/result-claim/respond`, payload);
    return data;
  };

  const fetchDispute = async (matchId: string) => {
    const { data } = await api.get(`/pledges/matches/${matchId}/dispute`);
    return data;
  };

  const sendDisputeMessage = async (
    matchId: string,
    payload: {
      message?: string;
      attachments?: Array<{
        fileName: string;
        mimeType: string;
        kind: 'image' | 'video';
        base64Data: string;
      }>;
    },
  ) => {
    const { data } = await api.post(`/pledges/matches/${matchId}/dispute/messages`, payload);
    return data;
  };

  useEffect(() => {
    if (autoLoad) {
      void Promise.all([fetchMatches(), fetchLeaderboard()]);
    }
  }, [autoLoad]);

  return {
    matches,
    activities,
    leaderboard,
    loading,
    error,
    fetchMatches,
    fetchMatch,
    fetchLeaderboard,
    fetchMyStats,
    createMatch,
    joinMatch,
    acceptJoinRequest,
    rejectJoinRequest,
    placePledge,
    submitResultClaim,
    respondToResultClaim,
    fetchDispute,
    sendDisputeMessage,
  };
}
