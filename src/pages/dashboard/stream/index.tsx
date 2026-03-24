import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Room, RoomEvent, Track, type Participant, type TrackPublication } from 'livekit-client';
import {
  Circle,
  ChevronLeft,
  Gift,
  Heart,
  Mic,
  MicOff,
  Radio,
  Send,
  Share2,
  Shield,
  UserPlus,
  UserRoundPlus,
  Video,
  VideoOff,
  X,
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useStream } from '../../../hooks/useStream';
import { useSocial } from '../../../hooks/useSocial';
import { useToast } from '../../../components/ToastProvider';
import { StreamCommentStack } from './components/StreamCommentStack';
import { StreamIconButton } from './components/StreamIconButton';
import { StreamStageGrid, type VideoTile } from './components/StreamStageGrid';

type FloatingHeart = {
  id: number;
  left: number;
  size: number;
  rotate: number;
};

type ActivityOverlay = {
  id: number;
  message: string;
  accent: 'like' | 'gift' | 'join';
};

function participantLabel(participant: Participant) {
  return participant.name || participant.identity || 'Streamer';
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
  } = useStream();
  const { discoverUsers, sendRequest, fetchSocial } = useSocial(true);
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
  const [videoTiles, setVideoTiles] = useState<VideoTile[]>([]);
  const [audioTracks, setAudioTracks] = useState<Array<{ id: string; track: Track }>>([]);
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const [activityOverlays, setActivityOverlays] = useState<ActivityOverlay[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [mediaStates, setMediaStates] = useState<Record<string, { username: string; isMuted: boolean; isCameraOff: boolean }>>({});
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
  const host = stream?.participants.find((participant) => participant.role === 'host') ?? stream?.participants[0];
  const currentParticipant = stream?.participants.find((participant) => participant.userId === user?._id);
  const isHostView = Boolean(user?._id && stream?.hostUserId === user._id);
  const isPledgeStream = stream?.mode === 'pledge';
  const isParticipantView = currentParticipant?.role === 'host' || currentParticipant?.role === 'guest';
  const isInvitedPending = currentParticipant?.role === 'invited';
  const isCoStreamerView = currentParticipant?.role === 'guest' && !isHostView;
  const pendingInvites = useMemo(
    () => (stream?.participants ?? []).filter((participant) => participant.role === 'invited'),
    [stream?.participants],
  );
  const heroImage = useMemo(() => `https://picsum.photos/seed/${stream?._id ?? 'stream'}/1600/900`, [stream?._id]);
  const floatingComments = useMemo(() => comments.slice(-5), [comments]);
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

    const id = Date.now();
    const countLabel = recentLike.likerCount && recentLike.likerCount > 1 ? ` x${recentLike.likerCount}` : '';
    setActivityOverlays((current) => [...current.slice(-2), { id, message: `${recentLike.likedBy}${countLabel}`, accent: 'like' }]);
    const timeout = window.setTimeout(() => {
      setActivityOverlays((current) => current.filter((entry) => entry.id !== id));
    }, 2200);

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
    }, 2200);

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

    toast.info('The streamer has ended this live.', { title: 'Live Ended' });
    navigate('/home');
  }, [navigate, recentStreamStopped, resolvedStreamId, toast]);

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
      try {
        const details = await getConnectionDetails(resolvedStreamId);
        const room = new Room({ adaptiveStream: true, dynacast: true });
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

        room.on(RoomEvent.Disconnected, () => {
          setConnectionStatus('idle');
          setVideoTiles([]);
          setAudioTracks([]);
        });

        await room.connect(details.url, details.token);
        if (disposed) {
          await room.disconnect();
          return;
        }

        if (details.canPublish) {
          await room.localParticipant.setCameraEnabled(true);
          await room.localParticipant.setMicrophoneEnabled(true);
          setIsMicMuted(false);
          setIsCameraPaused(false);
          updateMediaState(resolvedStreamId, {
            isMuted: false,
            isCameraOff: false,
          });
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
      } catch (err: any) {
        setConnectionStatus('error');
        toast.error(err?.response?.data?.message ?? 'Unable to connect to the live room.');
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
  }, [resolvedStreamId, toast, user?._id, user?.username]);

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
    const localAudioTrack = Array.from(
      livekitRoomRef.current?.localParticipant.audioTrackPublications.values() ?? [],
    ).find((publication) => publication.track)?.track;
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

  if (!resolvedStreamId && !loading) {
    return (
      <div className="min-h-screen bg-[#0a0817] px-6 py-10 text-white">
        <div className="mx-auto max-w-xl rounded-[3rem] border border-white/10 bg-[#141128] p-10 text-center">
          <Radio size={34} className="mx-auto text-brand-primary" />
          <h1 className="mt-5 text-3xl font-black uppercase italic">{shouldStartLive ? 'Go Live' : 'No Active Streams'}</h1>
          <p className="mt-4 text-zinc-400">Start a live session so other players can find you, follow you, and join your game.</p>
          <button onClick={() => setIsStarting(true)} className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-brand-primary px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-brand-accent hover:text-black">
            <Radio size={16} />
            Start Streaming
          </button>
        </div>

        <AnimatePresence>
          {isStarting && (
            <div className="fixed inset-0 z-100 flex items-center justify-center bg-[#0f0b21]/90 p-6 backdrop-blur-md">
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md rounded-[3rem] border border-white/10 bg-brand-deep p-10">
                <button onClick={() => setIsStarting(false)} className="absolute right-8 top-8 text-zinc-500 hover:text-white">
                  <X size={24} />
                </button>
                <h2 className="mb-8 text-2xl font-black uppercase italic text-white">Go Live</h2>
                <form onSubmit={handleStartStream} className="space-y-5">
                  <input value={startForm.title} onChange={(event) => setStartForm((current) => ({ ...current, title: event.target.value }))} placeholder="Stream title" className="w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-white focus:border-brand-primary/50 focus:outline-none" required />
                  <input value={startForm.category} onChange={(event) => setStartForm((current) => ({ ...current, category: event.target.value }))} placeholder="Category" className="w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-white focus:border-brand-primary/50 focus:outline-none" />
                  <textarea value={startForm.description} onChange={(event) => setStartForm((current) => ({ ...current, description: event.target.value }))} placeholder="What are you streaming?" className="min-h-28 w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-white focus:border-brand-primary/50 focus:outline-none" />
                  <button type="submit" disabled={isSubmitting} className="w-full rounded-2xl bg-brand-primary py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-brand-accent hover:text-black disabled:opacity-50">
                    {isSubmitting ? 'Starting...' : 'Start Live'}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
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
          isHostView={isHostView}
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
            <h2 className="mt-3 text-2xl font-black uppercase italic text-white sm:text-4xl">{stream?.title ?? 'Live Session'}</h2>
            <p className="mt-2 max-w-xl text-sm text-zinc-300 sm:text-base">
              {connectionStatus === 'error'
                ? 'The live room could not be reached. Check your LiveKit configuration and reconnect.'
                : isHostView
                  ? 'Your live camera feed will appear here as soon as publishing starts.'
                  : 'The streamer feed will appear here as soon as the host camera is live.'}
            </p>
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 bg-linear-to-b from-black/70 to-transparent px-4 pb-16 pt-4 sm:px-6 lg:px-8">
          <div className="pointer-events-auto flex items-start justify-between gap-3">
            <StreamIconButton
              title="Back"
              onClick={(event) => {
                event.stopPropagation();
                navigate(-1);
              }}
            >
              <ChevronLeft size={20} />
            </StreamIconButton>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 overflow-hidden rounded-2xl border-2 border-brand-primary bg-black/30 p-1">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${host?.username ?? stream?.title ?? 'streamer'}`} alt={host?.username ?? 'Host'} className="h-full w-full rounded-xl object-cover" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-black uppercase italic text-white sm:text-base">{host?.username ?? 'Live Host'}</p>
                    <Shield size={14} className="text-brand-primary" />
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300">
                    <span className="rounded-full bg-red-600 px-2.5 py-1 text-white">Live</span>
                    <span>{stream?.viewersCount ?? 0} Watching</span>
                    {isPledgeStream && <span className="rounded-full bg-brand-accent/20 px-2.5 py-1 text-brand-accent">Pledge</span>}
                    {connectionStatus === 'connecting' && <span>Connecting</span>}
                    {connectionStatus === 'error' && <span>Connection Error</span>}
                  </div>
                </div>
              </div>
              <p className="mt-3 max-w-xl text-sm font-medium text-zinc-200">{stream?.title ?? 'Live stream'}</p>
              {isHostView && pendingInvites.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {pendingInvites.map((participant) => (
                    <div
                      key={participant.userId}
                      className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-2 backdrop-blur-md"
                    >
                      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white">
                        {participant.username}
                      </span>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleRemoveParticipant(participant.userId, participant.username);
                        }}
                        className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-red-200 transition-colors hover:bg-red-500/20"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              {isHostView || isCoStreamerView ? (
                <>
                  {!isPledgeStream && (
                    isHostView && (
                      <StreamIconButton
                        title="Invite streamer"
                        onClick={(event) => {
                          event.stopPropagation();
                          setIsInviting(true);
                        }}
                      >
                        <UserRoundPlus size={16} />
                      </StreamIconButton>
                    )
                  )}
                  <StreamIconButton
                    title={isMicMuted ? 'Unmute microphone' : 'Mute microphone'}
                    active={isMicMuted}
                    onClick={(event) => {
                      event.stopPropagation();
                      void handleToggleMute();
                    }}
                  >
                    {isMicMuted ? <MicOff size={16} /> : <Mic size={16} />}
                  </StreamIconButton>
                  <StreamIconButton
                    title={isCameraPaused ? 'Resume camera' : 'Pause camera'}
                    active={isCameraPaused}
                    onClick={(event) => {
                      event.stopPropagation();
                      void handleToggleCamera();
                    }}
                  >
                    {isCameraPaused ? <VideoOff size={16} /> : <Video size={16} />}
                  </StreamIconButton>
                  <StreamIconButton
                    title={isRecording ? 'Stop recording' : 'Start recording'}
                    active={isRecording}
                    onClick={(event) => {
                      event.stopPropagation();
                      void toggleRecording();
                    }}
                    disabled={isSavingRecording}
                  >
                    <Circle size={16} fill="currentColor" />
                  </StreamIconButton>
                  {isCoStreamerView && (
                    <StreamIconButton
                      title="Leave live"
                      danger
                      onClick={(event) => {
                        event.stopPropagation();
                        void handleLeaveLive();
                      }}
                    >
                      <X size={16} />
                    </StreamIconButton>
                  )}
                  {isHostView && (
                    <StreamIconButton
                      title="End live"
                      danger
                      onClick={(event) => {
                        event.stopPropagation();
                        void handleStopStream();
                      }}
                    >
                      <Radio size={16} />
                    </StreamIconButton>
                  )}
                </>
              ) : (
                <>
                  {isInvitedPending && (
                    <>
                      <StreamIconButton
                        title="Accept invite"
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleAcceptInvite();
                        }}
                      >
                        <UserPlus size={16} />
                      </StreamIconButton>
                      <StreamIconButton
                        title="Decline invite"
                        danger
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleLeaveLive();
                        }}
                      >
                        <X size={16} />
                      </StreamIconButton>
                    </>
                  )}
                  <StreamIconButton
                    title="Follow host"
                    label="Follow"
                    disabled={isInvitedPending}
                    onClick={(event) => {
                      event.stopPropagation();
                      void handleFollowHost();
                    }}
                  >
                    <UserPlus size={16} />
                  </StreamIconButton>
                  <StreamIconButton
                    title="Share stream"
                    disabled={isInvitedPending}
                    onClick={(event) => {
                      event.stopPropagation();
                      void handleShare();
                    }}
                  >
                    <Share2 size={16} />
                  </StreamIconButton>
                </>
              )}
            </div>
          </div>
        </div>

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
                  : entry.accent === 'join'
                    ? 'border-white/15 bg-white/10 text-white'
                    : 'border-brand-primary/30 bg-brand-primary/20 text-brand-primary'
              }`}>
                {entry.message}
              </motion.div>
            ))}
          </AnimatePresence>

          {!isParticipantView && (
            <button onClick={(event) => { event.stopPropagation(); setIsGifting(true); }} className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white backdrop-blur-md">
              <Gift size={20} className="text-brand-accent" />
            </button>
          )}

          {!isParticipantView && (
            <div className="rounded-full border border-white/10 bg-black/30 px-3 py-2 text-center text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-md">
              <div className="flex items-center justify-center gap-1 text-brand-primary">
                <Heart size={14} fill="currentColor" />
                <span>{stream?.likesCount ?? 0}</span>
              </div>
              <p className="mt-1 text-[8px] text-zinc-400">Tap video to like</p>
            </div>
          )}
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-linear-to-t from-black via-black/55 to-transparent px-4 pb-4 pt-24 sm:px-6 lg:px-8">
          <div className="flex h-full flex-col justify-end gap-4">
            {isInvitedPending && (
              <div
                className="pointer-events-auto flex flex-col gap-4 rounded-4xl border border-brand-primary/25 bg-black/55 p-4 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between"
                onClick={(event) => event.stopPropagation()}
              >
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-brand-accent">
                    Invitation Pending
                  </p>
                  <p className="mt-2 text-sm text-zinc-200">
                    {host?.username ?? 'The host'} invited you to join on camera. Accept to go live with them, or decline to stay out of the stage.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => void handleLeaveLive()}
                    disabled={isSubmitting}
                    className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-white transition-colors hover:bg-white/10 disabled:opacity-50"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => void handleAcceptInvite()}
                    disabled={isSubmitting}
                    className="rounded-full bg-brand-primary px-5 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-white transition-colors hover:bg-brand-accent hover:text-black disabled:opacity-50"
                  >
                    {isSubmitting ? 'Updating...' : 'Accept Invite'}
                  </button>
                </div>
              </div>
            )}

            <StreamCommentStack comments={floatingComments} />

            <form onSubmit={(event) => { event.stopPropagation(); void handleSendMessage(event); }} className="pointer-events-auto flex items-center gap-3" onClick={(event) => event.stopPropagation()}>
              <div className="flex-1 rounded-full border border-white/10 bg-white/10 backdrop-blur-md">
                <input type="text" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Say something nice..." className="w-full bg-transparent px-5 py-3.5 text-sm text-white placeholder:text-zinc-400 focus:outline-none" />
              </div>
              <button type="submit" disabled={isSubmitting} className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary text-white disabled:opacity-50">
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isGifting && (
          <div className="fixed inset-0 z-100 flex items-center justify-center bg-[#0f0b21]/88 p-6 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 20 }} className="relative w-full max-w-md rounded-[2.5rem] border border-white/10 bg-brand-deep p-8 shadow-2xl">
              <button onClick={() => setIsGifting(false)} className="absolute right-6 top-6 text-zinc-500 hover:text-white">
                <X size={22} />
              </button>
              <div className="mb-8 text-center">
                <div className="mx-auto mb-5 h-20 w-20 overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-2">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${host?.username ?? 'host'}`} alt={host?.username ?? 'Host'} className="h-full w-full rounded-2xl object-cover" />
                </div>
                <h3 className="text-2xl font-black uppercase italic text-white">Gift {host?.username ?? 'Host'}</h3>
                <p className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Support the live host instantly.</p>
              </div>
              <form onSubmit={handleGift} className="space-y-6">
                <div>
                  <label className="ml-1 text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">Gift Amount</label>
                  <div className="relative mt-3">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-brand-primary">$</span>
                    <input type="number" min="1" step="0.01" value={giftAmount} onChange={(event) => setGiftAmount(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/40 py-4 pl-11 pr-5 font-black text-white focus:border-brand-primary/50 focus:outline-none" required />
                  </div>
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full rounded-2xl bg-brand-primary py-4 text-xs font-black uppercase tracking-[0.2em] text-white hover:bg-brand-accent hover:text-black disabled:opacity-50">
                  {isSubmitting ? 'Sending...' : 'Send Gift'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isInviting && isHostView && !isPledgeStream && (
          <div className="fixed inset-0 z-100 flex items-center justify-center bg-[#0f0b21]/88 p-6 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 20 }} className="relative w-full max-w-lg rounded-[2.5rem] border border-white/10 bg-brand-deep p-8 shadow-2xl">
              <button onClick={() => setIsInviting(false)} className="absolute right-6 top-6 text-zinc-500 hover:text-white">
                <X size={22} />
              </button>
              <h3 className="mb-6 text-2xl font-black uppercase italic text-white">Invite Players</h3>
              <div className="max-h-[50vh] space-y-6 overflow-y-auto pr-2">
                {pendingInvites.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">
                      Pending Invites
                    </p>
                    {pendingInvites.map((participant) => (
                      <div key={participant.userId} className="flex items-center justify-between gap-4 rounded-4xl border border-white/10 bg-white/5 p-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black uppercase italic text-white">
                            {participant.username}
                          </p>
                          <p className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-brand-accent">
                            Awaiting response
                          </p>
                        </div>
                        <button
                          onClick={() => void handleRemoveParticipant(participant.userId, participant.username)}
                          className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-red-200 transition-colors hover:bg-red-500/20"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">
                    Invite More Players
                  </p>
                {inviteCandidates.length ? inviteCandidates.map((candidate) => (
                  <div key={candidate.id} className="flex items-center justify-between gap-4 rounded-4xl border border-white/10 bg-white/5 p-4">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="h-12 w-12 overflow-hidden rounded-2xl border border-white/10">
                        <img src={candidate.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${candidate.username}`} alt={candidate.username} className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black uppercase italic text-white">{candidate.fullName || candidate.username}</p>
                        <p className="truncate text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">@{candidate.username}</p>
                      </div>
                    </div>
                    <button onClick={() => void handleInvite(candidate.id)} className="rounded-xl bg-brand-primary px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-brand-accent hover:text-black">
                      Invite
                    </button>
                  </div>
                )) : (
                  <div className="rounded-4xl border border-white/10 bg-white/5 px-6 py-10 text-center text-zinc-500">
                    No more users available to invite right now.
                  </div>
                )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
