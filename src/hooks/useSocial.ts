import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { api, getAccessToken, socialSocketUrl } from '../api/axios';

export type SocialUser = {
  id: string;
  name: string;
  username: string;
  fullName: string;
  avatarUrl: string;
  bio: string;
  connected?: boolean;
  pendingRequestSent?: boolean;
  pendingRequestReceived?: boolean;
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
  commentsCount: number;
  createdAt?: string;
};

export type SocialComment = {
  _id: string;
  postId: string;
  userId: string;
  username: string;
  userFullName: string;
  avatarUrl: string;
  message: string;
  createdAt?: string;
};

type SocialPostLikeEvent = {
  postId: string;
  likesCount: number;
  likedByMe?: boolean;
  likedUserId?: string;
};

type SocialPostCommentEvent = {
  comment: SocialComment;
  commentsCount: number;
};

export type DirectMessage = {
  _id: string;
  fromUserId: string;
  toUserId: string;
  fromUsername?: string;
  message: string;
  createdAt?: string;
};

export function useSocial(autoLoad = true) {
  const [discoverUsers, setDiscoverUsers] = useState<SocialUser[]>([]);
  const [friends, setFriends] = useState<SocialUser[]>([]);
  const [requests, setRequests] = useState<SocialRequest[]>([]);
  const [feed, setFeed] = useState<SocialPost[]>([]);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [commentsByPost, setCommentsByPost] = useState<Record<string, SocialComment[]>>({});
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const activeUserIdRef = useRef<string | null>(null);

  const connect = () => {
    if (socketRef.current || !getAccessToken()) {
      return socketRef.current;
    }

    socketRef.current = io(socialSocketUrl, {
      transports: ['websocket'],
      auth: {
        token: getAccessToken(),
      },
    });

    socketRef.current.on('social:postCreated', (payload: SocialPost) => {
      setFeed((current) => [payload, ...current.filter((post) => post._id !== payload._id)]);
    });

    socketRef.current.on('social:postLiked', (payload: SocialPostLikeEvent) => {
      setFeed((current) =>
        current.map((post) =>
          post._id === payload.postId
            ? {
                ...post,
                likesCount: payload.likesCount,
                likedByMe:
                  payload.likedUserId === activeUserIdRef.current
                    ? Boolean(payload.likedByMe)
                    : post.likedByMe,
              }
            : post,
        ),
      );
    });

    socketRef.current.on('social:postCommented', (payload: SocialPostCommentEvent) => {
      setFeed((current) =>
        current.map((post) =>
          post._id === payload.comment.postId
            ? { ...post, commentsCount: payload.commentsCount }
            : post,
        ),
      );
      setCommentsByPost((current) => {
        const existing = current[payload.comment.postId];
        if (!existing) {
          return current;
        }

        if (existing.some((comment) => comment._id === payload.comment._id)) {
          return current;
        }

        return {
          ...current,
          [payload.comment.postId]: [...existing, payload.comment],
        };
      });
    });

    socketRef.current.on('social:directMessageReceived', (payload: DirectMessage) => {
      setMessages((current) => [...current, payload]);
    });

    socketRef.current.on('social:requestReceived', () => {
      void fetchSocial();
    });

    socketRef.current.on('social:requestAccepted', () => {
      void fetchSocial();
    });

    return socketRef.current;
  };

  const disconnect = () => {
    socketRef.current?.disconnect();
    socketRef.current = null;
  };

  const fetchSocial = async () => {
    try {
      setLoading(true);
      const [{ data: discoverData }, { data: requestsData }, { data: feedData }, { data: friendsData }] =
        await Promise.all([
          api.get<SocialUser[]>('/social/discover'),
          api.get<SocialRequest[]>('/social/requests'),
          api.get<SocialPost[]>('/social/feed'),
          api.get<SocialUser[]>('/social/friends'),
        ]);
      setDiscoverUsers(discoverData);
      setRequests(requestsData);
      setFeed(feedData);
      setFriends(friendsData);
      setError(null);
      return { discoverData, requestsData, feedData, friendsData };
    } catch (err: any) {
      const message = err?.response?.data?.message ?? 'Unable to fetch community data';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (targetUserId: string) => {
    const { data } = await api.get<DirectMessage[]>(`/social/messages/${targetUserId}`);
    setMessages(data);
    return data;
  };

  const fetchSocialUser = async (targetUserId: string) => {
    const { data } = await api.get<SocialUser>(`/social/users/${targetUserId}`);
    return data;
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
    const socket = connect();
    if (socket) {
      const data = await new Promise<SocialPost>((resolve, reject) => {
        socket.timeout(10000).emit('social:createPost', payload, (err: Error | null, response: SocialPost) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(response);
        });
      });
      setFeed((current) => [data, ...current.filter((post) => post._id !== data._id)]);
      return data;
    }

    const { data } = await api.post('/social/posts', payload);
    await fetchSocial();
    return data;
  };

  const sendMessage = async (targetUserId: string, message: string) => {
    const { data } = await api.post<DirectMessage>(`/social/messages/${targetUserId}`, { message });
    setMessages((current) => [...current, data]);
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

  const fetchPostComments = async (postId: string) => {
    const { data } = await api.get<SocialComment[]>(`/social/posts/${postId}/comments`);
    setCommentsByPost((current) => ({
      ...current,
      [postId]: data,
    }));
    return data;
  };

  const fetchPost = async (postId: string) => {
    const { data } = await api.get<SocialPost>(`/social/posts/${postId}`);
    setFeed((current) => {
      const exists = current.some((post) => post._id === data._id);
      if (!exists) {
        return [data, ...current];
      }

      return current.map((post) => (post._id === data._id ? data : post));
    });
    return data;
  };

  const commentOnPost = async (postId: string, message: string) => {
    const { data } = await api.post<SocialComment>(`/social/posts/${postId}/comments`, { message });
    setCommentsByPost((current) => {
      const existing = current[postId] ?? [];
      if (existing.some((comment) => comment._id === data._id)) {
        return current;
      }

      return {
        ...current,
        [postId]: [...existing, data],
      };
    });
    setFeed((current) =>
      current.map((post) =>
        post._id === postId
          ? { ...post, commentsCount: (post.commentsCount ?? 0) + 1 }
          : post,
      ),
    );
    return data;
  };

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      activeUserIdRef.current = null;
    } else {
      try {
        const payload = JSON.parse(atob(token.split('.')[1] ?? '')) as { sub?: string };
        activeUserIdRef.current = payload.sub ?? null;
      } catch {
        activeUserIdRef.current = null;
      }
    }

    if (autoLoad) {
      void fetchSocial();
      connect();
    }

    return () => disconnect();
  }, [autoLoad]);

  return {
    discoverUsers,
    friends,
    requests,
    feed,
    commentsByPost,
    messages,
    loading,
    error,
    socket: socketRef.current,
    connect,
    disconnect,
    fetchSocial,
    fetchSocialUser,
    fetchMessages,
    sendRequest,
    acceptRequest,
    createPost,
    sendMessage,
    togglePostLike,
    fetchPost,
    fetchPostComments,
    commentOnPost,
  };
}
