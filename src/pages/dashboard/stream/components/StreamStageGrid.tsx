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

function tileLayoutClass(count: number, index: number) {
  if (count <= 1) {
    return 'col-span-2 row-span-2';
  }

  if (count === 2) {
    return 'col-span-2 row-span-1 sm:col-span-1 sm:row-span-2';
  }

  if (count === 3) {
    return index === 0
      ? 'col-span-2 row-span-1 sm:col-span-1 sm:row-span-2'
      : 'col-span-1 row-span-1';
  }

  return 'col-span-1 row-span-1';
}

function truncateLabel(value: string, maxLength = 18) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;
}

export function StreamStageGrid({
  participants,
  videoTiles,
  mediaStates,
  canRemoveParticipants,
  currentUserId,
  heroImage,
  onRemoveParticipant,
  onVideoElementChange,
}: {
  participants: Stream['participants'];
  videoTiles: VideoTile[];
  mediaStates: Record<string, { username: string; isMuted: boolean; isCameraOff: boolean }>;
  canRemoveParticipants: boolean;
  currentUserId?: string;
  heroImage: string;
  onRemoveParticipant: (participantUserId: string, participantUsername: string) => void;
  onVideoElementChange?: (participantUserId: string, element: HTMLVideoElement | null) => void;
}) {
  const stageParticipants = participants.filter((participant) => participant.role !== 'invited').slice(0, 4);
  const total = Math.max(stageParticipants.length, 1);

  return (
    <div className="absolute inset-0 grid grid-cols-2 grid-rows-[minmax(0,1.25fr)_minmax(0,0.85fr)] gap-1 bg-black p-1 pt-24 pb-40 sm:grid-rows-2 sm:gap-2 sm:p-2 sm:pt-28 sm:pb-28">
      {stageParticipants.map((participant, index) => {
        const tile = videoTiles.find((entry) => entry.participantUserId === participant.userId);
        const state = mediaStates[participant.userId];
        const cameraOff = Boolean(state?.isCameraOff);
        const muted = Boolean(state?.isMuted);
        const showPlaceholder = cameraOff || !tile;
        const isCurrentUserTile = participant.userId === currentUserId;

        return (
          <div
            key={participant.userId}
            className={`relative min-h-0 overflow-hidden rounded-[1.25rem] bg-black sm:rounded-[1.5rem] ${tileLayoutClass(total, index)}`}
          >
            {participant.role !== 'host' && (
              <div className="absolute inset-x-0 top-0 z-10 flex justify-start p-2 sm:p-4">
                <div
                  title={participant.username}
                  className="max-w-[75%] truncate rounded-full border border-white/10 bg-black/45 px-2 py-0.5 text-[7px] font-black uppercase tracking-[0.12em] text-white backdrop-blur-md sm:px-3 sm:py-1.5 sm:text-[10px] sm:tracking-[0.18em]"
                >
                  {truncateLabel(participant.username)}
                </div>
              </div>
            )}

            {showPlaceholder ? (
              <div className="relative h-full w-full">
                <img
                  src={heroImage}
                  alt={participant.username}
                  className="h-full w-full object-cover opacity-35 blur-[2px]"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black via-black/65 to-black/45" />
                <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
                  <VideoOff size={20} className="text-brand-accent sm:size-6" />
                  <p className="mt-2 text-[10px] font-black uppercase italic text-white sm:mt-4 sm:text-lg">
                    {participant.username}
                  </p>
                  <p className="mt-1 text-[7px] font-black uppercase tracking-[0.12em] text-zinc-300 sm:mt-2 sm:text-xs sm:tracking-[0.22em]">
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

            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-2 sm:p-4">
              <div className="max-w-[70%] truncate rounded-full border border-white/10 bg-black/35 px-2 py-0.5 text-[7px] font-black uppercase tracking-[0.12em] text-white backdrop-blur-md sm:px-3 sm:py-1.5 sm:text-[10px] sm:tracking-[0.18em]">
                {truncateLabel(participant.username)}
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
        <div className="col-span-2 row-span-2 overflow-hidden rounded-[1.75rem] bg-black">
          <img src={heroImage} alt="Live stage" className="h-full w-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-black/30" />
        </div>
      )}
    </div>
  );
}
