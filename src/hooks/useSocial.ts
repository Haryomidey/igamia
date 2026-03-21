import { useEffect, useState } from 'react';
import { api } from '../api/axios';

export type SocialUser = {
  id: string;
  name: string;
  username: string;
  fullName: string;
  avatarUrl: string;
  bio: string;
};

export type SocialRequest = {
  _id: string;
  status: 'pending' | 'accepted' | 'declined';
  fromUserId?: {
    _id: string;
    username: string;
    fullName: string;
    avatarUrl: string;
  };
  createdAt?: string;
};

export function useSocial(autoLoad = true) {
  const [discoverUsers, setDiscoverUsers] = useState<SocialUser[]>([]);
  const [requests, setRequests] = useState<SocialRequest[]>([]);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState<string | null>(null);

  const fetchSocial = async () => {
    try {
      setLoading(true);
      const [{ data: discoverData }, { data: requestsData }] = await Promise.all([
        api.get<SocialUser[]>('/social/discover'),
        api.get<SocialRequest[]>('/social/requests'),
      ]);
      setDiscoverUsers(discoverData);
      setRequests(requestsData);
      setError(null);
      return { discoverData, requestsData };
    } catch (err: any) {
      const message = err?.response?.data?.message ?? 'Unable to fetch community data';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const sendRequest = async (targetUserId: string) => {
    const { data } = await api.post(`/social/requests/${targetUserId}`);
    await fetchSocial();
    return data;
  };

  const acceptRequest = async (requestId: string) => {
    const { data } = await api.post(`/social/requests/${requestId}/accept`);
    await fetchSocial();
    return data;
  };

  useEffect(() => {
    if (autoLoad) {
      void fetchSocial();
    }
  }, [autoLoad]);

  return {
    discoverUsers,
    requests,
    loading,
    error,
    fetchSocial,
    sendRequest,
    acceptRequest,
  };
}
