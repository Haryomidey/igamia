import React, { useEffect, useRef } from 'react';
import { MicOff, VideoOff, X } from 'lucide-react';
import { Track } from 'livekit-client';
import type { Stream } from '../../../../hooks/useStream';

export type VideoTile = {
  id: string;
  participantUserId: string;
  participantName: string;
  isLocal: boolean;
  track: Track;
};

function LiveVideoSurface({
  track,
  muted,
  isMirrored,
  participantUserId,
  onVideoElementChange,
}: {
  track: Track;
  muted: boolean;
  isMirrored: boolean;
  participantUserId: string;
  onVideoElementChange?: (participantUserId: string, element: HTMLVideoElement | null) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!videoRef.current || track.kind !== Track.Kind.Video) {
      return;
    }

    track.attach(videoRef.current);

    return () => {
      track.detach(videoRef.current!);
    };
  }, [track]);

  useEffect(() => {
    onVideoElementChange?.(participantUserId, videoRef.current);

    return () => {
      onVideoElementChange?.(participantUserId, null);
    };
  }, [onVideoElementChange, participantUserId]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={muted}
      className="h-full w-full object-cover"
      style={isMirrored ? { transform: 'scaleX(-1)' } : undefined}
    />
  );
}

function truncateLabel(value: string, maxLength = 18) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;
}

function normalizeLiveValue(value?: string | null) {
  return value?.trim().toLowerCase() ?? '';
}

function tileLayoutClass(count: number, index: number, orientation: Stream['orientation']) {
  if (count <= 1) {
    return 'h-full w-full';
  }

  if (orientation === 'horizontal') {
    if (count === 2) return 'h-full w-1/2';
    if (count === 3) return index < 2 ? 'h-full w-1/3' : 'h-1/2 w-full';
    return 'h-1/2 w-1/2';
  }

  if (count === 2) return 'h-1/2 w-full';
  if (count === 3) return index < 2 ? 'h-1/2 w-1/2' : 'h-1/2 w-full';
  return 'h-1/2 w-1/2';
}

export function StreamStageGrid({
  participants,
  videoTiles,
  mediaStates,
  orientation,
  canRemoveParticipants,
  currentUserId,
  heroImage,
  onRemoveParticipant,
  onVideoElementChange,
}: {
  participants: Stream['participants'];
  videoTiles: VideoTile[];
  mediaStates: Record<string, { username: string; isMuted: boolean; isCameraOff: boolean }>;
  orientation: Stream['orientation'];
  canRemoveParticipants: boolean;
  currentUserId?: string;
  heroImage: string;
  onRemoveParticipant: (participantUserId: string, participantUsername: string) => void;
  onVideoElementChange?: (participantUserId: string, element: HTMLVideoElement | null) => void;
}) {
  const stageParticipants = participants.filter((participant) => participant.role !== 'invited').slice(0, 4);
  const total = Math.max(stageParticipants.length, 1);

  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      {stageParticipants.map((participant, index) => {
        const tile = videoTiles.find((entry) => {
          const participantUserId = normalizeLiveValue(participant.userId);
          const participantUsername = normalizeLiveValue(participant.username);
          return (
            normalizeLiveValue(entry.participantUserId) === participantUserId ||
            normalizeLiveValue(entry.participantName) === participantUsername
          );
        });
        const state = mediaStates[participant.userId];
        const cameraOff = Boolean(state?.isCameraOff);
        const muted = Boolean(state?.isMuted);
        const showPlaceholder = cameraOff || !tile;
        const isCurrentUserTile = participant.userId === currentUserId;
        const isSelected = stageParticipants[0]?.userId === participant.userId;
        const isPipOverlay = orientation === 'pip' && index > 0;

        return (
          <div
            key={participant.userId}
            className={`absolute overflow-hidden border border-white/5 bg-black transition-all duration-500 ${
              isPipOverlay
                ? 'right-4 z-30 h-36 w-24 rounded-2xl shadow-2xl'
                : total <= 1
                  ? 'inset-0'
                  : ''
            } ${
              !isPipOverlay ? tileLayoutClass(total, index, orientation) : ''
            } ${
              orientation === 'vertical' && !isPipOverlay
                ? index === 0
                  ? 'left-0 top-0'
                  : index === 1
                    ? 'bottom-0 left-0'
                    : index === 2
                      ? 'bottom-0 right-0'
                      : 'right-0 top-0'
                : ''
            } ${
              orientation === 'horizontal' && !isPipOverlay
                ? index === 0
                  ? 'left-0 top-0'
                  : index === 1
                    ? 'right-0 top-0'
                    : index === 2
                      ? 'bottom-0 left-0'
                      : 'bottom-0 right-0'
                : ''
            } ${
              isSelected ? 'ring-2 ring-white/30' : 'opacity-95'
            }`}
            style={
              isPipOverlay
                ? { top: `${5 + (index - 1) * 9.5}rem` }
                : undefined
            }
          >
            {showPlaceholder ? (
              <div className="relative h-full w-full">
                <img
                  src={heroImage}
                  alt={participant.username}
                  className="h-full w-full object-cover opacity-45"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black via-black/60 to-black/35" />
                <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
                  <VideoOff size={20} className="text-white/85 sm:size-6" />
                  <p className="mt-2 text-[10px] font-black uppercase italic text-white sm:mt-3 sm:text-sm">
                    {participant.username}
                  </p>
                  <p className="mt-1 text-[7px] font-black uppercase tracking-[0.12em] text-zinc-300 sm:mt-1.5 sm:text-[10px] sm:tracking-[0.18em]">
                    {cameraOff
                      ? isCurrentUserTile
                        ? 'You paused video'
                        : `${participant.username} paused`
                      : isCurrentUserTile
                        ? 'Waiting for video'
                        : `Waiting for ${participant.username}`}
                  </p>
                </div>
              </div>
            ) : (
              <LiveVideoSurface
                track={tile.track}
                muted={tile.isLocal}
                isMirrored={tile.isLocal}
                participantUserId={participant.userId}
                onVideoElementChange={onVideoElementChange}
              />
            )}

            <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-black/35" />

            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3 sm:p-4">
              <div className="max-w-[72%] space-y-1">
                <div className="w-fit max-w-full truncate rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-white backdrop-blur-md sm:px-3 sm:text-[10px] sm:tracking-[0.18em]">
                  {truncateLabel(participant.username)}
                </div>
                {!isPipOverlay && (
                  <div className="w-fit rounded-full border border-white/10 bg-black/35 px-2 py-0.5 text-[7px] font-bold uppercase tracking-[0.12em] text-zinc-200 backdrop-blur-md sm:text-[9px]">
                    {participant.role === 'host' ? 'Host' : 'Guest'}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                {muted && (
                  <div className="rounded-full border border-white/10 bg-black/35 p-1.5 text-brand-accent backdrop-blur-md sm:p-2">
                    <MicOff size={12} />
                  </div>
                )}
                {cameraOff && (
                  <div className="rounded-full border border-white/10 bg-black/35 p-1.5 text-brand-accent backdrop-blur-md sm:p-2">
                    <VideoOff size={12} />
                  </div>
                )}
                {canRemoveParticipants && participant.userId !== currentUserId && (
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      onRemoveParticipant(participant.userId, participant.username);
                    }}
                    className="rounded-full border border-white/10 bg-black/35 p-1.5 text-zinc-300 backdrop-blur-md transition-colors hover:text-white sm:p-2"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {!stageParticipants.length && (
        <div className="h-full w-full overflow-hidden bg-black">
          <img src={heroImage} alt="Live stage" className="h-full w-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-black/30" />
        </div>
      )}
    </div>
  );
}
