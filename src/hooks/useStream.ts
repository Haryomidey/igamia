import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { api, getAccessToken, streamSocketUrl } from '../api/axios';

export type Stream = {
  _id: string;
  hostUserId: string;
  title: string;
  description: string;
  category: string;
  orientation: 'vertical' | 'horizontal' | 'pip';
  mode: 'normal' | 'pledge';
  matchId?: string;
  status: 'live' | 'ended';
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  viewersCount: number;
  earningsUsd?: number;
  recordingUrl?: string;
  recordedAt?: string;
  recordingDurationSeconds?: number;
  shareUrl: string;
  livekitRoomName: string;
  participants: Array<{
    userId: string;
    role: 'host' | 'guest' | 'invited';
    username: string;
    avatarUrl?: string;
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

export type StreamGiftEvent = {
  streamId: string;
  amount: number;
  giftedBy: string;
  creditedAmount: number;
  earningsUsd?: number;
};

export type StreamLikeEvent = {
  streamId: string;
  likesCount: number;
  likedBy: string;
  likerCount?: number;
};

export type StreamPresenceEvent = {
  streamId: string;
  viewersCount: number;
  joinedUserId?: string;
  joinedUsername?: string;
};

export type StreamParticipantRemovedEvent = {
  streamId: string;
  removedUserId: string;
  removedUsername: string;
  reason?: 'removed' | 'left' | 'declined';
  participants: Stream['participants'];
};

export type StreamParticipantUpdatedEvent = {
  streamId: string;
  participants: Stream['participants'];
  orientation?: Stream['orientation'];
};

export type StreamMediaStateEvent = {
  streamId: string;
  userId: string;
  username: string;
  isMuted: boolean;
  isCameraOff: boolean;
};

export type StreamStoppedEvent = {
  _id: string;
  status: 'live' | 'ended';
  endedAt?: string;
  redirectToDispute?: boolean;
};

export type StreamConnectionDetails = {
  token: string;
  url: string;
  roomName: string;
  canPublish: boolean;
};

export function useStream() {
  const [activeStreams, setActiveStreams] = useState<Stream[]>([]);
  const [stream, setStream] = useState<Stream | null>(null);
  const [comments, setComments] = useState<StreamComment[]>([]);
  const [recentGift, setRecentGift] = useState<StreamGiftEvent | null>(null);
  const [recentLike, setRecentLike] = useState<StreamLikeEvent | null>(null);
  const [recentViewerJoin, setRecentViewerJoin] = useState<StreamPresenceEvent | null>(null);
  const [recentParticipantRemoved, setRecentParticipantRemoved] = useState<StreamParticipantRemovedEvent | null>(null);
  const [recentParticipantUpdated, setRecentParticipantUpdated] = useState<StreamParticipantUpdatedEvent | null>(null);
  const [recentMediaState, setRecentMediaState] = useState<StreamMediaStateEvent | null>(null);
  const [recentStreamStopped, setRecentStreamStopped] = useState<StreamStoppedEvent | null>(null);
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

    socketRef.current.on('streamLiked', (payload: StreamLikeEvent) => {
      setStream((prev) => (prev ? { ...prev, likesCount: payload.likesCount } : prev));
      setRecentLike(payload);
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

    socketRef.current.on('streamGifted', (payload: StreamGiftEvent) => {
      setStream((prev) => (prev ? { ...prev, earningsUsd: payload.earningsUsd ?? prev.earningsUsd } : prev));
      setRecentGift(payload);
    });

    socketRef.current.on('streamPresenceUpdated', (payload: StreamPresenceEvent) => {
      setStream((prev) => (prev ? { ...prev, viewersCount: payload.viewersCount } : prev));
      if (payload.joinedUsername) {
        setRecentViewerJoin(payload);
      }
    });

    socketRef.current.on('streamParticipantRemoved', (payload: StreamParticipantRemovedEvent) => {
      setStream((prev) => (prev ? { ...prev, participants: payload.participants } : prev));
      setRecentParticipantRemoved(payload);
    });

    socketRef.current.on('streamParticipantUpdated', (payload: StreamParticipantUpdatedEvent) => {
      setStream((prev) =>
        prev
          ? {
              ...prev,
              participants: payload.participants,
              orientation: payload.orientation ?? prev.orientation,
            }
          : prev,
      );
      setRecentParticipantUpdated(payload);
    });

    socketRef.current.on('streamMediaStateUpdated', (payload: StreamMediaStateEvent) => {
      setRecentMediaState(payload);
    });

    socketRef.current.on('streamStopped', (payload: StreamStoppedEvent) => {
      setStream((prev) => (prev ? { ...prev, status: payload.status, endedAt: payload.endedAt } : prev));
      setRecentStreamStopped(payload);
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
    orientation?: Stream['orientation'];
  }) => {
    const { data } = await api.post<Stream>('/streams/start', payload);
    setStream(data);
    await fetchActiveStreams();
    return data;
  };

  const stopStream = async (streamId: string) => api.post(`/streams/${streamId}/stop`);
  const inviteStreamer = async (streamId: string, streamerUserId: string) =>
    api.post(`/streams/${streamId}/invite`, { streamerUserId });
  const acceptInvite = async (streamId: string) => api.post(`/streams/${streamId}/accept-invite`);
  const shareStream = async (streamId: string) => api.post(`/streams/${streamId}/share`);
  const likeStream = async (streamId: string) => api.post(`/streams/${streamId}/like`);
  const commentOnStream = async (streamId: string, message: string) =>
    api.post(`/streams/${streamId}/comments`, { message });
  const blockViewer = async (streamId: string, blockedUserId: string) =>
    api.post(`/streams/${streamId}/block`, { blockedUserId });
  const removeParticipant = async (streamId: string, participantUserId: string) =>
    api.post(`/streams/${streamId}/remove-participant`, { participantUserId });
  const leaveStreamParticipation = async (streamId: string) => api.post(`/streams/${streamId}/leave`);
  const updateStreamLayout = async (
    streamId: string,
    orientation: Stream['orientation'],
  ) => {
    const { data } = await api.post<{ message: string; stream: Stream }>(`/streams/${streamId}/layout`, {
      orientation,
    });
    setStream((prev) => (prev ? { ...prev, ...(data.stream ?? {}) } : data.stream));
    return data;
  };
  const giftStream = async (
    streamId: string,
    payload: { amount: number; description: string },
  ) => api.post(`/streams/${streamId}/gift`, payload);
  const updateMediaState = (
    streamId: string,
    payload: { isMuted: boolean; isCameraOff: boolean },
  ) => connect()?.emit('streamMediaState', { streamId, ...payload });

  const getConnectionDetails = async (streamId: string) => {
    const { data } = await api.get<StreamConnectionDetails>(`/streams/${streamId}/token`);
    return data;
  };

  const saveRecording = async (
    streamId: string,
    payload: {
      fileName?: string;
      mimeType?: string;
      base64Data: string;
      durationSeconds?: number;
    },
  ) => {
    const { data } = await api.post(`/streams/${streamId}/recording`, payload);
    setStream((prev) => (prev ? { ...prev, ...(data.stream ?? {}) } : prev));
    return data;
  };

  const deleteRecording = async (streamId: string) => {
    const { data } = await api.delete(`/streams/${streamId}/recording`);
    setStream((prev) => (prev ? { ...prev, ...(data.stream ?? {}) } : prev));
    return data;
  };

  const fetchMyRecordings = async () => {
    const { data } = await api.get<Stream[]>('/streams/me/recordings');
    return data;
  };

  useEffect(() => {
    return () => disconnect();
  }, []);

  return {
    activeStreams,
    stream,
    comments,
    recentGift,
    recentLike,
    recentViewerJoin,
    recentParticipantRemoved,
    recentParticipantUpdated,
    recentMediaState,
    recentStreamStopped,
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
    acceptInvite,
    shareStream,
    likeStream,
    commentOnStream,
    blockViewer,
    removeParticipant,
    leaveStreamParticipation,
    updateStreamLayout,
    giftStream,
    updateMediaState,
    getConnectionDetails,
    saveRecording,
    deleteRecording,
    fetchMyRecordings,
  };
}
