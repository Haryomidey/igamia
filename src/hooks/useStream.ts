import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { api, getAccessToken, streamSocketUrl } from '../api/axios';

export type Stream = {
  _id: string;
  hostUserId: string;
  title: string;
  description: string;
  category: string;
  orientation: 'vertical' | 'horizontal' | 'pip' | 'screen-only' | 'grid' | 'host-focus';
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
  joinRequests: Array<{
    userId: string;
    username: string;
    avatarUrl?: string;
    requestedAt: string;
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
  creditedIgc: number;
  creditedNgn: number;
  feeIgc: number;
  feeNgn: number;
  earningsNgn?: number;
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
  joinRequests?: Stream['joinRequests'];
  orientation?: Stream['orientation'];
  mode?: Stream['mode'];
};

export type StreamPromotionEvent = {
  streamId: string;
  postId: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  content?: string;
  shownByUserId: string;
  shownByUsername: string;
  durationSeconds: number;
  linkUrl: string;
  linkLabel: string;
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
  const [recentPromotion, setRecentPromotion] = useState<StreamPromotionEvent | null>(null);
  const [recentStreamStopped, setRecentStreamStopped] = useState<StreamStoppedEvent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const patchCurrentStream = (
    streamId: string,
    updater: (current: Stream) => Stream,
  ) => {
    setStream((prev) => {
      if (!prev || prev._id !== streamId) {
        return prev;
      }

      return updater(prev);
    });
  };

  const patchActiveStream = (
    streamId: string,
    updater: (current: Stream) => Stream,
  ) => {
    setActiveStreams((prev) =>
      prev.map((entry) => (entry._id === streamId ? updater(entry) : entry)),
    );
  };

  const syncStreamState = (nextStream: Stream) => {
    setStream((prev) => (prev && prev._id === nextStream._id ? nextStream : prev));
    patchActiveStream(nextStream._id, () => nextStream);
  };

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
      patchCurrentStream(payload.streamId, (prev) => ({ ...prev, likesCount: payload.likesCount }));
      patchActiveStream(payload.streamId, (prev) => ({ ...prev, likesCount: payload.likesCount }));
      setRecentLike(payload);
    });

    socketRef.current.on('streamCommented', (payload: StreamComment) => {
      setComments((prev) => [...prev, payload]);
      setStream((prev) =>
        prev ? { ...prev, commentsCount: prev.commentsCount + 1 } : prev,
      );
    });

    socketRef.current.on('streamShared', (payload: { streamId: string; sharesCount: number }) => {
      patchCurrentStream(payload.streamId, (prev) => ({ ...prev, sharesCount: payload.sharesCount }));
      patchActiveStream(payload.streamId, (prev) => ({ ...prev, sharesCount: payload.sharesCount }));
    });

    socketRef.current.on('streamGifted', (payload: StreamGiftEvent) => {
      patchCurrentStream(payload.streamId, (prev) => ({
        ...prev,
        earningsUsd: payload.earningsNgn ?? prev.earningsUsd,
      }));
      setRecentGift(payload);
    });

    socketRef.current.on('streamPresenceUpdated', (payload: StreamPresenceEvent) => {
      patchCurrentStream(payload.streamId, (prev) => ({ ...prev, viewersCount: payload.viewersCount }));
      patchActiveStream(payload.streamId, (prev) => ({ ...prev, viewersCount: payload.viewersCount }));
      if (payload.joinedUsername) {
        setRecentViewerJoin(payload);
      }
    });

    socketRef.current.on('streamParticipantRemoved', (payload: StreamParticipantRemovedEvent) => {
      patchCurrentStream(payload.streamId, (prev) => ({ ...prev, participants: payload.participants }));
      patchActiveStream(payload.streamId, (prev) => ({ ...prev, participants: payload.participants }));
      setRecentParticipantRemoved(payload);
    });

    socketRef.current.on('streamParticipantUpdated', (payload: StreamParticipantUpdatedEvent) => {
      patchCurrentStream(payload.streamId, (prev) => ({
        ...prev,
        participants: payload.participants,
        joinRequests: payload.joinRequests ?? prev.joinRequests,
        orientation: payload.orientation ?? prev.orientation,
        mode: payload.mode ?? prev.mode,
      }));
      patchActiveStream(payload.streamId, (prev) => ({
        ...prev,
        participants: payload.participants,
        joinRequests: payload.joinRequests ?? prev.joinRequests,
        orientation: payload.orientation ?? prev.orientation,
        mode: payload.mode ?? prev.mode,
      }));
      setRecentParticipantUpdated(payload);
    });

    socketRef.current.on(
      'streamJoinRequestsUpdated',
      (payload: { streamId: string; joinRequests: Stream['joinRequests'] }) => {
        setStream((prev) =>
          prev && prev._id === payload.streamId
            ? {
                ...prev,
                joinRequests: payload.joinRequests,
              }
            : prev,
        );
        patchActiveStream(payload.streamId, (prev) => ({
          ...prev,
          joinRequests: payload.joinRequests,
        }));
      },
    );

    socketRef.current.on('streamMediaStateUpdated', (payload: StreamMediaStateEvent) => {
      setRecentMediaState(payload);
    });

    socketRef.current.on('streamPromotionShown', (payload: StreamPromotionEvent) => {
      setRecentPromotion(payload);
    });

    socketRef.current.on('streamStopped', (payload: StreamStoppedEvent) => {
      patchCurrentStream(payload._id, (prev) => ({
        ...prev,
        status: payload.status,
        endedAt: payload.endedAt,
      }));
      setActiveStreams((prev) => prev.filter((entry) => entry._id !== payload._id));
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
  const inviteStreamer = async (streamId: string, streamerUserId: string) => {
    const { data } = await api.post<{ stream: Stream }>(`/streams/${streamId}/invite`, { streamerUserId });
    if (data.stream) {
      syncStreamState(data.stream);
    }
    return data;
  };
  const acceptInvite = async (streamId: string) => {
    const { data } = await api.post<{ stream: Stream }>(`/streams/${streamId}/accept-invite`);
    if (data.stream) {
      syncStreamState(data.stream);
    }
    return data;
  };
  const requestToJoinStream = async (streamId: string) => {
    const { data } = await api.post<{ stream: Stream }>(`/streams/${streamId}/request-join`);
    if (data.stream) {
      syncStreamState(data.stream);
    }
    return data;
  };
  const cancelJoinRequest = async (streamId: string) => {
    const { data } = await api.delete<{ stream: Stream }>(`/streams/${streamId}/request-join`);
    if (data.stream) {
      syncStreamState(data.stream);
    }
    return data;
  };
  const acceptJoinRequest = async (streamId: string, requestUserId: string) => {
    const { data } = await api.post<{ stream: Stream }>(`/streams/${streamId}/join-requests/${requestUserId}/accept`);
    if (data.stream) {
      syncStreamState(data.stream);
    }
    return data;
  };
  const declineJoinRequest = async (streamId: string, requestUserId: string) => {
    const { data } = await api.post<{ stream: Stream }>(`/streams/${streamId}/join-requests/${requestUserId}/decline`);
    if (data.stream) {
      syncStreamState(data.stream);
    }
    return data;
  };
  const shareStream = async (streamId: string) => api.post(`/streams/${streamId}/share`);
  const shareStreamDirectly = async (streamId: string, targetUserIds: string[]) =>
    api.post(`/streams/${streamId}/share/direct`, { targetUserIds });
  const likeStream = async (streamId: string) => api.post(`/streams/${streamId}/like`);
  const commentOnStream = async (streamId: string, message: string) =>
    api.post(`/streams/${streamId}/comments`, { message });
  const blockViewer = async (streamId: string, blockedUserId: string) =>
    api.post(`/streams/${streamId}/block`, { blockedUserId });
  const removeParticipant = async (streamId: string, participantUserId: string) => {
    const { data } = await api.post<{ stream: Stream }>(`/streams/${streamId}/remove-participant`, { participantUserId });
    if (data.stream) {
      syncStreamState(data.stream);
    }
    return data;
  };
  const leaveStreamParticipation = async (streamId: string) => {
    const { data } = await api.post<{ stream: Stream }>(`/streams/${streamId}/leave`);
    if (data.stream) {
      syncStreamState(data.stream);
    }
    return data;
  };
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
  const promotePostInStream = async (
    streamId: string,
    payload: { postId: string; durationSeconds?: number },
  ) => api.post(`/streams/${streamId}/promote-post`, payload);
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
    recentPromotion,
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
    requestToJoinStream,
    cancelJoinRequest,
    acceptJoinRequest,
    declineJoinRequest,
    shareStream,
    shareStreamDirectly,
    likeStream,
    commentOnStream,
    blockViewer,
    removeParticipant,
    leaveStreamParticipation,
    updateStreamLayout,
    giftStream,
    promotePostInStream,
    updateMediaState,
    getConnectionDetails,
    saveRecording,
    deleteRecording,
    fetchMyRecordings,
  };
}
