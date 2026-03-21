import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { api, getAccessToken, streamSocketUrl } from '../api/axios';

export type Stream = {
  _id: string;
  hostUserId: string;
  title: string;
  description: string;
  category: string;
  status: 'live' | 'ended';
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  viewersCount: number;
  shareUrl: string;
  livekitRoomName: string;
  participants: Array<{
    userId: string;
    role: 'host' | 'guest' | 'invited';
    username: string;
    joinedAt: string;
  }>;
};

export type StreamComment = {
  _id: string;
  streamId: string;
  userId: string;
  username: string;
  message: string;
  createdAt?: string;
};

export function useStream() {
  const [activeStreams, setActiveStreams] = useState<Stream[]>([]);
  const [stream, setStream] = useState<Stream | null>(null);
  const [comments, setComments] = useState<StreamComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const connect = () => {
    if (socketRef.current || !getAccessToken()) {
      return socketRef.current;
    }

    socketRef.current = io(streamSocketUrl, {
      transports: ['websocket'],
      auth: {
        token: getAccessToken(),
      },
    });

    socketRef.current.on('streamLiked', (payload: { likesCount: number }) => {
      setStream((prev) => (prev ? { ...prev, likesCount: payload.likesCount } : prev));
    });

    socketRef.current.on('streamCommented', (payload: StreamComment) => {
      setComments((prev) => [...prev, payload]);
      setStream((prev) =>
        prev ? { ...prev, commentsCount: prev.commentsCount + 1 } : prev,
      );
    });

    socketRef.current.on('streamShared', (payload: { sharesCount: number }) => {
      setStream((prev) => (prev ? { ...prev, sharesCount: payload.sharesCount } : prev));
    });

    return socketRef.current;
  };

  const disconnect = () => {
    socketRef.current?.disconnect();
    socketRef.current = null;
  };

  const fetchActiveStreams = async () => {
    try {
      setLoading(true);
      const { data } = await api.get<Stream[]>('/streams/active');
      setActiveStreams(data);
      setError(null);
      return data;
    } catch (err: any) {
      const message = err?.response?.data?.message ?? 'Unable to fetch streams';
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchStream = async (streamId: string) => {
    try {
      setLoading(true);
      const { data } = await api.get<{ stream: Stream; comments: StreamComment[] }>(
        `/streams/${streamId}`,
      );
      setStream(data.stream);
      setComments(data.comments);
      setError(null);
      return data;
    } catch (err: any) {
      const message = err?.response?.data?.message ?? 'Unable to fetch stream';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = (streamId: string) => connect()?.emit('joinStreamRoom', { streamId });
  const leaveRoom = (streamId: string) => socketRef.current?.emit('leaveStreamRoom', { streamId });

  const startStream = async (payload: {
    title: string;
    description?: string;
    category?: string;
  }) => {
    const { data } = await api.post<Stream>('/streams/start', payload);
    setStream(data);
    return data;
  };

  const stopStream = async (streamId: string) => api.post(`/streams/${streamId}/stop`);
  const inviteStreamer = async (streamId: string, streamerUserId: string) =>
    api.post(`/streams/${streamId}/invite`, { streamerUserId });
  const shareStream = async (streamId: string) => api.post(`/streams/${streamId}/share`);
  const likeStream = async (streamId: string) => api.post(`/streams/${streamId}/like`);
  const commentOnStream = async (streamId: string, message: string) =>
    api.post(`/streams/${streamId}/comments`, { message });
  const blockViewer = async (streamId: string, blockedUserId: string) =>
    api.post(`/streams/${streamId}/block`, { blockedUserId });
  const giftStream = async (
    streamId: string,
    payload: { amount: number; description: string },
  ) => api.post(`/streams/${streamId}/gift`, payload);

  useEffect(() => {
    return () => disconnect();
  }, []);

  return {
    activeStreams,
    stream,
    comments,
    loading,
    error,
    socket: socketRef.current,
    connect,
    disconnect,
    joinRoom,
    leaveRoom,
    fetchActiveStreams,
    fetchStream,
    startStream,
    stopStream,
    inviteStreamer,
    shareStream,
    likeStream,
    commentOnStream,
    blockViewer,
    giftStream,
  };
}
