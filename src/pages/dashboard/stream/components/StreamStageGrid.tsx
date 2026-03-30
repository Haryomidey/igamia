import React, { useEffect, useRef } from 'react';
import { Monitor, MicOff, VideoOff, X } from 'lucide-react';
import { Track } from 'livekit-client';
import type { Stream } from '../../../../hooks/useStream';

export type VideoTile = {
  id: string;
  participantUserId: string;
  participantName: string;
  isLocal: boolean;
  track: Track;
  source: 'camera' | 'screen';
};

function LiveVideoSurface({
  track,
  muted,
  isMirrored,
  isScreenShare,
  participantUserId,
  onVideoElementChange,
}: {
  track: Track;
  muted: boolean;
  isMirrored: boolean;
  isScreenShare: boolean;
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
      className={`h-full w-full ${isScreenShare ? 'object-contain bg-black' : 'object-cover'}`}
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

  if (orientation === 'screen-only') {
    return 'h-full w-full';
  }

  if (orientation === 'grid') {
    if (count === 2) return 'h-full w-1/2';
    return 'h-1/2 w-1/2';
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

function ScreenShareBadge({ label }: { label: string }) {
  return (
    <div className="w-fit rounded-full border border-emerald-400/25 bg-emerald-500/15 px-2 py-0.5 text-[7px] font-bold uppercase tracking-[0.12em] text-emerald-200 backdrop-blur-md sm:text-[9px]">
      {label}
    </div>
  );
}

function RemoveTileButton({
  canRemoveParticipants,
  currentUserId,
  participantUserId,
  participantUsername,
  onRemoveParticipant,
}: {
  canRemoveParticipants: boolean;
  currentUserId?: string;
  participantUserId: string;
  participantUsername: string;
  onRemoveParticipant: (participantUserId: string, participantUsername: string) => void;
}) {
  if (!canRemoveParticipants || participantUserId === currentUserId) {
    return null;
  }

  return (
    <button
      onClick={(event) => {
        event.stopPropagation();
        onRemoveParticipant(participantUserId, participantUsername);
      }}
      className="absolute right-3 top-3 z-20 rounded-full border border-white/10 bg-black/45 p-1.5 text-zinc-300 backdrop-blur-md transition-colors hover:text-white"
    >
      <X size={12} />
    </button>
  );
}

function ParticipantPlaceholder({
  participant,
  heroImage,
  cameraOff,
  isCurrentUserTile,
}: {
  participant: Stream['participants'][number];
  heroImage: string;
  cameraOff: boolean;
  isCurrentUserTile: boolean;
}) {
  return (
    <div className="relative h-full w-full">
      <img src={heroImage} alt={participant.username} className="h-full w-full object-cover opacity-45" />
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
  );
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
  const screenTiles = videoTiles.filter((tile) => tile.source === 'screen');
  const hasScreenShare = screenTiles.length > 0;
  const primaryScreenTile =
    screenTiles.find((tile) => tile.isLocal) ??
    screenTiles.find((tile) => stageParticipants.some((participant) => participant.userId === tile.participantUserId)) ??
    screenTiles[0];

  const cameraParticipants = stageParticipants.map((participant) => ({
    participant,
    tile:
      videoTiles.find(
        (entry) =>
          entry.source === 'camera' &&
          normalizeLiveValue(entry.participantUserId) === normalizeLiveValue(participant.userId),
      ) ??
      videoTiles.find(
        (entry) =>
          entry.source === 'camera' &&
          normalizeLiveValue(entry.participantName) === normalizeLiveValue(participant.username),
      ),
  }));

  if (hasScreenShare && primaryScreenTile) {
    const sharingParticipant =
      stageParticipants.find((participant) => participant.userId === primaryScreenTile.participantUserId) ??
      stageParticipants[0];
    const screenState = sharingParticipant ? mediaStates[sharingParticipant.userId] : undefined;
    const sharingCamera = cameraParticipants.find(
      ({ participant }) => participant.userId === primaryScreenTile.participantUserId,
    );
    const otherCameras = cameraParticipants.filter(
      ({ participant }) => participant.userId !== primaryScreenTile.participantUserId,
    );
    const cameraStrip = orientation === 'screen-only' ? [] : sharingCamera ? [sharingCamera, ...otherCameras] : otherCameras;

    return (
      <div className="absolute inset-0 overflow-hidden bg-black">
        <div
          className={`absolute overflow-hidden ${
            orientation === 'vertical'
              ? 'inset-x-0 left-0 top-0 h-[72%]'
              : orientation === 'horizontal'
                ? 'inset-y-0 left-0 top-0 w-[74%]'
                : 'inset-0'
          }`}
        >
          <LiveVideoSurface
            track={primaryScreenTile.track}
            muted={primaryScreenTile.isLocal}
            isMirrored={false}
            isScreenShare
            participantUserId={primaryScreenTile.participantUserId}
            onVideoElementChange={onVideoElementChange}
          />
          <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-black/35" />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-3 sm:p-5">
            <div className="space-y-1.5">
              <div className="w-fit rounded-full border border-white/10 bg-black/45 px-3 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-white backdrop-blur-md sm:text-[10px]">
                {truncateLabel(sharingParticipant?.username ?? primaryScreenTile.participantName)} Screen
              </div>
              <ScreenShareBadge label={orientation === 'screen-only' ? 'Screen Only' : 'Screen Share'} />
            </div>
            {screenState?.isMuted && (
              <div className="rounded-full border border-white/10 bg-black/35 p-2 text-brand-accent backdrop-blur-md">
                <MicOff size={12} />
              </div>
            )}
          </div>
        </div>

        {orientation === 'horizontal' && cameraStrip.length > 0 && (
          <div className="absolute bottom-0 right-0 top-0 flex w-[26%] min-w-[14rem] flex-col gap-2 border-l border-white/10 bg-black/30 p-2 backdrop-blur-sm">
            {cameraStrip.slice(0, 3).map(({ participant, tile }) => {
              const state = mediaStates[participant.userId];
              const cameraOff = Boolean(state?.isCameraOff);
              const muted = Boolean(state?.isMuted);
              const showPlaceholder = cameraOff || !tile;
              const isCurrentUserTile = participant.userId === currentUserId;

              return (
                <div key={`${participant.userId}-screen-side`} className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-white/10 bg-black">
                  <RemoveTileButton
                    canRemoveParticipants={canRemoveParticipants}
                    currentUserId={currentUserId}
                    participantUserId={participant.userId}
                    participantUsername={participant.username}
                    onRemoveParticipant={onRemoveParticipant}
                  />
                  {showPlaceholder ? (
                    <ParticipantPlaceholder
                      participant={participant}
                      heroImage={heroImage}
                      cameraOff={cameraOff}
                      isCurrentUserTile={isCurrentUserTile}
                    />
                  ) : (
                    <LiveVideoSurface
                      track={tile.track}
                      muted={tile.isLocal}
                      isMirrored={tile.isLocal}
                      isScreenShare={false}
                      participantUserId={participant.userId}
                      onVideoElementChange={onVideoElementChange}
                    />
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-black/20" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3">
                    <div className="space-y-1">
                      <div className="w-fit rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-white backdrop-blur-md">
                        {truncateLabel(participant.username)}
                      </div>
                      <div className="w-fit rounded-full border border-white/10 bg-black/35 px-2 py-0.5 text-[7px] font-bold uppercase tracking-[0.12em] text-zinc-200 backdrop-blur-md">
                        {participant.userId === primaryScreenTile.participantUserId
                          ? 'Camera'
                          : participant.role === 'host'
                            ? 'Host'
                            : 'Guest'}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {muted && (
                        <div className="rounded-full border border-white/10 bg-black/35 p-1.5 text-brand-accent backdrop-blur-md">
                          <MicOff size={12} />
                        </div>
                      )}
                      {cameraOff && (
                        <div className="rounded-full border border-white/10 bg-black/35 p-1.5 text-brand-accent backdrop-blur-md">
                          <VideoOff size={12} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {orientation === 'vertical' && cameraStrip.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 flex h-[28%] gap-2 border-t border-white/10 bg-black/30 p-2 backdrop-blur-sm">
            {cameraStrip.slice(0, 3).map(({ participant, tile }) => {
              const state = mediaStates[participant.userId];
              const cameraOff = Boolean(state?.isCameraOff);
              const muted = Boolean(state?.isMuted);
              const showPlaceholder = cameraOff || !tile;
              const isCurrentUserTile = participant.userId === currentUserId;

              return (
                <div key={`${participant.userId}-screen-bottom`} className="relative min-w-0 flex-1 overflow-hidden rounded-2xl border border-white/10 bg-black">
                  <RemoveTileButton
                    canRemoveParticipants={canRemoveParticipants}
                    currentUserId={currentUserId}
                    participantUserId={participant.userId}
                    participantUsername={participant.username}
                    onRemoveParticipant={onRemoveParticipant}
                  />
                  {showPlaceholder ? (
                    <ParticipantPlaceholder
                      participant={participant}
                      heroImage={heroImage}
                      cameraOff={cameraOff}
                      isCurrentUserTile={isCurrentUserTile}
                    />
                  ) : (
                    <LiveVideoSurface
                      track={tile.track}
                      muted={tile.isLocal}
                      isMirrored={tile.isLocal}
                      isScreenShare={false}
                      participantUserId={participant.userId}
                      onVideoElementChange={onVideoElementChange}
                    />
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/75 via-transparent to-black/20" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3">
                    <div className="space-y-1">
                      <div className="w-fit rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-white backdrop-blur-md">
                        {truncateLabel(participant.username)}
                      </div>
                      <div className="w-fit rounded-full border border-white/10 bg-black/35 px-2 py-0.5 text-[7px] font-bold uppercase tracking-[0.12em] text-zinc-200 backdrop-blur-md">
                        {participant.userId === primaryScreenTile.participantUserId
                          ? 'Camera'
                          : participant.role === 'host'
                            ? 'Host'
                            : 'Guest'}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {muted && (
                        <div className="rounded-full border border-white/10 bg-black/35 p-1.5 text-brand-accent backdrop-blur-md">
                          <MicOff size={12} />
                        </div>
                      )}
                      {cameraOff && (
                        <div className="rounded-full border border-white/10 bg-black/35 p-1.5 text-brand-accent backdrop-blur-md">
                          <VideoOff size={12} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {orientation === 'pip' && cameraStrip.length > 0 && (
          <div className="absolute right-4 top-4 z-30 flex w-28 flex-col gap-3 sm:w-36">
            {cameraStrip.slice(0, 3).map(({ participant, tile }) => {
              const state = mediaStates[participant.userId];
              const cameraOff = Boolean(state?.isCameraOff);
              const muted = Boolean(state?.isMuted);
              const showPlaceholder = cameraOff || !tile;
              const isCurrentUserTile = participant.userId === currentUserId;

              return (
                <div
                  key={`${participant.userId}-screen-pip`}
                  className="relative aspect-[9/16] overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl"
                >
                  <RemoveTileButton
                    canRemoveParticipants={canRemoveParticipants}
                    currentUserId={currentUserId}
                    participantUserId={participant.userId}
                    participantUsername={participant.username}
                    onRemoveParticipant={onRemoveParticipant}
                  />
                  {showPlaceholder ? (
                    <ParticipantPlaceholder
                      participant={participant}
                      heroImage={heroImage}
                      cameraOff={cameraOff}
                      isCurrentUserTile={isCurrentUserTile}
                    />
                  ) : (
                    <LiveVideoSurface
                      track={tile.track}
                      muted={tile.isLocal}
                      isMirrored={tile.isLocal}
                      isScreenShare={false}
                      participantUserId={participant.userId}
                      onVideoElementChange={onVideoElementChange}
                    />
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-black/25" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-1.5 p-2">
                    <div className="w-fit max-w-full truncate rounded-full border border-white/10 bg-black/40 px-2 py-1 text-[7px] font-black uppercase tracking-[0.12em] text-white backdrop-blur-md">
                      {truncateLabel(participant.username, 12)}
                    </div>
                    <div className="flex items-center gap-1">
                      {muted && (
                        <div className="rounded-full border border-white/10 bg-black/35 p-1 text-brand-accent backdrop-blur-md">
                          <MicOff size={10} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  const total = Math.max(cameraParticipants.length, 1);

  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      {cameraParticipants.map(({ participant, tile }, index) => {
        const state = mediaStates[participant.userId];
        const cameraOff = Boolean(state?.isCameraOff);
        const muted = Boolean(state?.isMuted);
        const showPlaceholder = cameraOff || !tile;
        const isCurrentUserTile = participant.userId === currentUserId;
        const isSelected = cameraParticipants[0]?.participant.userId === participant.userId;
        const isPipOverlay = (orientation === 'pip' || orientation === 'host-focus') && index > 0;

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
              orientation === 'grid' && !isPipOverlay
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
            style={isPipOverlay ? { top: `${5 + (index - 1) * 9.5}rem` } : undefined}
          >
            <RemoveTileButton
              canRemoveParticipants={canRemoveParticipants}
              currentUserId={currentUserId}
              participantUserId={participant.userId}
              participantUsername={participant.username}
              onRemoveParticipant={onRemoveParticipant}
            />
            {showPlaceholder ? (
              <ParticipantPlaceholder
                participant={participant}
                heroImage={heroImage}
                cameraOff={cameraOff}
                isCurrentUserTile={isCurrentUserTile}
              />
            ) : (
              <LiveVideoSurface
                track={tile.track}
                muted={tile.isLocal}
                isMirrored={tile.isLocal}
                isScreenShare={false}
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
                  <div className="flex flex-wrap items-center gap-1.5">
                    <div className="w-fit rounded-full border border-white/10 bg-black/35 px-2 py-0.5 text-[7px] font-bold uppercase tracking-[0.12em] text-zinc-200 backdrop-blur-md sm:text-[9px]">
                      {participant.role === 'host' ? 'Host' : 'Guest'}
                    </div>
                    {tile?.source === 'screen' && <ScreenShareBadge label="Screen" />}
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
              </div>
            </div>
          </div>
        );
      })}

      {!stageParticipants.length && (
        <div className="h-full w-full overflow-hidden bg-black">
          <img src={heroImage} alt="Live stage" className="h-full w-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-black/30" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-black/40 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-300 backdrop-blur-md">
              <Monitor size={14} className="text-brand-accent" />
              Waiting for live video
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
