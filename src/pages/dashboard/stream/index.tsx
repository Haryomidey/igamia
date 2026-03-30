import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Room,
  RoomEvent,
  Track,
  type LocalTrackPublication,
  type LocalVideoTrack,
  type Participant,
  type TrackPublication,
} from 'livekit-client';
import {
  ChevronDown,
  ChevronUp,
  Gift,
  Heart,
  Monitor,
  MonitorOff,
  Plus,
  Share2,
  UserPlus,
  X,
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useStream, type StreamPromotionEvent } from '../../../hooks/useStream';
import { useSocial } from '../../../hooks/useSocial';
import { usePledges, type MatchActivity } from '../../../hooks/usePledges';
import { useToast } from '../../../components/ToastProvider';
import { StreamStageGrid, type VideoTile } from './components/StreamStageGrid';
import { StreamHeader } from './components/StreamHeader';
import { StreamFooter } from './components/StreamFooter';
import {
  EmptyStreamState,
  GiftModal,
  InvitePlayersModal,
  ShareStreamModal,
} from './components/StreamModals';
import { StreamControlSheet } from './components/StreamControlSheet';

type FloatingHeart = {
  id: number;
  left: number;
  size: number;
  rotate: number;
};

type ActivityOverlay = {
  id: number;
  message: string;
  accent: 'gift' | 'join';
};

type LikeNotice = {
  id: number;
  message: string;
};

type StreamEndedOverlay = {
  hostUsername: string;
  countdownSeconds: number;
};

type LiveParticipantSnapshot = {
  userId: string;
  username: string;
  isLocal: boolean;
};

type CameraFacingMode = 'user' | 'environment';

function participantLabel(participant: Participant) {
  return participant.name || participant.identity || 'Streamer';
}

function hasTrackPublication(
  value: unknown,
): value is { track?: { mediaStreamTrack?: MediaStreamTrack } } {
  return typeof value === 'object' && value !== null && 'track' in value;
}

function resolveLiveParticipantUserId(participant: Participant) {
  if (participant.identity) {
    return participant.identity;
  }

  if ('metadata' in participant && typeof participant.metadata === 'string' && participant.metadata.trim()) {
    try {
      const parsed = JSON.parse(participant.metadata) as { userId?: string };
      if (parsed.userId) {
        return parsed.userId;
      }
    } catch {}
  }

  return participant.sid;
}

function truncateText(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;
}

function getStreamConnectionErrorMessage(error: unknown) {
  const message =
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    (error as { message?: string })?.message;

  if (!message) {
    return 'Unable to connect to the live room.';
  }

  const normalizedMessage = message.toLowerCase();
  if (
    normalizedMessage.includes('device') ||
    normalizedMessage.includes('permission') ||
    normalizedMessage.includes('camera') ||
    normalizedMessage.includes('microphone')
  ) {
    return 'Connected to the live room, but camera or microphone access was blocked.';
  }

  return message;
}

function wait(durationMs: number) {
  return new Promise((resolve) => window.setTimeout(resolve, durationMs));
}

function formatElapsedDuration(totalSeconds: number) {
  const seconds = Math.max(0, totalSeconds);
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return [hrs, mins, secs].map((value) => String(value).padStart(2, '0')).join(':');
  }

  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function getTileSource(
  publication?: { source?: Track.Source; trackName?: string } | null,
  track?: { source?: Track.Source } | null,
) {
  const source = publication?.source ?? track?.source;
  const trackName = publication?.trackName?.toLowerCase() ?? '';
  return source === Track.Source.ScreenShare || trackName.includes('file-share') ? 'screen' : 'camera';
}

function formatLayoutLabel(
  orientation: 'vertical' | 'horizontal' | 'pip' | 'screen-only' | 'grid' | 'host-focus',
) {
  switch (orientation) {
    case 'vertical':
      return 'Stacked';
    case 'horizontal':
      return 'Split';
    case 'pip':
      return 'PiP';
    case 'screen-only':
      return 'Screen Only';
    case 'grid':
      return 'Grid';
    case 'host-focus':
      return 'Host Focus';
    default:
      return orientation;
  }
}

function isProbablyMobileDevice() {
  if (typeof window === 'undefined') {
    return false;
  }

  return /android|iphone|ipad|ipod|mobile/i.test(window.navigator.userAgent);
}

export default function LiveStream() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const streamId = searchParams.get('streamId');
  const shouldStartLive = searchParams.get('start') === '1';
  const { user } = useAuth();
  const {
    activeStreams,
    stream,
    comments,
    recentGift,
    recentLike,
    recentViewerJoin,
    recentParticipantRemoved,
    recentMediaState,
    recentPromotion,
    recentStreamStopped,
    loading,
    error,
    fetchActiveStreams,
    fetchStream,
    likeStream,
    commentOnStream,
    giftStream,
    updateMediaState,
    connect,
    joinRoom,
    leaveRoom,
    inviteStreamer,
    acceptInvite,
    requestToJoinStream,
    cancelJoinRequest,
    acceptJoinRequest,
    declineJoinRequest,
    removeParticipant,
    leaveStreamParticipation,
    updateStreamLayout,
    stopStream,
    startStream,
    getConnectionDetails,
    saveRecording,
    shareStreamDirectly,
    disconnect,
  } = useStream();
  const { discoverUsers, friends, sendRequest, fetchSocial } = useSocial(true);
  const { fetchMatch, submitResultClaim, respondToResultClaim } = usePledges(false);
  const toast = useToast();

  const [message, setMessage] = useState('');
  const [isGifting, setIsGifting] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [showControlSheet, setShowControlSheet] = useState(false);
  const [giftAmount, setGiftAmount] = useState('10');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sendingShareUserId, setSendingShareUserId] = useState<string | null>(null);
  const [isSharingToFollowers, setIsSharingToFollowers] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSavingRecording, setIsSavingRecording] = useState(false);
  const [recordingStartedAt, setRecordingStartedAt] = useState<number | null>(null);
  const [recordingDurationSeconds, setRecordingDurationSeconds] = useState(0);
  const [videoTiles, setVideoTiles] = useState<VideoTile[]>([]);
  const [audioTracks, setAudioTracks] = useState<Array<{ id: string; track: Track }>>([]);
  const [liveParticipants, setLiveParticipants] = useState<Record<string, LiveParticipantSnapshot>>({});
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const [activityOverlays, setActivityOverlays] = useState<ActivityOverlay[]>([]);
  const [likeNotices, setLikeNotices] = useState<LikeNotice[]>([]);
  const [giftTicker, setGiftTicker] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [roomReconnectKey, setRoomReconnectKey] = useState(0);
  const [mediaStates, setMediaStates] = useState<Record<string, { username: string; isMuted: boolean; isCameraOff: boolean }>>({});
  const [pledgeMatch, setPledgeMatch] = useState<MatchActivity | null>(null);
  const [streamEndedOverlay, setStreamEndedOverlay] = useState<StreamEndedOverlay | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraPaused, setIsCameraPaused] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<CameraFacingMode>('user');
  const [sharingFileName, setSharingFileName] = useState<string | null>(null);
  const [activePromotion, setActivePromotion] = useState<StreamPromotionEvent | null>(null);
  const reconnectInFlightRef = useRef(false);
  const roomSessionRef = useRef(0);
  const [startForm, setStartForm] = useState({
    title: '',
    description: '',
    category: 'General',
    orientation: 'horizontal' as 'vertical' | 'horizontal' | 'pip' | 'screen-only' | 'grid' | 'host-focus',
  });
  const audioContainerRef = useRef<HTMLDivElement | null>(null);
  const livekitRoomRef = useRef<Room | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const stageVideoElementsRef = useRef<Record<string, HTMLVideoElement | null>>({});
  const publishCapabilityRef = useRef(false);
  const joinRequestCountRef = useRef(0);
  const autoReconnectTimeoutRef = useRef<number | null>(null);
  const autoReconnectAttemptsRef = useRef(0);
  const fileShareInputRef = useRef<HTMLInputElement | null>(null);
  const sharedMediaTrackRef = useRef<MediaStreamTrack | null>(null);
  const sharedMediaElementRef = useRef<HTMLVideoElement | HTMLImageElement | null>(null);
  const sharedMediaCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sharedMediaStreamRef = useRef<MediaStream | null>(null);
  const sharedMediaFrameRef = useRef<number | null>(null);
  const sharedMediaUrlRef = useRef<string | null>(null);

  useEffect(() => {
    void fetchActiveStreams();
    void fetchSocial();
  }, []);

  useEffect(() => {
    if (shouldStartLive) {
      setIsStarting(true);
    }
  }, [shouldStartLive]);

  const resolvedStreamId = shouldStartLive ? null : streamId ?? activeStreams[0]?._id ?? null;
  const activeStreamIndex = resolvedStreamId
    ? activeStreams.findIndex((activeStream) => activeStream._id === resolvedStreamId)
    : -1;
  const host = stream?.participants.find((participant) => participant.role === 'host') ?? stream?.participants[0];
  const currentParticipant = stream?.participants.find((participant) => participant.userId === user?._id);
  const activeParticipant = currentParticipant ?? host;
  const isHostView = Boolean(user?._id && stream?.hostUserId === user._id);
  const isPledgeStream = stream?.mode === 'pledge';
  const isParticipantView = currentParticipant?.role === 'host' || currentParticipant?.role === 'guest';
  const canBrowseStreams = !isParticipantView && activeStreams.length > 1 && activeStreamIndex >= 0;
  const isInvitedPending = currentParticipant?.role === 'invited';
  const isCoStreamerView = currentParticipant?.role === 'guest' && !isHostView;
  const canRemoveParticipants = isHostView && !isPledgeStream;
  const currentJoinRequest = stream?.joinRequests?.find((request) => request.userId === user?._id) ?? null;
  const canRequestToJoin =
    Boolean(user?._id) &&
    !isHostView &&
    !isPledgeStream &&
    !isParticipantView;
  const pendingClaim = pledgeMatch?.resultClaim?.status === 'pending' ? pledgeMatch.resultClaim : null;
  const isClaimOwner = Boolean(pendingClaim?.claimedByUserId && pendingClaim.claimedByUserId === user?._id);
  const canMakePledgeClaim = Boolean(
    isPledgeStream &&
      isParticipantView &&
      pledgeMatch &&
      pledgeMatch.status !== 'settled' &&
      pledgeMatch.status !== 'disputed' &&
      pledgeMatch.resultClaim?.status !== 'pending',
  );
  const canRespondToClaim = Boolean(
    pendingClaim &&
      pendingClaim.claimedByUserId &&
      user?._id &&
      pendingClaim.claimedByUserId !== user._id &&
      isParticipantView,
  );
  const pendingInvites = useMemo(
    () => (stream?.participants ?? []).filter((participant) => participant.role === 'invited'),
    [stream?.participants],
  );
  const pendingJoinRequests = useMemo(() => stream?.joinRequests ?? [], [stream?.joinRequests]);
  const removableParticipants = useMemo(
    () => (stream?.participants ?? []).filter((participant) => participant.role !== 'host'),
    [stream?.participants],
  );
  const heroImage = useMemo(() => `https://picsum.photos/seed/${stream?._id ?? 'stream'}/1600/900`, [stream?._id]);
  const inviteCandidates = useMemo(() => {
    const participantIds = new Set(stream?.participants.map((participant) => participant.userId) ?? []);
    return discoverUsers.filter((candidate) => !participantIds.has(candidate.id) && candidate.id !== user?._id);
  }, [discoverUsers, stream?.participants, user?._id]);
  const isFollowingHost = useMemo(
    () => Boolean(host?.userId && friends.some((friend) => friend.id === host.userId)),
    [friends, host?.userId],
  );
  const stageParticipants = useMemo(() => {
    const activeIds = new Set(Object.keys(liveParticipants));
    return (stream?.participants ?? []).filter(
      (participant) => participant.role !== 'invited' && activeIds.has(participant.userId),
    );
  }, [liveParticipants, stream?.participants]);
  const visibleVideoTiles = useMemo(() => {
    const activeIds = new Set(stageParticipants.map((participant) => participant.userId));
    return videoTiles.filter((tile) => activeIds.has(tile.participantUserId));
  }, [stageParticipants, videoTiles]);
  const localScreenShareTile = useMemo(
    () => visibleVideoTiles.find((tile) => tile.isLocal && tile.source === 'screen') ?? null,
    [visibleVideoTiles],
  );
  const isScreenSharing = Boolean(localScreenShareTile);
  const recordingDurationLabel = useMemo(
    () => (isRecording ? formatElapsedDuration(recordingDurationSeconds) : null),
    [isRecording, recordingDurationSeconds],
  );
  const primaryTile = useMemo(
    () =>
      visibleVideoTiles.find((tile) => tile.isLocal && tile.source === 'screen') ??
      visibleVideoTiles.find((tile) => tile.isLocal && tile.source === 'camera') ??
      visibleVideoTiles.find((tile) => tile.participantUserId === user?._id) ??
      visibleVideoTiles[0] ??
      null,
    [user?._id, visibleVideoTiles],
  );
  const isStreamEndedForViewer = Boolean(streamEndedOverlay && !isHostView);

  const redirectToPreferredStream = async (options?: { replace?: boolean; excludeStreamId?: string }) => {
    const nextStreams = await fetchActiveStreams();
    const visibleStreams = nextStreams.filter((entry) => entry._id !== options?.excludeStreamId);
    const preferredStream =
      visibleStreams.find((entry) => entry.hostUserId === user?._id) ?? visibleStreams[0] ?? null;

    if (preferredStream) {
      navigate(`/stream?streamId=${preferredStream._id}`, { replace: options?.replace });
      return true;
    }

    return false;
  };

  useEffect(() => {
    if (!resolvedStreamId) {
      return;
    }

    void fetchStream(resolvedStreamId);
    connect();
    joinRoom(resolvedStreamId);

    return () => {
      leaveRoom(resolvedStreamId);
    };
  }, [resolvedStreamId]);

  useEffect(() => {
    const canPublishNow = Boolean(currentParticipant && currentParticipant.role !== 'invited');
    const gainedPublishCapability = canPublishNow && !publishCapabilityRef.current;
    publishCapabilityRef.current = canPublishNow;

    if (!gainedPublishCapability || !resolvedStreamId) {
      return;
    }

    void handleReconnectToLive();
  }, [currentParticipant?.role, resolvedStreamId]);

  useEffect(() => {
    const nextCount = pendingJoinRequests.length;
    const hadNewRequest = isHostView && nextCount > joinRequestCountRef.current;
    joinRequestCountRef.current = nextCount;

    if (!hadNewRequest) {
      return;
    }

    setIsInviting(true);
  }, [isHostView, pendingJoinRequests.length]);

  useEffect(() => {
    if (!isPledgeStream || !stream?.matchId) {
      setPledgeMatch(null);
      return;
    }

    let active = true;
    const syncMatch = async () => {
      try {
        const nextMatch = await fetchMatch(stream.matchId!);
        if (active) {
          setPledgeMatch(nextMatch);
        }
      } catch {}
    };

    void syncMatch();
    const interval = window.setInterval(() => {
      void syncMatch();
    }, 10000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [isPledgeStream, stream?.matchId]);

  useEffect(() => {
    if (error) {
      toast.error(error, { title: 'Stream Error' });
    }
  }, [error, toast]);

  useEffect(() => {
    if (!recentGift || recentGift.streamId !== resolvedStreamId) {
      return;
    }

    const id = Date.now();
    setActivityOverlays((current) => [...current.slice(-2), { id, message: `${recentGift.giftedBy} sent ${recentGift.amount.toFixed(2)} IGC`, accent: 'gift' }]);
    if (isHostView) {
      setGiftTicker(
        `${recentGift.giftedBy} sent ${recentGift.amount.toFixed(2)} IGC · +NGN ${recentGift.creditedNgn.toLocaleString()}`,
      );
    }
    const timeout = window.setTimeout(() => {
      setActivityOverlays((current) => current.filter((entry) => entry.id !== id));
    }, 3200);
    const tickerTimeout = window.setTimeout(() => {
      setGiftTicker((current) =>
        current === `${recentGift.giftedBy} sent ${recentGift.amount.toFixed(2)} IGC · +NGN ${recentGift.creditedNgn.toLocaleString()}`
          ? null
          : current,
      );
    }, 3600);

    return () => {
      window.clearTimeout(timeout);
      window.clearTimeout(tickerTimeout);
    };
  }, [isHostView, recentGift, resolvedStreamId]);

  useEffect(() => {
    if (!recentLike || recentLike.streamId !== resolvedStreamId) {
      return;
    }

    if (!isHostView) {
      return;
    }

    const countLabel = recentLike.likerCount && recentLike.likerCount > 1 ? ` x${recentLike.likerCount}` : '';
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setLikeNotices((current) => [...current.slice(-7), { id, message: `${recentLike.likedBy}${countLabel}` }]);
    window.setTimeout(() => {
      setLikeNotices((current) => current.filter((entry) => entry.id !== id));
    }, 1800);
  }, [isHostView, recentLike, resolvedStreamId]);

  useEffect(() => {
    if (
      !recentViewerJoin ||
      recentViewerJoin.streamId !== resolvedStreamId ||
      !recentViewerJoin.joinedUsername ||
      recentViewerJoin.joinedUserId === host?.userId ||
      recentViewerJoin.joinedUserId === user?._id ||
      recentViewerJoin.joinedUsername === user?.username
    ) {
      return;
    }

    const id = Date.now();
    setActivityOverlays((current) => [
      ...current.slice(-2),
      { id, message: `${recentViewerJoin.joinedUsername} joined`, accent: 'join' },
    ]);
    const timeout = window.setTimeout(() => {
      setActivityOverlays((current) => current.filter((entry) => entry.id !== id));
    }, 5000);

    return () => window.clearTimeout(timeout);
  }, [host?.userId, recentViewerJoin, resolvedStreamId, user?._id, user?.username]);

  useEffect(() => {
    if (!recentMediaState || recentMediaState.streamId !== resolvedStreamId) {
      return;
    }

    setMediaStates((current) => ({
      ...current,
      [recentMediaState.userId]: {
        username: recentMediaState.username,
        isMuted: recentMediaState.isMuted,
        isCameraOff: recentMediaState.isCameraOff,
      },
    }));
  }, [recentMediaState, resolvedStreamId]);

  useEffect(() => {
    if (!recentPromotion || recentPromotion.streamId !== resolvedStreamId) {
      return;
    }

    setActivePromotion(recentPromotion);
    const timeout = window.setTimeout(() => {
      setActivePromotion((current) => (current?.postId === recentPromotion.postId ? null : current));
    }, recentPromotion.durationSeconds * 1000);

    return () => window.clearTimeout(timeout);
  }, [recentPromotion, resolvedStreamId]);

  useEffect(() => {
    if (!recentParticipantRemoved || recentParticipantRemoved.streamId !== resolvedStreamId) {
      return;
    }

    setMediaStates((current) => {
      const next = { ...current };
      delete next[recentParticipantRemoved.removedUserId];
      return next;
    });

    if (recentParticipantRemoved.removedUserId === user?._id) {
      void stopSharedFilePlayback();
      livekitRoomRef.current?.disconnect();
      livekitRoomRef.current = null;
      setLiveParticipants({});
      setVideoTiles([]);
      setAudioTracks([]);
      setIsMicMuted(true);
      setIsCameraPaused(true);
      if (recentParticipantRemoved.reason === 'removed') {
        toast.info('You were removed from this live by the host.', { title: 'Removed From Live' });
      }
      void handleReconnectToLive();
      return;
    }

    if (recentParticipantRemoved.reason === 'left' || recentParticipantRemoved.reason === 'declined') {
      toast.info(`${recentParticipantRemoved.removedUsername} left the live.`, {
        title: 'Participant Left',
      });
      return;
    }

    toast.info(`${recentParticipantRemoved.removedUsername} was removed from the live.`, {
      title: 'Participant Removed',
    });
  }, [navigate, recentParticipantRemoved, resolvedStreamId, toast, user?._id]);

  useEffect(() => {
    if (!recentStreamStopped || recentStreamStopped._id !== resolvedStreamId) {
      return;
    }

    livekitRoomRef.current?.disconnect();
    livekitRoomRef.current = null;
    void stopSharedFilePlayback();
    setLiveParticipants({});
    setVideoTiles([]);
    setAudioTracks([]);
    setActivityOverlays([]);
    setLikeNotices([]);
    if (recentStreamStopped.redirectToDispute && isParticipantView && stream?.matchId) {
      navigate(`/disputes/${stream.matchId}`);
      return;
    }

    if (isHostView) {
      return;
    }

    setStreamEndedOverlay({
      hostUsername: host?.username ?? 'The streamer',
      countdownSeconds: 5,
    });
  }, [host?.username, isHostView, isParticipantView, navigate, recentStreamStopped, resolvedStreamId, stream?.matchId]);

  useEffect(() => {
    if (!streamEndedOverlay || isHostView) {
      return;
    }

    if (streamEndedOverlay.countdownSeconds <= 0) {
      const redirectAfterEnd = async () => {
        const redirected = await redirectToPreferredStream({
          excludeStreamId: resolvedStreamId,
          replace: true,
        });
        if (redirected) {
          return;
        }

        if (window.history.length > 1) {
          navigate(-1);
          return;
        }

        navigate('/home', { replace: true });
      };

      void redirectAfterEnd();
      return;
    }

    const timeout = window.setTimeout(() => {
      setStreamEndedOverlay((current) =>
        current
          ? { ...current, countdownSeconds: Math.max(0, current.countdownSeconds - 1) }
          : current,
      );
    }, 1000);

    return () => window.clearTimeout(timeout);
  }, [fetchActiveStreams, isHostView, navigate, resolvedStreamId, streamEndedOverlay, user?._id]);

  useEffect(() => {
    if (!resolvedStreamId || !user?._id || !user.username) {
      return;
    }

    let disposed = false;
    const sessionId = roomSessionRef.current + 1;
    roomSessionRef.current = sessionId;
    const isCurrentSession = () => !disposed && roomSessionRef.current === sessionId;
    const canHandleRoomEvent = (room: Room) => isCurrentSession() && livekitRoomRef.current === room;

    const syncRoomParticipants = (room: Room) => {
      const nextParticipants: Record<string, LiveParticipantSnapshot> = {};
      const localUserId = resolveLiveParticipantUserId(room.localParticipant);
      nextParticipants[localUserId] = {
        userId: localUserId,
        username: participantLabel(room.localParticipant),
        isLocal: true,
      };

      room.remoteParticipants.forEach((participant) => {
        const participantUserId = resolveLiveParticipantUserId(participant);
        nextParticipants[participantUserId] = {
          userId: participantUserId,
          username: participantLabel(participant),
          isLocal: false,
        };
      });

      setLiveParticipants(nextParticipants);
    };

    const addVideoTrack = (
      track: Track,
      participant: Participant,
      isLocal: boolean,
      source: VideoTile['source'],
    ) => {
      if (track.kind !== Track.Kind.Video) {
        return;
      }

      const id = `${participant.sid}-${track.sid}`;
      const participantUserId = resolveLiveParticipantUserId(participant);
      setVideoTiles((current) => {
        const next = current.filter((tile) => tile.id !== id);
        next.push({
          id,
          participantUserId,
          participantName: participantLabel(participant),
          isLocal,
          track,
          source,
        });
        next.sort((left, right) => {
          const leftWeight = Number(left.source === 'screen') * 2 + Number(left.isLocal);
          const rightWeight = Number(right.source === 'screen') * 2 + Number(right.isLocal);
          return rightWeight - leftWeight;
        });
        return next;
      });
      setLiveParticipants((current) => ({
        ...current,
        [participantUserId]: {
          userId: participantUserId,
          username: participantLabel(participant),
          isLocal,
        },
      }));
    };

    const removeTrack = (participant: Participant, publication?: TrackPublication) => {
      const trackSid = publication?.trackSid ?? publication?.track?.sid;
      if (!trackSid) {
        return;
      }

      const id = `${participant.sid}-${trackSid}`;
      setVideoTiles((current) => current.filter((tile) => tile.id !== id));
      setAudioTracks((current) => current.filter((entry) => entry.id !== id));
    };

    const syncRemoteParticipantTracks = (participant: Participant) => {
      participant.trackPublications.forEach((publication) => {
        if (!publication.track) {
          return;
        }

        const id = `${participant.sid}-${publication.trackSid}`;
        if (publication.track.kind === Track.Kind.Video) {
          addVideoTrack(publication.track, participant, false, getTileSource(publication, publication.track));
          return;
        }

        if (publication.track.kind === Track.Kind.Audio) {
          setAudioTracks((current) => [
            ...current.filter((entry) => entry.id !== id),
            { id, track: publication.track },
          ]);
        }
      });
    };

    const connectToRoom = async () => {
      setConnectionStatus('connecting');
      for (let attempt = 0; attempt < 2; attempt += 1) {
        let room: Room | null = null;
        try {
          const details = await getConnectionDetails(resolvedStreamId);
          room = new Room({ adaptiveStream: true, dynacast: true });
          livekitRoomRef.current = room;

          room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
            if (!canHandleRoomEvent(room)) {
              return;
            }
            const id = `${participant.sid}-${publication.trackSid}`;
            if (track.kind === Track.Kind.Video) {
              addVideoTrack(track, participant, false, getTileSource(publication, track));
              return;
            }
            if (track.kind === Track.Kind.Audio) {
              setAudioTracks((current) => [...current.filter((entry) => entry.id !== id), { id, track }]);
            }
          });

          room.on(RoomEvent.TrackUnsubscribed, (_track, publication, participant) => {
            if (!canHandleRoomEvent(room)) {
              return;
            }
            removeTrack(participant, publication);
          });

          room.on(RoomEvent.LocalTrackPublished, (publication, participant) => {
            if (!canHandleRoomEvent(room)) {
              return;
            }
            if (publication.track?.kind === Track.Kind.Video) {
              addVideoTrack(publication.track, participant, true, getTileSource(publication, publication.track));
            }
          });

          room.on(RoomEvent.LocalTrackUnpublished, (publication, participant) => {
            if (!canHandleRoomEvent(room)) {
              return;
            }
            removeTrack(participant, publication);
          });

          room.on(RoomEvent.ParticipantDisconnected, (participant) => {
            if (!canHandleRoomEvent(room)) {
              return;
            }
            const participantUserId = resolveLiveParticipantUserId(participant);
            setVideoTiles((current) => current.filter((tile) => !tile.id.startsWith(`${participant.sid}-`)));
            setAudioTracks((current) => current.filter((entry) => !entry.id.startsWith(`${participant.sid}-`)));
            setLiveParticipants((current) => {
              const next = { ...current };
              delete next[participantUserId];
              return next;
            });
          });

          room.on(RoomEvent.ParticipantConnected, (participant) => {
            if (!canHandleRoomEvent(room)) {
              return;
            }
            const participantUserId = resolveLiveParticipantUserId(participant);
            setLiveParticipants((current) => ({
              ...current,
              [participantUserId]: {
                userId: participantUserId,
                username: participantLabel(participant),
                isLocal: false,
              },
            }));
            syncRemoteParticipantTracks(participant);
          });

          room.on(RoomEvent.Reconnecting, () => {
            if (!canHandleRoomEvent(room)) {
              return;
            }
            setConnectionStatus('connecting');
          });

          room.on(RoomEvent.Reconnected, () => {
            if (!canHandleRoomEvent(room)) {
              return;
            }
            setConnectionStatus('connected');
            syncRoomParticipants(room);
          });

          room.on(RoomEvent.Disconnected, () => {
            if (!canHandleRoomEvent(room)) {
              return;
            }
            setConnectionStatus((current) => (disposed ? current : 'idle'));
            setLiveParticipants({});
            setVideoTiles([]);
            setAudioTracks([]);
          });

          await room.connect(details.url, details.token, { autoSubscribe: true });
          if (!isCurrentSession() || livekitRoomRef.current !== room) {
            await room.disconnect();
            return;
          }

          room.remoteParticipants.forEach((participant) => {
            syncRemoteParticipantTracks(participant);
          });
          syncRoomParticipants(room);

          room.localParticipant.videoTrackPublications.forEach((publication) => {
            if (publication.track) {
              addVideoTrack(publication.track, room.localParticipant, true, getTileSource(publication, publication.track));
            }
          });

          setConnectionStatus('connected');

          if (details.canPublish) {
            try {
              if (!isCurrentSession() || livekitRoomRef.current !== room) {
                return;
              }
              await room.localParticipant.setCameraEnabled(true);
              if (!isCurrentSession() || livekitRoomRef.current !== room) {
                return;
              }
              await room.localParticipant.setMicrophoneEnabled(true);
              setIsMicMuted(false);
              setIsCameraPaused(false);
              updateMediaState(resolvedStreamId, {
                isMuted: false,
                isCameraOff: false,
              });
            } catch (mediaError) {
              setIsMicMuted(true);
              setIsCameraPaused(true);
              updateMediaState(resolvedStreamId, {
                isMuted: true,
                isCameraOff: true,
              });
              toast.warning(getStreamConnectionErrorMessage(mediaError), {
                title: 'Media Permission Needed',
              });
            }
          }

          return;
        } catch (error) {
          if (room) {
            await room.disconnect();
          }
          if (livekitRoomRef.current === room) {
            livekitRoomRef.current = null;
          }

          if (!isCurrentSession()) {
            return;
          }

          if (attempt === 0) {
            await wait(800);
            continue;
          }

          setConnectionStatus('error');
          toast.error(getStreamConnectionErrorMessage(error), {
            title: 'Live Connection Error',
          });
        }
      }
    };

    void connectToRoom();

    return () => {
      disposed = true;
      void stopSharedFilePlayback();
      setLiveParticipants({});
      setVideoTiles([]);
      setAudioTracks([]);
      const room = livekitRoomRef.current;
      livekitRoomRef.current = null;
      void room?.disconnect();
    };
  }, [resolvedStreamId, roomReconnectKey, toast, user?._id, user?.username]);

  useEffect(() => {
    const container = audioContainerRef.current;
    if (!container) {
      return;
    }

    const attached: HTMLElement[] = [];
    audioTracks.forEach(({ track }) => {
      if (track.kind !== Track.Kind.Audio) {
        return;
      }

      const element = track.attach();
      attached.push(element);
      container.appendChild(element);
    });

    return () => {
      attached.forEach((element) => element.remove());
      audioTracks.forEach(({ track }) => {
        if (track.kind === Track.Kind.Audio) {
          track.detach();
        }
      });
    };
  }, [audioTracks]);

  useEffect(() => {
    return () => {
      if (autoReconnectTimeoutRef.current) {
        window.clearTimeout(autoReconnectTimeoutRef.current);
      }
      mediaRecorderRef.current?.stop();
      void stopSharedFilePlayback();
    };
  }, []);

  useEffect(() => {
    if (!isRecording || !recordingStartedAt) {
      setRecordingDurationSeconds(0);
      return;
    }

    setRecordingDurationSeconds(Math.max(0, Math.floor((Date.now() - recordingStartedAt) / 1000)));
    const interval = window.setInterval(() => {
      setRecordingDurationSeconds(
        Math.max(0, Math.floor((Date.now() - recordingStartedAt) / 1000)),
      );
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isRecording, recordingStartedAt]);

  const pushHeartBurst = () => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    const heart = {
      id,
      left: 72 + Math.floor(Math.random() * 18),
      size: 20 + Math.floor(Math.random() * 12),
      rotate: -18 + Math.floor(Math.random() * 36),
    };
    setFloatingHearts((current) => [...current.slice(-10), heart]);
    window.setTimeout(() => {
      setFloatingHearts((current) => current.filter((entry) => entry.id !== id));
    }, 1500);
  };

  const handleLike = async () => {
    if (!resolvedStreamId || isParticipantView || isStreamEndedForViewer) {
      return;
    }

    try {
      pushHeartBurst();
      await likeStream(resolvedStreamId);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to like stream.');
    }
  };

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!resolvedStreamId || !message.trim() || isStreamEndedForViewer) {
      return;
    }

    try {
      setIsSubmitting(true);
      await commentOnStream(resolvedStreamId, message.trim());
      setMessage('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to send message.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGift = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!resolvedStreamId || isStreamEndedForViewer) {
      return;
    }

    try {
      setIsSubmitting(true);
      await giftStream(resolvedStreamId, {
        amount: Number(giftAmount),
        description: `IGC gift sent during ${stream?.title ?? 'live stream'}`,
      });
      setIsGifting(false);
      setGiftAmount('10');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to send gift.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShare = async () => {
    if (!resolvedStreamId || isStreamEndedForViewer) {
      return;
    }

    setIsShareModalOpen(true);
  };

  const handleShareToFriend = async (targetUserId: string) => {
    if (!resolvedStreamId) {
      return;
    }

    try {
      setSendingShareUserId(targetUserId);
      await shareStreamDirectly(resolvedStreamId, [targetUserId]);
      toast.success('Live shared successfully.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to send live share.');
    } finally {
      setSendingShareUserId(null);
    }
  };

  const handleShareToFollowers = async () => {
    if (!resolvedStreamId) {
      return;
    }

    if (!friends.length) {
      toast.info('You have no connected friends to share with yet.');
      return;
    }

    try {
      setIsSharingToFollowers(true);
      await shareStreamDirectly(
        resolvedStreamId,
        friends.map((friend) => friend.id),
      );
      toast.success('Live shared with your followers.');
      setIsShareModalOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to share live with followers.');
    } finally {
      setIsSharingToFollowers(false);
      setSendingShareUserId(null);
    }
  };

  const handleFollowHost = async () => {
    if (!host?.userId || isHostView) {
      return;
    }

    try {
      await sendRequest(host.userId);
      toast.success(`You are now following @${host.username}.`, { title: 'Followed' });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to follow streamer.');
    }
  };

  const handleInvite = async (targetUserId: string) => {
    if (!resolvedStreamId) {
      return;
    }

    try {
      setIsSubmitting(true);
      await inviteStreamer(resolvedStreamId, targetUserId);
      setIsInviting(false);
      toast.success('User invited to the live session.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to invite user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (!resolvedStreamId) {
      return;
    }

    try {
      setIsSubmitting(true);
      await acceptInvite(resolvedStreamId);
      toast.success('You joined the live.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to accept invite.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestToJoin = async () => {
    if (!resolvedStreamId) {
      return;
    }

    try {
      setIsSubmitting(true);
      await requestToJoinStream(resolvedStreamId);
      toast.success('Your join request was sent.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to send join request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelJoinRequest = async () => {
    if (!resolvedStreamId) {
      return;
    }

    try {
      setIsSubmitting(true);
      await cancelJoinRequest(resolvedStreamId);
      toast.info('Your join request was removed.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to remove join request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptJoinRequest = async (requestUserId: string) => {
    if (!resolvedStreamId) {
      return;
    }

    try {
      setIsSubmitting(true);
      await acceptJoinRequest(resolvedStreamId, requestUserId);
      setIsInviting(false);
      toast.success('Viewer added to the live.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to accept join request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeclineJoinRequest = async (requestUserId: string) => {
    if (!resolvedStreamId) {
      return;
    }

    try {
      setIsSubmitting(true);
      await declineJoinRequest(resolvedStreamId, requestUserId);
      toast.info('Join request declined.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to decline join request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLeaveLive = async () => {
    if (!resolvedStreamId) {
      return;
    }

    try {
      setIsSubmitting(true);
      await leaveStreamParticipation(resolvedStreamId);
      await stopSharedFilePlayback();
      livekitRoomRef.current?.disconnect();
      livekitRoomRef.current = null;
      toast.success(isInvitedPending ? 'Live invite declined.' : 'You left the live.');
      const redirected = await redirectToPreferredStream({ excludeStreamId: resolvedStreamId });
      if (!redirected) {
        navigate('/home');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to leave live.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleMute = async () => {
    const room = livekitRoomRef.current;
    if (!room || !resolvedStreamId || !isParticipantView) {
      return;
    }

    const nextMuted = !isMicMuted;
    await room.localParticipant.setMicrophoneEnabled(!nextMuted);
    setIsMicMuted(nextMuted);
    updateMediaState(resolvedStreamId, {
      isMuted: nextMuted,
      isCameraOff: isCameraPaused,
    });
  };

  const getLocalCameraTrack = () => {
    const room = livekitRoomRef.current;
    if (!room) {
      return null;
    }

    const publication = (Array.from(
      room.localParticipant.videoTrackPublications.values(),
    ) as LocalTrackPublication[]).find(
      (entry) => entry.source === Track.Source.Camera && entry.track,
    );

    return (publication?.videoTrack as LocalVideoTrack | undefined) ?? null;
  };

  const handleToggleCamera = async () => {
    const room = livekitRoomRef.current;
    if (!room || !resolvedStreamId || !isParticipantView) {
      return;
    }

    const nextCameraPaused = !isCameraPaused;
    await room.localParticipant.setCameraEnabled(!nextCameraPaused);
    setIsCameraPaused(nextCameraPaused);
    updateMediaState(resolvedStreamId, {
      isMuted: isMicMuted,
      isCameraOff: nextCameraPaused,
    });
  };

  const stopSharedFilePlayback = async () => {
    const room = livekitRoomRef.current;
    const sharedTrack = sharedMediaTrackRef.current;

    if (sharedMediaFrameRef.current) {
      window.cancelAnimationFrame(sharedMediaFrameRef.current);
      sharedMediaFrameRef.current = null;
    }

    if (room && sharedTrack) {
      try {
        await room.localParticipant.unpublishTrack(sharedTrack);
      } catch {}
    }

    sharedTrack?.stop();
    sharedMediaTrackRef.current = null;
    sharedMediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    sharedMediaStreamRef.current = null;

    if (sharedMediaElementRef.current instanceof HTMLVideoElement) {
      sharedMediaElementRef.current.pause();
      sharedMediaElementRef.current.src = '';
    }

    sharedMediaElementRef.current = null;
    sharedMediaCanvasRef.current = null;

    if (sharedMediaUrlRef.current) {
      URL.revokeObjectURL(sharedMediaUrlRef.current);
      sharedMediaUrlRef.current = null;
    }

    setSharingFileName(null);
  };

  const handleSwitchCamera = async () => {
    if (!isParticipantView) {
      return;
    }

    const localCameraTrack = getLocalCameraTrack();
    if (!localCameraTrack) {
      toast.info('Turn your camera on before switching lenses.');
      return;
    }

    const nextFacingMode: CameraFacingMode = cameraFacingMode === 'user' ? 'environment' : 'user';

    try {
      await localCameraTrack.restartTrack({ facingMode: nextFacingMode });
      setCameraFacingMode(nextFacingMode);
      setIsCameraPaused(false);
      if (resolvedStreamId) {
        updateMediaState(resolvedStreamId, {
          isMuted: isMicMuted,
          isCameraOff: false,
        });
      }
      toast.success(nextFacingMode === 'environment' ? 'Back camera enabled.' : 'Front camera enabled.');
    } catch (err: any) {
      toast.error(err?.message ?? 'Unable to switch camera.');
    }
  };

  const handleToggleScreenShare = async () => {
    const room = livekitRoomRef.current;
    if (!room || !resolvedStreamId || !isParticipantView) {
      return;
    }

    try {
      if (!isScreenSharing && isProbablyMobileDevice()) {
        toast.info('Screen sharing is available on laptop or desktop only. Use file share on mobile instead.');
        return;
      }

      if (sharingFileName) {
        await stopSharedFilePlayback();
      }

      const nextEnabled = !isScreenSharing;
      await room.localParticipant.setScreenShareEnabled(nextEnabled, {
        audio: true,
      });

      if (nextEnabled && isHostView && stream?.orientation === 'vertical') {
        await updateStreamLayout(resolvedStreamId, 'pip');
      }

      toast.success(nextEnabled ? 'Screen sharing started.' : 'Screen sharing stopped.');
    } catch (err: any) {
      toast.error(
        err?.message?.includes('Permission')
          ? 'Screen share permission was blocked.'
          : err?.message ?? 'Unable to update screen sharing.',
      );
    }
  };

  const startFileShare = async (file: File) => {
    const room = livekitRoomRef.current;
    if (!room || !resolvedStreamId || !isParticipantView) {
      return;
    }

    await stopSharedFilePlayback();
    if (isScreenSharing) {
      await room.localParticipant.setScreenShareEnabled(false);
    }

    const objectUrl = URL.createObjectURL(file);
    sharedMediaUrlRef.current = objectUrl;

    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    sharedMediaCanvasRef.current = canvas;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Unable to prepare file sharing surface.');
    }

    const streamFromCanvas = canvas.captureStream(file.type.startsWith('video/') ? 24 : 12);
    const mediaTrack = streamFromCanvas.getVideoTracks()[0];
    if (!mediaTrack) {
      throw new Error('Unable to create a sharable video track from this file.');
    }

    const drawFallback = () => {
      context.fillStyle = '#050505';
      context.fillRect(0, 0, canvas.width, canvas.height);
    };

    const drawFrame = () => {
      drawFallback();
      const element = sharedMediaElementRef.current;
      if (!element) {
        return;
      }

      const sourceWidth =
        element instanceof HTMLVideoElement ? element.videoWidth || canvas.width : element.naturalWidth || canvas.width;
      const sourceHeight =
        element instanceof HTMLVideoElement ? element.videoHeight || canvas.height : element.naturalHeight || canvas.height;
      const scale = Math.min(canvas.width / sourceWidth, canvas.height / sourceHeight);
      const width = sourceWidth * scale;
      const height = sourceHeight * scale;
      const x = (canvas.width - width) / 2;
      const y = (canvas.height - height) / 2;

      context.drawImage(element, x, y, width, height);
    };

    const renderLoop = () => {
      drawFrame();
      sharedMediaFrameRef.current = window.requestAnimationFrame(renderLoop);
    };

    if (file.type.startsWith('video/')) {
      const video = document.createElement('video');
      video.src = objectUrl;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      await video.play();
      sharedMediaElementRef.current = video;
      renderLoop();
    } else if (file.type.startsWith('image/')) {
      const image = new Image();
      image.src = objectUrl;
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error('Unable to open this image.'));
      });
      sharedMediaElementRef.current = image;
      renderLoop();
    } else {
      throw new Error('Choose an image or video file to share.');
    }

    await room.localParticipant.publishTrack(mediaTrack, {
      source: Track.Source.ScreenShare,
      name: `file-share-${Date.now()}`,
    });

    sharedMediaTrackRef.current = mediaTrack;
    sharedMediaStreamRef.current = streamFromCanvas;
    setSharingFileName(file.name);

    if (isHostView && stream?.orientation === 'vertical') {
      await updateStreamLayout(resolvedStreamId, 'pip');
    }

    toast.success(`${file.name} is now showing to viewers.`);
  };

  const handleFileSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    try {
      await startFileShare(file);
    } catch (err: any) {
      await stopSharedFilePlayback();
      toast.error(err?.message ?? 'Unable to share this file.');
    }
  };

  const handleOpenFilePicker = () => {
    if (!isParticipantView) {
      return;
    }

    fileShareInputRef.current?.click();
  };

  const handleRemoveParticipant = async (participantUserId: string, participantUsername: string) => {
    if (!resolvedStreamId) {
      return;
    }

    try {
      await removeParticipant(resolvedStreamId, participantUserId);
      toast.success(`${participantUsername} removed from the live.`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to remove participant.');
    }
  };

  const handleStageVideoElementChange = (participantUserId: string, element: HTMLVideoElement | null) => {
    if (element) {
      stageVideoElementsRef.current[participantUserId] = element;
      return;
    }

    delete stageVideoElementsRef.current[participantUserId];
  };

  const handleReconnectToLive = async () => {
    if (!resolvedStreamId) {
      return;
    }

    if (reconnectInFlightRef.current) {
      return;
    }

    try {
      reconnectInFlightRef.current = true;
      if (autoReconnectTimeoutRef.current) {
        window.clearTimeout(autoReconnectTimeoutRef.current);
        autoReconnectTimeoutRef.current = null;
      }
      setConnectionStatus('connecting');
      setLiveParticipants({});
      setVideoTiles([]);
      setAudioTracks([]);
      await stopSharedFilePlayback();
      livekitRoomRef.current?.disconnect();
      livekitRoomRef.current = null;
      disconnect();
      await fetchStream(resolvedStreamId);
      connect();
      joinRoom(resolvedStreamId);
      setRoomReconnectKey((current) => current + 1);
    } catch (err: any) {
      setConnectionStatus('error');
      toast.error(err?.response?.data?.message ?? 'Unable to reconnect to the live.');
    } finally {
      reconnectInFlightRef.current = false;
    }
  };

  useEffect(() => {
    if (!resolvedStreamId || streamEndedOverlay) {
      return;
    }

    if (reconnectInFlightRef.current) {
      return;
    }

    if (connectionStatus === 'connected') {
      autoReconnectAttemptsRef.current = 0;
      if (autoReconnectTimeoutRef.current) {
        window.clearTimeout(autoReconnectTimeoutRef.current);
        autoReconnectTimeoutRef.current = null;
      }
      return;
    }

    if (connectionStatus !== 'error' && connectionStatus !== 'idle') {
      return;
    }

    if (autoReconnectAttemptsRef.current >= 3) {
      return;
    }

    const delay = 1200 * (autoReconnectAttemptsRef.current + 1);
    autoReconnectTimeoutRef.current = window.setTimeout(() => {
      autoReconnectAttemptsRef.current += 1;
      void handleReconnectToLive();
    }, delay);

    return () => {
      if (autoReconnectTimeoutRef.current) {
        window.clearTimeout(autoReconnectTimeoutRef.current);
        autoReconnectTimeoutRef.current = null;
      }
    };
  }, [connectionStatus, resolvedStreamId, streamEndedOverlay]);

  const persistRecordingBlob = async (blob: Blob) => {
    if (!resolvedStreamId) {
      return;
    }

    setIsSavingRecording(true);
    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(String(reader.result ?? ''));
        reader.onerror = () => reject(new Error('Unable to read recording'));
        reader.readAsDataURL(blob);
      });

      const durationSeconds = recordingStartedAt
        ? Math.max(1, Math.round((Date.now() - recordingStartedAt) / 1000))
        : 0;

      await saveRecording(resolvedStreamId, {
        fileName: `${stream?.title ?? 'stream'}.webm`,
        mimeType: blob.type || 'video/webm',
        base64Data,
        durationSeconds,
      });

      toast.success('Recording saved to your history.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to save recording.');
    } finally {
      setIsSavingRecording(false);
      setRecordingStartedAt(null);
      setRecordingDurationSeconds(0);
    }
  };

  const stopRecording = async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) {
      return;
    }

    const blobPromise = new Promise<Blob>((resolve) => {
      recorder.onstop = () => {
        resolve(new Blob(recordedChunksRef.current, { type: recorder.mimeType || 'video/webm' }));
      };
    });

    recorder.stop();
    mediaRecorderRef.current = null;
    setIsRecording(false);
    const blob = await blobPromise;
    recordedChunksRef.current = [];
    await persistRecordingBlob(blob);
  };

  const startRecording = () => {
    if (!isHostView || !primaryTile) {
      return;
    }

    const videoTrack =
      ((primaryTile.track as any)?.mediaStreamTrack as MediaStreamTrack | undefined) ??
      stageVideoElementsRef.current[primaryTile.participantUserId]?.captureStream?.().getVideoTracks()[0];
    const localAudioPublication =
      Array.from(livekitRoomRef.current?.localParticipant.audioTrackPublications.values() ?? []).find(
        (publication) => (publication as { source?: Track.Source }).source === Track.Source.ScreenShareAudio && hasTrackPublication(publication),
      ) ??
      Array.from(livekitRoomRef.current?.localParticipant.audioTrackPublications.values() ?? []).find(hasTrackPublication);
    const localAudioTrack = (localAudioPublication as { track?: { mediaStreamTrack?: MediaStreamTrack } } | undefined)?.track;
    const audioTrack =
      ((localAudioTrack as any)?.mediaStreamTrack as MediaStreamTrack | undefined) ??
      (audioTracks[0] ? ((audioTracks[0].track as any)?.mediaStreamTrack as MediaStreamTrack | undefined) : undefined);

    if (!videoTrack) {
      toast.warning('The video track is not ready for recording yet.');
      return;
    }

    try {
      const recordingStream = new MediaStream([videoTrack, ...(audioTrack ? [audioTrack] : [])]);
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : 'video/webm';
      const recorder = new MediaRecorder(recordingStream, { mimeType });
      recordedChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setRecordingStartedAt(Date.now());
      setIsRecording(true);
      toast.success('Recording started.');
    } catch {
      toast.error('Recording is not supported in this browser.');
    }
  };

  const toggleRecording = async () => {
    if (isSavingRecording) {
      return;
    }

    if (isRecording) {
      await stopRecording();
      return;
    }

    startRecording();
  };

  const handleStopStream = async () => {
    if (!resolvedStreamId) {
      return;
    }

    try {
      if (isRecording) {
        await stopRecording();
      }
      await stopSharedFilePlayback();
      await stopStream(resolvedStreamId);
      toast.success('Your stream has ended.', { title: 'Stream Ended' });
      navigate('/history');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to stop stream.');
    }
  };

  const handleStartStream = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      const started = await startStream({
        title: startForm.title.trim(),
        description: startForm.description.trim(),
        category: startForm.category.trim(),
        orientation: startForm.orientation,
      });
      setIsStarting(false);
      navigate(`/stream?streamId=${started._id}`, { replace: true });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to start stream.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartFormChange = (
    field: keyof typeof startForm,
    value: string,
  ) => {
    setStartForm((current) => ({ ...current, [field]: value }));
  };

  const handleChangeOrientation = async (
    orientation: 'vertical' | 'horizontal' | 'pip' | 'screen-only' | 'grid' | 'host-focus',
  ) => {
    if (!resolvedStreamId || !isHostView) {
      return;
    }

    try {
      await updateStreamLayout(resolvedStreamId, orientation);
      toast.success(`Layout switched to ${formatLayoutLabel(orientation)}.`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to update stream layout.');
    }
  };

  const navigateToRelativeStream = (direction: 'previous' | 'next') => {
    if (!canBrowseStreams) {
      return;
    }

    const offset = direction === 'next' ? 1 : -1;
    const nextIndex =
      (activeStreamIndex + offset + activeStreams.length) % activeStreams.length;
    const nextStream = activeStreams[nextIndex];
    if (!nextStream) {
      return;
    }

    navigate(`/stream?streamId=${nextStream._id}`);
  };

  const handlePledgeClaim = async (outcome: 'win' | 'loss' | 'draw' | 'dispute') => {
    if (!stream?.matchId) {
      return;
    }

    try {
      await submitResultClaim(stream.matchId, {
        outcome,
        note:
          outcome === 'dispute'
            ? 'Streamer requested manual review from the live room.'
            : `${user?.username ?? 'Streamer'} submitted a ${outcome} claim.`,
      });
      const nextMatch = await fetchMatch(stream.matchId);
      setPledgeMatch(nextMatch);
      toast.success(
        outcome === 'dispute'
          ? 'Dispute opened for this pledge.'
          : `Your ${outcome} claim has been sent.`,
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to submit pledge result.');
    }
  };

  const handlePledgeClaimDecision = async (decision: 'approve' | 'reject') => {
    if (!stream?.matchId || !pendingClaim) {
      return;
    }

    try {
      await respondToResultClaim(stream.matchId, { decision });
      const [nextMatch] = await Promise.all([fetchMatch(stream.matchId), fetchStream(resolvedStreamId)]);
      setPledgeMatch(nextMatch);
      toast.success(
        decision === 'approve'
          ? 'Claim approved. Winner credited.'
          : 'Claim rejected. Opening dispute.',
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to update pledge result claim.');
    }
  };

  if (!resolvedStreamId && !loading) {
    return (
      <EmptyStreamState
        shouldStartLive={shouldStartLive}
        isStarting={isStarting}
        isSubmitting={isSubmitting}
        startForm={startForm}
        onOpenStartModal={() => setIsStarting(true)}
        onCloseStartModal={() => setIsStarting(false)}
        onStartFormChange={handleStartFormChange}
        onSubmitStartStream={handleStartStream}
      />
    );
  }

  if (stream?.status === 'ended') {
    return (
      <div className="fixed inset-0 overflow-hidden bg-[linear-gradient(180deg,#020202,#09070f_48%,#05050a)] px-6 py-10 text-white">
        <div className="mx-auto flex min-h-full max-w-xl items-center justify-center">
          <div className="w-full rounded-[3rem] border border-white/10 bg-[#141128] p-10 text-center shadow-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-accent">
              Live Ended
            </p>
            <h1 className="mt-5 text-3xl font-black uppercase italic text-white">
              {host?.username ?? 'This streamer'} ended the stream
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-zinc-400">
              This live session is no longer active. Open another live or head back home.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => navigate('/home')}
                className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-white transition-colors hover:bg-white/10"
              >
                Back Home
              </button>
              <button
                onClick={async () => {
                  const redirected = await redirectToPreferredStream({
                    excludeStreamId: resolvedStreamId,
                    replace: true,
                  });
                  if (!redirected) {
                    navigate('/home');
                  }
                }}
                className="rounded-2xl bg-brand-primary px-6 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-white transition-colors hover:bg-brand-accent hover:text-black"
              >
                Open Live
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-[radial-gradient(circle_at_top,rgba(223,165,58,0.1),transparent_24%),linear-gradient(180deg,#020202,#09070f_48%,#05050a)] text-white">
      <div ref={audioContainerRef} className="hidden" aria-hidden="true" />

      <div className="relative h-full w-full touch-manipulation">
        <StreamStageGrid
          participants={stageParticipants}
          videoTiles={visibleVideoTiles}
          mediaStates={mediaStates}
          orientation={stream?.orientation ?? 'vertical'}
          canRemoveParticipants={canRemoveParticipants}
          currentUserId={user?._id}
          heroImage={heroImage}
          onVideoElementChange={handleStageVideoElementChange}
          onRemoveParticipant={(participantUserId, participantUsername) => {
            void handleRemoveParticipant(participantUserId, participantUsername);
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(223,165,58,0.12),transparent_30%)]" />
        {canBrowseStreams && (
          <div className="pointer-events-none absolute left-2.5 top-24 z-20 sm:inset-y-0 sm:left-6 sm:flex sm:items-center lg:left-8">
            <div className="pointer-events-auto flex flex-col gap-2">
              <button
                type="button"
                title="Previous stream"
                aria-label="Previous stream"
                onClick={(event) => {
                  event.stopPropagation();
                  navigateToRelativeStream('previous');
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/30 text-white backdrop-blur-md transition-colors hover:bg-black/45 sm:h-11 sm:w-11"
              >
                <ChevronUp size={18} />
              </button>
              <button
                type="button"
                title="Next stream"
                aria-label="Next stream"
                onClick={(event) => {
                  event.stopPropagation();
                  navigateToRelativeStream('next');
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/30 text-white backdrop-blur-md transition-colors hover:bg-black/45 sm:h-11 sm:w-11"
              >
                <ChevronDown size={18} />
              </button>
            </div>
          </div>
        )}
        {!videoTiles.length && (
          <div className="pointer-events-none absolute inset-x-0 bottom-32 z-10 px-3 sm:bottom-40 sm:px-6 lg:px-8">
            <p className="text-[8px] font-black uppercase tracking-[0.22em] text-brand-primary">
              {connectionStatus === 'connecting' ? 'Connecting' : 'Waiting'}
            </p>
            <h2
              title={stream?.title ?? 'Live Session'}
              className="mt-2 max-w-lg text-base font-black uppercase italic text-white sm:mt-3 sm:max-w-xl sm:text-2xl"
            >
              {truncateText(stream?.title ?? 'Live Session', 44)}
            </h2>
            <p className="mt-1.5 max-w-sm text-[10px] leading-relaxed text-zinc-300 sm:mt-2 sm:max-w-xl sm:text-xs">
              {connectionStatus === 'error'
                ? 'Room unavailable. Reconnect.'
                : isHostView
                  ? 'Your camera will appear here.'
                  : 'The live feed will appear here.'}
            </p>
            {connectionStatus !== 'connected' && (
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  void handleReconnectToLive();
                }}
                className="pointer-events-auto mt-3 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.14em] text-white backdrop-blur-md transition-colors hover:bg-white/20 sm:mt-4 sm:px-4 sm:py-2 sm:text-xs"
              >
                {connectionStatus === 'connecting' ? 'Reconnecting...' : 'Reconnect'}
              </button>
            )}
          </div>
        )}

        <StreamHeader
          stream={stream}
          host={host}
          isHostView={isHostView}
          isCoStreamerView={isCoStreamerView}
          isInvitedPending={isInvitedPending}
          isPledgeStream={isPledgeStream}
          connectionStatus={connectionStatus}
          canOpenControls={isParticipantView}
          pendingJoinRequestsCount={isHostView ? pendingJoinRequests.length : 0}
          canOpenRequests={isHostView && !isPledgeStream}
          canFollowHost={!isFollowingHost}
          activeParticipant={activeParticipant}
          onBack={() => navigate(-1)}
          onClose={() => navigate('/home')}
          onOpenControlSheet={() => {
            if (isParticipantView) {
              setShowControlSheet(true);
            }
          }}
          onOpenRequests={() => setIsInviting(true)}
          onFollowHost={() => void handleFollowHost()}
          onShare={() => void handleShare()}
          recordingDurationLabel={recordingDurationLabel}
          isSavingRecording={isSavingRecording}
          isScreenSharing={isScreenSharing}
        />

        <AnimatePresence>
          {giftTicker && (
            <motion.div
              key={giftTicker}
              initial={{ opacity: 0, y: -10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              className="pointer-events-none absolute left-1/2 top-24 z-30 w-[min(calc(100vw-1.5rem),24rem)] -translate-x-1/2 rounded-[1.25rem] border border-emerald-400/20 bg-emerald-500/12 px-3 py-2.5 text-center shadow-2xl backdrop-blur-xl sm:top-32 sm:w-[min(calc(100vw-2rem),28rem)] sm:px-4 sm:py-3"
            >
              <p className="text-[8px] font-black uppercase tracking-[0.18em] text-emerald-300">
                Gift Received
              </p>
              <p className="mt-1.5 text-xs font-black uppercase italic text-white sm:mt-2 sm:text-base">
                {giftTicker}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {activePromotion && (
            <motion.div
              key={`${activePromotion.postId}-${activePromotion.shownByUserId}`}
              initial={{ opacity: 0, y: -14, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              className="absolute inset-x-3 top-24 z-35 flex justify-center sm:inset-x-6 sm:top-32 lg:inset-x-8"
            >
              <div className="w-full max-w-2xl rounded-[2rem] border border-white/10 bg-[#0e0b1f]/92 p-3 shadow-2xl backdrop-blur-xl sm:p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-brand-accent">Promoted In Stream</p>
                    <p className="mt-1 text-xs font-black uppercase italic text-white sm:text-sm">
                      @{activePromotion.shownByUsername}
                    </p>
                  </div>
                  <a
                    href={activePromotion.linkUrl}
                    target={activePromotion.linkUrl.startsWith('http') ? '_blank' : undefined}
                    rel={activePromotion.linkUrl.startsWith('http') ? 'noreferrer' : undefined}
                    className="rounded-full bg-brand-primary px-3 py-2 text-[9px] font-black uppercase tracking-[0.14em] text-white"
                  >
                    {activePromotion.linkLabel}
                  </a>
                </div>
                {activePromotion.mediaType === 'video' ? (
                  <video
                    src={activePromotion.mediaUrl}
                    autoPlay
                    muted
                    playsInline
                    className="mt-3 aspect-video w-full rounded-[1.5rem] bg-black object-cover"
                  />
                ) : (
                  <img
                    src={activePromotion.mediaUrl}
                    alt={activePromotion.content || 'Promoted post'}
                    className="mt-3 aspect-video w-full rounded-[1.5rem] object-cover"
                  />
                )}
                {activePromotion.content ? (
                  <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-zinc-300 sm:text-sm">
                    {activePromotion.content}
                  </p>
                ) : null}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isHostView && likeNotices.length > 0 && (
          <div className="pointer-events-none absolute left-4 top-24 z-30 max-h-28 w-36 overflow-y-auto rounded-2xl border border-white/10 bg-black/30 px-2 py-2 backdrop-blur-md sm:left-6 sm:top-32 sm:w-40 lg:left-8">
            <div className="space-y-1">
              {likeNotices.map((notice) => (
                <div
                  key={notice.id}
                  className="rounded-full bg-white/8 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-100"
                >
                  {notice.message}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pointer-events-none absolute right-4 bottom-44 z-20 flex flex-col items-center gap-4 sm:right-6 lg:right-8">
          <div className="pointer-events-none absolute bottom-16 right-14 z-10 flex flex-col items-end gap-2 sm:bottom-20 sm:right-16">
            <AnimatePresence>
              {activityOverlays.map((entry) => (
                <motion.div key={entry.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className={`max-w-32 rounded-2xl border px-2 py-1.5 text-right text-[7px] font-black uppercase tracking-[0.12em] backdrop-blur-md sm:max-w-56 sm:px-3 sm:py-2 sm:text-[11px] sm:tracking-[0.18em] ${
                  entry.accent === 'gift'
                    ? 'border-brand-accent/30 bg-brand-accent/20 text-brand-accent'
                    : 'border-white/15 bg-white/10 text-white'
                }`}>
                  {entry.message}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="pointer-events-auto relative">
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${activeParticipant?.username ?? host?.username ?? 'streamer'}`}
              className="h-12 w-12 rounded-full border-2 border-white object-cover"
              alt={activeParticipant?.username ?? host?.username ?? 'avatar'}
            />
            {!isHostView && !isCoStreamerView && !isInvitedPending && !isFollowingHost && (
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  void handleFollowHost();
                }}
                className="absolute -bottom-2 left-1/2 flex -translate-x-1/2 rounded-full bg-red-500 p-1 text-white transition-transform hover:scale-105"
              >
                <Plus size={12} />
              </button>
            )}
          </div>

          <div className="pointer-events-auto flex flex-col items-center gap-5">
          <AnimatePresence>
            {floatingHearts.map((heart) => (
              <motion.div key={heart.id} initial={{ opacity: 0, y: 0, scale: 0.7 }} animate={{ opacity: 1, y: -160, scale: 1.1 }} exit={{ opacity: 0 }} transition={{ duration: 1.35, ease: 'easeOut' }} className="absolute bottom-20 text-brand-primary" style={{ right: `${100 - heart.left}%`, rotate: `${heart.rotate}deg` }}>
                <Heart size={heart.size} fill="currentColor" />
              </motion.div>
            ))}
          </AnimatePresence>

          {canRequestToJoin && (
            <button
              onClick={(event) => {
                event.stopPropagation();
                if (currentJoinRequest) {
                  void handleCancelJoinRequest();
                  return;
                }
                void handleRequestToJoin();
              }}
              title={
                currentJoinRequest
                  ? `Cancel request to join ${host?.username ?? 'the host'}`
                  : `Request to join ${host?.username ?? 'the host'}`
              }
              className={`flex h-12 w-12 items-center justify-center rounded-full border text-white transition-transform backdrop-blur-md hover:scale-110 ${
                currentJoinRequest
                  ? 'border-white/10 bg-white/10'
                  : 'border-brand-primary/30 bg-brand-primary/85'
              }`}
            >
              {currentJoinRequest ? <X size={22} /> : <UserPlus size={22} />}
            </button>
          )}

          {isParticipantView && (
            <button
              onClick={(event) => {
                event.stopPropagation();
                void handleToggleScreenShare();
              }}
              title={isScreenSharing ? 'Stop screen sharing' : 'Share your screen'}
              className={`flex h-12 w-12 items-center justify-center rounded-full border text-white transition-transform backdrop-blur-md hover:scale-110 ${
                isScreenSharing
                  ? 'border-emerald-400/30 bg-emerald-500/20'
                  : 'border-white/10 bg-black/40'
              }`}
            >
              {isScreenSharing ? <MonitorOff size={22} /> : <Monitor size={22} />}
            </button>
          )}

          {!isParticipantView && (
            <button onClick={(event) => { event.stopPropagation(); setIsGifting(true); }} className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white transition-transform backdrop-blur-md hover:scale-110">
              <Gift size={24} className="text-brand-accent" />
            </button>
          )}

          <button onClick={(event) => { event.stopPropagation(); void handleShare(); }} className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white transition-transform backdrop-blur-md hover:scale-110">
            <Share2 size={24} />
          </button>
          </div>
        </div>

        {isPledgeStream && isParticipantView && pledgeMatch && (
          <div className="pointer-events-none absolute inset-x-2.5 top-24 z-20 sm:inset-x-auto sm:right-6 sm:top-28 lg:right-8">
            <div
              className="pointer-events-auto inline-flex max-w-full flex-wrap items-center justify-start gap-1.5 rounded-[1.25rem] border border-white/10 bg-black/45 px-2 py-1.5 shadow-xl backdrop-blur-md sm:max-w-[min(82vw,34rem)] sm:justify-end sm:gap-2 sm:rounded-full sm:px-2.5 sm:py-2"
              onClick={(event) => event.stopPropagation()}
            >
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[7px] font-black uppercase tracking-[0.12em] text-zinc-200 sm:px-2.5 sm:py-1 sm:text-[9px]">
                {pledgeMatch.status === 'settled'
                  ? pledgeMatch.isDraw
                    ? 'Draw'
                    : pledgeMatch.winnerUserId === user?._id
                      ? 'Won'
                      : 'Settled'
                  : pledgeMatch.status === 'disputed'
                    ? 'Disputed'
                    : pledgeMatch.resultClaim?.status === 'pending'
                      ? pledgeMatch.resultClaim.claimedByUserId === user?._id
                        ? 'Waiting'
                        : `${pledgeMatch.resultClaim.outcome} pending`
                      : 'Result'}
              </span>
              {canMakePledgeClaim && (
                <>
                  <button
                    onClick={() => void handlePledgeClaim('win')}
                    className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-[7px] font-black uppercase tracking-[0.12em] text-emerald-300 sm:px-3 sm:py-1.5 sm:text-[9px]"
                  >
                    Win
                  </button>
                  <button
                    onClick={() => void handlePledgeClaim('loss')}
                    className="rounded-full bg-rose-500/20 px-2.5 py-1 text-[7px] font-black uppercase tracking-[0.12em] text-rose-200 sm:px-3 sm:py-1.5 sm:text-[9px]"
                  >
                    Lose
                  </button>
                  <button
                    onClick={() => void handlePledgeClaim('draw')}
                    className="rounded-full bg-white/10 px-2.5 py-1 text-[7px] font-black uppercase tracking-[0.12em] text-white sm:px-3 sm:py-1.5 sm:text-[9px]"
                  >
                    Draw
                  </button>
                </>
              )}
              {pendingClaim && isClaimOwner && (
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-[7px] font-black uppercase tracking-[0.12em] text-zinc-300 sm:px-3 sm:py-1.5 sm:text-[9px]">
                  Waiting for response
                </span>
              )}
              {pendingClaim && (
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-[7px] font-black uppercase tracking-[0.12em] text-zinc-200 sm:px-3 sm:py-1.5 sm:text-[9px]">
                  {pendingClaim.claimedByUsername} claimed {pendingClaim.outcome}
                </span>
              )}
              {pendingClaim?.note && (
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-[7px] font-black uppercase tracking-[0.12em] text-zinc-300 sm:px-3 sm:py-1.5 sm:text-[9px]">
                  {pendingClaim.note}
                </span>
              )}
              {canRespondToClaim && (
                <>
                  <button
                    onClick={() => void handlePledgeClaimDecision('reject')}
                    className="rounded-full bg-rose-500/20 px-2.5 py-1 text-[7px] font-black uppercase tracking-[0.12em] text-rose-200 sm:px-3 sm:py-1.5 sm:text-[9px]"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => void handlePledgeClaimDecision('approve')}
                    className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-[7px] font-black uppercase tracking-[0.12em] text-emerald-300 sm:px-3 sm:py-1.5 sm:text-[9px]"
                  >
                    Accept
                  </button>
                </>
              )}
              <button
                onClick={() =>
                  pledgeMatch.status === 'disputed'
                    ? navigate(`/disputes/${pledgeMatch._id}`)
                    : void handlePledgeClaim('dispute')
                }
                disabled={pledgeMatch.status === 'settled'}
                className="rounded-full bg-brand-primary/20 px-2.5 py-1 text-[7px] font-black uppercase tracking-[0.12em] text-brand-primary sm:px-3 sm:py-1.5 sm:text-[9px]"
              >
                {pledgeMatch.status === 'disputed' ? 'Open' : 'Dispute'}
              </button>
            </div>
          </div>
        )}

        <StreamFooter
          isInvitedPending={isInvitedPending}
          isSubmitting={isSubmitting || isStreamEndedForViewer}
          hostUsername={host?.username}
          streamDescription={stream?.description}
          comments={comments}
          message={isStreamEndedForViewer ? '' : message}
          onMessageChange={setMessage}
          onSubmitMessage={(event) => {
            void handleSendMessage(event);
          }}
          onAcceptInvite={() => void handleAcceptInvite()}
          onDeclineInvite={() => void handleLeaveLive()}
          onOpenControls={() => {
            if (isParticipantView) {
              setShowControlSheet(true);
            }
          }}
          canOpenControls={isParticipantView}
        />

        <StreamControlSheet
          open={showControlSheet && isParticipantView}
          stream={stream}
          isHostView={isHostView}
          isCoStreamerView={isCoStreamerView}
          isPledgeStream={isPledgeStream}
          canRespondToClaim={canRespondToClaim}
          canClaimPledge={canMakePledgeClaim}
          canChangeOrientation={isHostView}
          pendingClaimLabel={
            pendingClaim
              ? `${pendingClaim.claimedByUsername} claimed ${pendingClaim.outcome}${pendingClaim.note ? ` · ${pendingClaim.note}` : ''}`
              : null
          }
          isMicMuted={isMicMuted}
          isCameraPaused={isCameraPaused}
          isScreenSharing={isScreenSharing}
          isRecording={isRecording}
          isSavingRecording={isSavingRecording}
          hasSharedFile={Boolean(sharingFileName)}
          onClose={() => setShowControlSheet(false)}
          onToggleMute={() => void handleToggleMute()}
          onToggleCamera={() => void handleToggleCamera()}
          onSwitchCamera={() => void handleSwitchCamera()}
          onToggleScreenShare={() => void handleToggleScreenShare()}
          onShareFile={() => handleOpenFilePicker()}
          onToggleRecording={() => void toggleRecording()}
          onOpenInviteModal={() => setIsInviting(true)}
          onLeaveLive={() => void handleLeaveLive()}
          onStopStream={() => void handleStopStream()}
          onChangeOrientation={(orientation) => {
            void handleChangeOrientation(orientation);
          }}
          onClaimPledge={(outcome) => {
            void handlePledgeClaim(outcome);
          }}
          onPledgeClaimDecision={(decision) => {
            void handlePledgeClaimDecision(decision);
          }}
        />

        {streamEndedOverlay && !isHostView && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/82 px-6 text-center backdrop-blur-md">
            <div className="w-full max-w-xl rounded-[2.5rem] border border-white/10 bg-[#0f0b21]/90 px-8 py-10 shadow-2xl">
              <p className="text-[10px] font-black uppercase tracking-[0.34em] text-brand-accent">
                Live Ended
              </p>
              <h2 className="mt-4 text-xl font-black uppercase italic text-white sm:text-2xl">
                {streamEndedOverlay.hostUsername} ended the live
              </h2>
              <p className="mt-3 text-xs leading-relaxed text-zinc-300 sm:text-sm">
                Redirecting in {streamEndedOverlay.countdownSeconds} second{streamEndedOverlay.countdownSeconds === 1 ? '' : 's'}.
              </p>
            </div>
          </div>
        )}
      </div>

      <GiftModal
        open={isGifting && !isStreamEndedForViewer}
        host={host}
        giftAmount={giftAmount}
        isSubmitting={isSubmitting || isStreamEndedForViewer}
        onClose={() => setIsGifting(false)}
        onGiftAmountChange={setGiftAmount}
        onSubmit={handleGift}
      />

      <InvitePlayersModal
        open={isInviting}
        canShow={isHostView && !isPledgeStream}
        pendingInvites={pendingInvites}
        joinRequests={pendingJoinRequests}
        inviteCandidates={inviteCandidates}
        onClose={() => setIsInviting(false)}
        onInvite={(targetUserId) => {
          void handleInvite(targetUserId);
        }}
        onAcceptJoinRequest={(targetUserId) => {
          void handleAcceptJoinRequest(targetUserId);
        }}
        onDeclineJoinRequest={(targetUserId) => {
          void handleDeclineJoinRequest(targetUserId);
        }}
        onRemoveParticipant={(participantUserId, participantUsername) => {
          void handleRemoveParticipant(participantUserId, participantUsername);
        }}
      />

      <ShareStreamModal
        open={isShareModalOpen && !isStreamEndedForViewer}
        hostUsername={host?.username}
        friends={friends}
        isSharingToFollowers={isSharingToFollowers}
        sendingFriendUserId={sendingShareUserId}
        onClose={() => {
          if (isSharingToFollowers || sendingShareUserId) {
            return;
          }
          setIsShareModalOpen(false);
        }}
        onShareToFriend={(targetUserId) => {
          void handleShareToFriend(targetUserId);
        }}
        onShareToFollowers={() => {
          void handleShareToFollowers();
        }}
      />

      <input
        ref={fileShareInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={(event) => {
          void handleFileSelection(event);
        }}
      />
    </div>
  );
}
