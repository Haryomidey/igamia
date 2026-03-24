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

export type SocialPost = {
  _id: string;
  userId: string;
  username: string;
  userFullName: string;
  avatarUrl: string;
  content: string;
  mediaUrl: string;
  mediaType: 'text' | 'image' | 'video';
  likedByMe: boolean;
  likesCount: number;
  createdAt?: string;
};

export function useSocial(autoLoad = true) {
  const [discoverUsers, setDiscoverUsers] = useState<SocialUser[]>([]);
  const [requests, setRequests] = useState<SocialRequest[]>([]);
  const [feed, setFeed] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState<string | null>(null);

  const fetchSocial = async () => {
    try {
      setLoading(true);
      const [{ data: discoverData }, { data: requestsData }, { data: feedData }] = await Promise.all([
        api.get<SocialUser[]>('/social/discover'),
        api.get<SocialRequest[]>('/social/requests'),
        api.get<SocialPost[]>('/social/feed'),
      ]);
      setDiscoverUsers(discoverData);
      setRequests(requestsData);
      setFeed(feedData);
      setError(null);
      return { discoverData, requestsData, feedData };
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

  const createPost = async (payload: {
    content?: string;
    mediaUrl?: string;
    mediaType?: 'text' | 'image' | 'video';
  }) => {
    const { data } = await api.post('/social/posts', payload);
    await fetchSocial();
    return data;
  };

  const togglePostLike = async (postId: string) => {
    const { data } = await api.post(`/social/posts/${postId}/like`);
    setFeed((current) =>
      current.map((post) =>
        post._id === postId
          ? { ...post, likesCount: data.likesCount, likedByMe: data.likedByMe }
          : post,
      ),
    );
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
    feed,
    loading,
    error,
    fetchSocial,
    sendRequest,
    acceptRequest,
    createPost,
    togglePostLike,
  };
}
