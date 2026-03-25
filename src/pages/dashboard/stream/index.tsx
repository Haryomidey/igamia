import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Room, RoomEvent, Track, type Participant, type TrackPublication } from 'livekit-client';
import {
  Gift,
  Heart,
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useStream } from '../../../hooks/useStream';
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
} from './components/StreamModals';

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

function participantLabel(participant: Participant) {
  return participant.name || participant.identity || 'Streamer';
}

function hasTrackPublication(
  value: unknown,
): value is { track?: { mediaStreamTrack?: MediaStreamTrack } } {
  return typeof value === 'object' && value !== null && 'track' in value;
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
    recentStreamStopped,
    loading,
    error,
    fetchActiveStreams,
    fetchStream,
    likeStream,
    shareStream,
    commentOnStream,
    giftStream,
    updateMediaState,
    connect,
    joinRoom,
    leaveRoom,
    inviteStreamer,
    acceptInvite,
    removeParticipant,
    leaveStreamParticipation,
    stopStream,
    startStream,
    getConnectionDetails,
    saveRecording,
    disconnect,
  } = useStream();
  const { discoverUsers, sendRequest, fetchSocial } = useSocial(true);
  const { fetchMatch, submitResultClaim, respondToResultClaim } = usePledges(false);
  const toast = useToast();

  const [message, setMessage] = useState('');
  const [isGifting, setIsGifting] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [giftAmount, setGiftAmount] = useState('10');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSavingRecording, setIsSavingRecording] = useState(false);
  const [recordingStartedAt, setRecordingStartedAt] = useState<number | null>(null);
  const [recordingDurationSeconds, setRecordingDurationSeconds] = useState(0);
  const [videoTiles, setVideoTiles] = useState<VideoTile[]>([]);
  const [audioTracks, setAudioTracks] = useState<Array<{ id: string; track: Track }>>([]);
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const [activityOverlays, setActivityOverlays] = useState<ActivityOverlay[]>([]);
  const [likeTicker, setLikeTicker] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [roomReconnectKey, setRoomReconnectKey] = useState(0);
  const [mediaStates, setMediaStates] = useState<Record<string, { username: string; isMuted: boolean; isCameraOff: boolean }>>({});
  const [pledgeMatch, setPledgeMatch] = useState<MatchActivity | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraPaused, setIsCameraPaused] = useState(false);
  const [startForm, setStartForm] = useState({
    title: '',
    description: '',
    category: 'General',
  });
  const audioContainerRef = useRef<HTMLDivElement | null>(null);
  const livekitRoomRef = useRef<Room | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const stageVideoElementsRef = useRef<Record<string, HTMLVideoElement | null>>({});

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
  const isHostView = Boolean(user?._id && stream?.hostUserId === user._id);
  const isPledgeStream = stream?.mode === 'pledge';
  const isParticipantView = currentParticipant?.role === 'host' || currentParticipant?.role === 'guest';
  const canBrowseStreams = !isParticipantView && activeStreams.length > 1 && activeStreamIndex >= 0;
  const isInvitedPending = currentParticipant?.role === 'invited';
  const isCoStreamerView = currentParticipant?.role === 'guest' && !isHostView;
  const canRemoveParticipants = isHostView && !isPledgeStream;
  const pendingClaim = pledgeMatch?.resultClaim?.status === 'pending' ? pledgeMatch.resultClaim : null;
  const isClaimOwner = Boolean(pendingClaim?.claimedByUserId && pendingClaim.claimedByUserId === user?._id);
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
  const removableParticipants = useMemo(
    () => (stream?.participants ?? []).filter((participant) => participant.role !== 'host'),
    [stream?.participants],
  );
  const heroImage = useMemo(() => `https://picsum.photos/seed/${stream?._id ?? 'stream'}/1600/900`, [stream?._id]);
  const inviteCandidates = useMemo(() => {
    const participantIds = new Set(stream?.participants.map((participant) => participant.userId) ?? []);
    return discoverUsers.filter((candidate) => !participantIds.has(candidate.id) && candidate.id !== user?._id);
  }, [discoverUsers, stream?.participants, user?._id]);
  const primaryTile = useMemo(
    () => videoTiles.find((tile) => tile.participantUserId === user?._id) ?? videoTiles[0] ?? null,
    [user?._id, videoTiles],
  );
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
    setActivityOverlays((current) => [...current.slice(-2), { id, message: `${recentGift.giftedBy} sent $${recentGift.amount.toFixed(2)}`, accent: 'gift' }]);
    const timeout = window.setTimeout(() => {
      setActivityOverlays((current) => current.filter((entry) => entry.id !== id));
    }, 3200);

    return () => window.clearTimeout(timeout);
  }, [recentGift, resolvedStreamId]);

  useEffect(() => {
    if (!recentLike || recentLike.streamId !== resolvedStreamId) {
      return;
    }

    if (!isHostView) {
      return;
    }

    const countLabel = recentLike.likerCount && recentLike.likerCount > 1 ? ` x${recentLike.likerCount}` : '';
    setLikeTicker(`${recentLike.likedBy}${countLabel} liked`);
    const timeout = window.setTimeout(() => {
      setLikeTicker(null);
    }, 1800);

    return () => window.clearTimeout(timeout);
  }, [isHostView, recentLike, resolvedStreamId]);

  useEffect(() => {
    if (
      !recentViewerJoin ||
      recentViewerJoin.streamId !== resolvedStreamId ||
      !recentViewerJoin.joinedUsername ||
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
  }, [recentViewerJoin, resolvedStreamId, user?.username]);

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
    if (!recentParticipantRemoved || recentParticipantRemoved.streamId !== resolvedStreamId) {
      return;
    }

    if (recentParticipantRemoved.removedUserId === user?._id) {
      if (recentParticipantRemoved.reason === 'removed') {
        toast.info('You were removed from this live by the host.', { title: 'Removed From Live' });
      }
      navigate('/home');
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

    setVideoTiles([]);
    setAudioTracks([]);
    setActivityOverlays([]);
    setLikeTicker(null);
    toast.info('Live stream has been ended.', { title: 'Live Ended' });
    if (recentStreamStopped.redirectToDispute && isParticipantView && stream?.matchId) {
      navigate(`/disputes/${stream.matchId}`);
      return;
    }
    navigate('/home');
  }, [isParticipantView, navigate, recentStreamStopped, resolvedStreamId, stream?.matchId, toast]);

  useEffect(() => {
    if (!resolvedStreamId || !user?._id || !user.username) {
      return;
    }

    let disposed = false;

    const addVideoTrack = (track: Track, participant: Participant, isLocal: boolean) => {
      if (track.kind !== Track.Kind.Video) {
        return;
      }

      const id = `${participant.sid}-${track.sid}`;
      const participantUserId = participant.identity || participant.sid;
      setVideoTiles((current) => {
        const next = current.filter((tile) => tile.id !== id);
        next.push({ id, participantUserId, participantName: participantLabel(participant), isLocal, track });
        next.sort((left, right) => Number(right.isLocal) - Number(left.isLocal));
        return next;
      });
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

    const connectToRoom = async () => {
      setConnectionStatus('connecting');
      for (let attempt = 0; attempt < 2; attempt += 1) {
        let room: Room | null = null;
        try {
          const details = await getConnectionDetails(resolvedStreamId);
          room = new Room({ adaptiveStream: true, dynacast: true });
          livekitRoomRef.current = room;

          room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
            const id = `${participant.sid}-${publication.trackSid}`;
            if (track.kind === Track.Kind.Video) {
              addVideoTrack(track, participant, false);
              return;
            }
            if (track.kind === Track.Kind.Audio) {
              setAudioTracks((current) => [...current.filter((entry) => entry.id !== id), { id, track }]);
            }
          });

          room.on(RoomEvent.TrackUnsubscribed, (_track, publication, participant) => {
            removeTrack(participant, publication);
          });

          room.on(RoomEvent.LocalTrackPublished, (publication, participant) => {
            if (publication.track?.kind === Track.Kind.Video) {
              addVideoTrack(publication.track, participant, true);
            }
          });

          room.on(RoomEvent.LocalTrackUnpublished, (publication, participant) => {
            removeTrack(participant, publication);
          });

          room.on(RoomEvent.ParticipantDisconnected, (participant) => {
            setVideoTiles((current) => current.filter((tile) => !tile.id.startsWith(`${participant.sid}-`)));
            setAudioTracks((current) => current.filter((entry) => !entry.id.startsWith(`${participant.sid}-`)));
          });

          room.on(RoomEvent.Reconnecting, () => {
            setConnectionStatus('connecting');
          });

          room.on(RoomEvent.Reconnected, () => {
            setConnectionStatus('connected');
          });

          room.on(RoomEvent.Disconnected, () => {
            setConnectionStatus((current) => (disposed ? current : 'idle'));
            setVideoTiles([]);
            setAudioTracks([]);
          });

          await room.connect(details.url, details.token);
          if (disposed) {
            await room.disconnect();
            return;
          }

          room.remoteParticipants.forEach((participant) => {
            participant.trackPublications.forEach((publication) => {
              if (!publication.track) {
                return;
              }
              if (publication.track.kind === Track.Kind.Video) {
                addVideoTrack(publication.track, participant, false);
                return;
              }
              if (publication.track.kind === Track.Kind.Audio) {
                const id = `${participant.sid}-${publication.trackSid}`;
                setAudioTracks((current) => [...current.filter((entry) => entry.id !== id), { id, track: publication.track }]);
              }
            });
          });

          room.localParticipant.videoTrackPublications.forEach((publication) => {
            if (publication.track) {
              addVideoTrack(publication.track, room.localParticipant, true);
            }
          });

          setConnectionStatus('connected');

          if (details.canPublish) {
            try {
              await room.localParticipant.setCameraEnabled(true);
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

          if (disposed) {
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
      mediaRecorderRef.current?.stop();
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
    if (!resolvedStreamId || isParticipantView) {
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
    if (!resolvedStreamId || !message.trim()) {
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
    if (!resolvedStreamId) {
      return;
    }

    try {
      setIsSubmitting(true);
      await giftStream(resolvedStreamId, {
        amount: Number(giftAmount),
        description: `Gift sent during ${stream?.title ?? 'live stream'}`,
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
    if (!resolvedStreamId) {
      return;
    }

    try {
      const result = await shareStream(resolvedStreamId);
      const shareUrl = result.data?.shareUrl ?? stream?.shareUrl;
      if (shareUrl) {
        await navigator.clipboard.writeText(shareUrl);
      }
      toast.success('Live link copied.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to share stream.');
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
      await fetchStream(resolvedStreamId);
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
      await fetchStream(resolvedStreamId);
      toast.success('You joined the live.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to accept invite.');
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
      toast.success(isInvitedPending ? 'Live invite declined.' : 'You left the live.');
      navigate('/home');
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

    try {
      setConnectionStatus('connecting');
      setVideoTiles([]);
      setAudioTracks([]);
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
    }
  };

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

    const stageVideoElement = stageVideoElementsRef.current[primaryTile.participantUserId];
    const captureStream =
      stageVideoElement && typeof stageVideoElement.captureStream === 'function'
        ? stageVideoElement.captureStream()
        : null;
    const videoTrack =
      captureStream?.getVideoTracks()[0] ??
      ((primaryTile.track as any)?.mediaStreamTrack as MediaStreamTrack | undefined);
    const localAudioPublication = Array.from(
      livekitRoomRef.current?.localParticipant.audioTrackPublications.values() ?? [],
    ).find(hasTrackPublication);
    const localAudioTrack = localAudioPublication?.track;
    const audioTrack =
      captureStream?.getAudioTracks()[0] ??
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
      await stopStream(resolvedStreamId);
      toast.success('Live stream ended.');
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
      const nextMatch = await fetchMatch(stream.matchId);
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

  return (
    <div className="fixed inset-0 overflow-hidden bg-black text-white">
      <div ref={audioContainerRef} className="hidden" aria-hidden="true" />

      <div className="relative h-full w-full touch-manipulation" onClick={() => void handleLike()}>
        <StreamStageGrid
          participants={stream?.participants ?? []}
          videoTiles={videoTiles}
          mediaStates={mediaStates}
          canRemoveParticipants={canRemoveParticipants}
          currentUserId={user?._id}
          heroImage={heroImage}
          onVideoElementChange={handleStageVideoElementChange}
          onRemoveParticipant={(participantUserId, participantUsername) => {
            void handleRemoveParticipant(participantUserId, participantUsername);
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(223,165,58,0.12),transparent_30%)]" />
        {!videoTiles.length && (
          <div className="pointer-events-none absolute inset-x-0 bottom-36 z-10 px-5 sm:bottom-40 sm:px-6 lg:px-8">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-primary">
              {connectionStatus === 'connecting' ? 'Connecting to room' : 'Waiting for live video'}
            </p>
            <h2
              title={stream?.title ?? 'Live Session'}
              className="mt-3 max-w-xl truncate text-xl font-black uppercase italic text-white sm:text-4xl"
            >
              {truncateText(stream?.title ?? 'Live Session', 68)}
            </h2>
            <p className="mt-2 max-w-xl text-xs text-zinc-300 sm:text-base">
              {connectionStatus === 'error'
                ? 'The live room could not be reached. Check your LiveKit configuration and reconnect.'
                : isHostView
                  ? 'Your live camera feed will appear here as soon as publishing starts.'
                  : 'The streamer feed will appear here as soon as the host camera is live.'}
            </p>
            {connectionStatus !== 'connected' && (
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  void handleReconnectToLive();
                }}
                className="pointer-events-auto mt-4 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white backdrop-blur-md transition-colors hover:bg-white/20 sm:text-xs"
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
          canRemoveParticipants={canRemoveParticipants}
          removableParticipants={removableParticipants}
          connectionStatus={connectionStatus}
          isMicMuted={isMicMuted}
          isCameraPaused={isCameraPaused}
          isRecording={isRecording}
          recordingDurationSeconds={recordingDurationSeconds}
          isSavingRecording={isSavingRecording}
          onBack={() => navigate(-1)}
          onPreviousStream={() => navigateToRelativeStream('previous')}
          onNextStream={() => navigateToRelativeStream('next')}
          canBrowseStreams={canBrowseStreams}
          onClose={() => navigate('/home')}
          onOpenInviteModal={() => setIsInviting(true)}
          onToggleMute={() => void handleToggleMute()}
          onToggleCamera={() => void handleToggleCamera()}
          onToggleRecording={() => void toggleRecording()}
          onLeaveLive={() => void handleLeaveLive()}
          onStopStream={() => void handleStopStream()}
          onAcceptInvite={() => void handleAcceptInvite()}
          onDeclineInvite={() => void handleLeaveLive()}
          onFollowHost={() => void handleFollowHost()}
          onShare={() => void handleShare()}
          onRemoveParticipant={(participantUserId, participantUsername) => {
            void handleRemoveParticipant(participantUserId, participantUsername);
          }}
        />

        <div className="pointer-events-none absolute inset-y-0 right-0 z-20 flex w-24 flex-col items-end justify-end gap-3 px-4 pb-32 sm:w-28 sm:px-6 sm:pb-36">
          <AnimatePresence>
            {floatingHearts.map((heart) => (
              <motion.div key={heart.id} initial={{ opacity: 0, y: 0, scale: 0.7 }} animate={{ opacity: 1, y: -160, scale: 1.1 }} exit={{ opacity: 0 }} transition={{ duration: 1.35, ease: 'easeOut' }} className="absolute bottom-24 text-brand-primary" style={{ right: `${100 - heart.left}%`, rotate: `${heart.rotate}deg` }}>
                <Heart size={heart.size} fill="currentColor" />
              </motion.div>
            ))}
          </AnimatePresence>

          <AnimatePresence>
            {activityOverlays.map((entry) => (
              <motion.div key={entry.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className={`max-w-56 rounded-2xl border px-3 py-2 text-right text-[11px] font-black uppercase tracking-[0.18em] backdrop-blur-md ${
                entry.accent === 'gift'
                  ? 'border-brand-accent/30 bg-brand-accent/20 text-brand-accent'
                  : 'border-white/15 bg-white/10 text-white'
              }`}>
                {entry.message}
              </motion.div>
            ))}
          </AnimatePresence>

          <AnimatePresence>
            {likeTicker && (
              <motion.div
                key={likeTicker}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="rounded-full border border-white/10 bg-black/35 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.14em] text-zinc-200 backdrop-blur-md sm:text-[9px]"
              >
                {likeTicker}
              </motion.div>
            )}
          </AnimatePresence>

          {!isParticipantView && (
            <button onClick={(event) => { event.stopPropagation(); setIsGifting(true); }} className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white backdrop-blur-md">
              <Gift size={20} className="text-brand-accent" />
            </button>
          )}

          <div className="rounded-full border border-white/10 bg-black/30 px-3 py-2 text-center text-[9px] font-black uppercase tracking-[0.16em] backdrop-blur-md sm:text-[10px] sm:tracking-[0.2em]">
            <div className="flex items-center justify-center gap-1 text-brand-primary">
              <Heart size={14} fill="currentColor" />
              <span>{stream?.likesCount ?? 0}</span>
            </div>
            <p className="mt-1 text-[8px] text-zinc-400">
              {isParticipantView ? 'Total likes' : 'Tap to like'}
            </p>
          </div>
        </div>

        {isPledgeStream && isParticipantView && pledgeMatch && (
          <div className="pointer-events-none absolute right-4 top-24 z-20 sm:right-6 sm:top-28 lg:right-8">
            <div
              className="pointer-events-auto inline-flex max-w-[min(82vw,34rem)] flex-wrap items-center justify-end gap-2 rounded-full border border-white/10 bg-black/45 px-2.5 py-2 shadow-xl backdrop-blur-md"
              onClick={(event) => event.stopPropagation()}
            >
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.16em] text-zinc-200 sm:text-[9px]">
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
              {pledgeMatch.status !== 'settled' &&
                pledgeMatch.status !== 'disputed' &&
                pledgeMatch.resultClaim?.status !== 'pending' && (
                <>
                  <button
                    onClick={() => void handlePledgeClaim('win')}
                    className="rounded-full bg-emerald-500/20 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.16em] text-emerald-300 sm:text-[9px]"
                  >
                    Win
                  </button>
                  <button
                    onClick={() => void handlePledgeClaim('loss')}
                    className="rounded-full bg-rose-500/20 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.16em] text-rose-200 sm:text-[9px]"
                  >
                    Lose
                  </button>
                  <button
                    onClick={() => void handlePledgeClaim('draw')}
                    className="rounded-full bg-white/10 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.16em] text-white sm:text-[9px]"
                  >
                    Draw
                  </button>
                </>
              )}
              {pendingClaim && isClaimOwner && (
                <span className="rounded-full bg-white/10 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.16em] text-zinc-300 sm:text-[9px]">
                  Waiting for response
                </span>
              )}
              {pendingClaim && (
                <span className="rounded-full bg-white/10 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.16em] text-zinc-200 sm:text-[9px]">
                  {pendingClaim.claimedByUsername} claimed {pendingClaim.outcome}
                </span>
              )}
              {pendingClaim?.note && (
                <span className="rounded-full bg-white/10 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.16em] text-zinc-300 sm:text-[9px]">
                  {pendingClaim.note}
                </span>
              )}
              {canRespondToClaim && (
                <>
                  <button
                    onClick={() => void handlePledgeClaimDecision('reject')}
                    className="rounded-full bg-rose-500/20 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.16em] text-rose-200 sm:text-[9px]"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => void handlePledgeClaimDecision('approve')}
                    className="rounded-full bg-emerald-500/20 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.16em] text-emerald-300 sm:text-[9px]"
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
                className="rounded-full bg-brand-primary/20 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.16em] text-brand-primary sm:text-[9px]"
              >
                {pledgeMatch.status === 'disputed' ? 'Open' : 'Dispute'}
              </button>
            </div>
          </div>
        )}

        <StreamFooter
          isInvitedPending={isInvitedPending}
          isSubmitting={isSubmitting}
          hostUsername={host?.username}
          streamDescription={stream?.description}
          comments={comments}
          message={message}
          onMessageChange={setMessage}
          onSubmitMessage={(event) => {
            void handleSendMessage(event);
          }}
          onAcceptInvite={() => void handleAcceptInvite()}
          onDeclineInvite={() => void handleLeaveLive()}
        />
      </div>

      <GiftModal
        open={isGifting}
        host={host}
        giftAmount={giftAmount}
        isSubmitting={isSubmitting}
        onClose={() => setIsGifting(false)}
        onGiftAmountChange={setGiftAmount}
        onSubmit={handleGift}
      />

      <InvitePlayersModal
        open={isInviting}
        canShow={isHostView && !isPledgeStream}
        pendingInvites={pendingInvites}
        inviteCandidates={inviteCandidates}
        onClose={() => setIsInviting(false)}
        onInvite={(targetUserId) => {
          void handleInvite(targetUserId);
        }}
        onRemoveParticipant={(participantUserId, participantUsername) => {
          void handleRemoveParticipant(participantUserId, participantUsername);
        }}
      />
    </div>
  );
}
