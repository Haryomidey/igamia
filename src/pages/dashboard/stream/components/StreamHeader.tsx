import React from 'react';
import {
  ChevronLeft,
  Circle,
  Mic,
  MicOff,
  Radio,
  Share2,
  Shield,
  UserPlus,
  UserRoundPlus,
  Video,
  VideoOff,
  X,
} from 'lucide-react';
import type { Stream } from '../../../../hooks/useStream';
import { StreamIconButton } from './StreamIconButton';

type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error';

function truncateText(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;
}

function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
  }

  return [minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
}

export function StreamHeader({
  stream,
  host,
  isHostView,
  isCoStreamerView,
  isInvitedPending,
  isPledgeStream,
  canRemoveParticipants,
  removableParticipants,
  connectionStatus,
  isMicMuted,
  isCameraPaused,
  isRecording,
  recordingDurationSeconds,
  streamEarningsUsd,
  isSavingRecording,
  onBack,
  onClose,
  onOpenInviteModal,
  onToggleMute,
  onToggleCamera,
  onToggleRecording,
  onLeaveLive,
  onStopStream,
  onAcceptInvite,
  onDeclineInvite,
  onFollowHost,
  onShare,
  onRemoveParticipant,
}: {
  stream: Stream | null;
  host?: Stream['participants'][number];
  isHostView: boolean;
  isCoStreamerView: boolean;
  isInvitedPending: boolean;
  isPledgeStream: boolean;
  canRemoveParticipants: boolean;
  removableParticipants: Stream['participants'];
  connectionStatus: ConnectionStatus;
  isMicMuted: boolean;
  isCameraPaused: boolean;
  isRecording: boolean;
  recordingDurationSeconds: number;
  streamEarningsUsd?: number;
  isSavingRecording: boolean;
  onBack: () => void;
  onClose: () => void;
  onOpenInviteModal: () => void;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleRecording: () => void;
  onLeaveLive: () => void;
  onStopStream: () => void;
  onAcceptInvite: () => void;
  onDeclineInvite: () => void;
  onFollowHost: () => void;
  onShare: () => void;
  onRemoveParticipant: (participantUserId: string, participantUsername: string) => void;
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 bg-linear-to-b from-black/80 via-black/35 to-transparent px-2.5 pb-6 pt-2.5 sm:px-5 sm:pb-16 sm:pt-5 lg:px-8">
      <div className="pointer-events-auto rounded-[1.4rem] border border-white/10 bg-black/30 p-2.5 shadow-2xl backdrop-blur-xl sm:rounded-[2rem] sm:p-4">
        <div className="flex items-center justify-between gap-2 sm:hidden">
          <StreamIconButton
            title="Back"
            onClick={(event) => {
              event.stopPropagation();
              onBack();
            }}
          >
            <ChevronLeft size={18} />
          </StreamIconButton>
          <div className="flex min-w-0 flex-1 items-center justify-center gap-1.5 overflow-hidden px-1">
            <span className="rounded-full bg-red-600 px-2 py-0.5 text-[7px] font-black uppercase tracking-[0.12em] text-white">
              Live
            </span>
            <span className="truncate rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[7px] font-black uppercase tracking-[0.12em] text-zinc-200">
              {stream?.viewersCount ?? 0} Watching
            </span>
            {isPledgeStream && (
              <span className="rounded-full bg-brand-accent/20 px-2 py-0.5 text-[7px] font-black uppercase tracking-[0.12em] text-brand-accent">
                Pledge
              </span>
            )}
          </div>
          <StreamIconButton
            title="Close stream"
            onClick={(event) => {
              event.stopPropagation();
              onClose();
            }}
          >
            <X size={16} />
          </StreamIconButton>
        </div>

        <div className="mt-2.5 flex flex-col gap-2.5 sm:mt-0 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
          <div className="hidden sm:block">
            <StreamIconButton
              title="Back"
              onClick={(event) => {
                event.stopPropagation();
                onBack();
              }}
            >
              <ChevronLeft size={20} />
            </StreamIconButton>
          </div>

          <div className="min-w-0 flex-1 px-0.5 sm:px-1">
            <div className="flex items-start gap-2.5 sm:gap-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-brand-primary/40 bg-black/30 p-1 sm:h-14 sm:w-14">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${host?.username ?? stream?.title ?? 'streamer'}`}
                  alt={host?.username ?? 'Host'}
                  className="h-full w-full rounded-xl object-cover"
                />
              </div>
              <div className="min-w-0 space-y-1.5">
                <div className="flex items-center gap-2">
                  <p className="truncate text-[11px] font-black uppercase italic text-white sm:text-sm">
                    {host?.username ?? 'Live Host'}
                  </p>
                  <Shield size={14} className="shrink-0 text-brand-primary" />
                </div>
                <div className="hidden flex-wrap items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.16em] text-zinc-300 sm:flex sm:text-[9px] sm:tracking-[0.18em]">
                  <span className="rounded-full bg-red-600 px-2 py-0.5 text-white">Live</span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
                    {stream?.viewersCount ?? 0} Watching
                  </span>
                  {isHostView && (
                    <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-0.5 text-emerald-300">
                      ${Number(streamEarningsUsd ?? 0).toFixed(2)} Earned
                    </span>
                  )}
                  {isRecording && (
                    <span className="rounded-full bg-brand-primary/20 px-2 py-0.5 text-brand-primary">
                      Rec {formatDuration(recordingDurationSeconds)}
                    </span>
                  )}
                  {isPledgeStream && (
                    <span className="rounded-full bg-brand-accent/20 px-2 py-0.5 text-brand-accent">
                      Pledge
                    </span>
                  )}
                  {connectionStatus === 'connecting' && <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5">Connecting</span>}
                  {connectionStatus === 'error' && <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-red-200">Connection Error</span>}
                </div>
              </div>
            </div>
            <p
              title={stream?.title ?? 'Live stream'}
              className="mt-2 max-w-xl text-[9px] font-medium leading-relaxed text-zinc-200 sm:mt-2.5 sm:text-xs"
            >
              {truncateText(stream?.title ?? 'Live stream', 72)}
            </p>
            {canRemoveParticipants && removableParticipants.length > 0 && (
              <div className="mt-2 hidden flex-wrap items-center gap-1.5 sm:mt-3 sm:flex">
                {removableParticipants.map((participant) => (
                  <div
                    key={`${participant.role}-${participant.userId}`}
                    className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-white/10 bg-black/35 px-2 py-1 backdrop-blur-md sm:px-2.5 sm:py-1.5"
                  >
                    <span className="text-[8px] font-black uppercase tracking-[0.12em] text-white sm:text-[9px] sm:tracking-[0.14em]">
                      {participant.username}
                    </span>
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[7px] font-black uppercase tracking-[0.12em] sm:text-[8px] ${
                        participant.role === 'invited'
                          ? 'bg-brand-accent/20 text-brand-accent'
                          : 'bg-white/10 text-zinc-200'
                      }`}
                    >
                      {participant.role === 'invited' ? 'Invited' : 'Guest'}
                    </span>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        onRemoveParticipant(participant.userId, participant.username);
                      }}
                      className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[7px] font-black uppercase tracking-[0.12em] text-red-200 transition-colors hover:bg-red-500/20 sm:text-[8px] sm:tracking-[0.14em]"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-start gap-1.5 sm:justify-end sm:gap-2">
            {isHostView || isCoStreamerView ? (
              <>
                {!isPledgeStream && isHostView && (
                  <StreamIconButton
                    title="Invite streamer"
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenInviteModal();
                    }}
                  >
                    <UserRoundPlus size={16} />
                  </StreamIconButton>
                )}
                <StreamIconButton
                  title={isMicMuted ? 'Unmute microphone' : 'Mute microphone'}
                  active={isMicMuted}
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleMute();
                  }}
                >
                  {isMicMuted ? <MicOff size={16} /> : <Mic size={16} />}
                </StreamIconButton>
                <StreamIconButton
                  title={isCameraPaused ? 'Resume camera' : 'Pause camera'}
                  active={isCameraPaused}
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleCamera();
                  }}
                >
                  {isCameraPaused ? <VideoOff size={16} /> : <Video size={16} />}
                </StreamIconButton>
                <StreamIconButton
                  title={isRecording ? 'Stop recording' : 'Start recording'}
                  active={isRecording}
                  disabled={isSavingRecording}
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleRecording();
                  }}
                >
                  <Circle size={16} fill="currentColor" />
                </StreamIconButton>
                {isCoStreamerView && (
                  <StreamIconButton
                    title="Leave live"
                    danger
                    onClick={(event) => {
                      event.stopPropagation();
                      onLeaveLive();
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
                      onStopStream();
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
                        onAcceptInvite();
                      }}
                    >
                      <UserPlus size={16} />
                    </StreamIconButton>
                    <StreamIconButton
                      title="Decline invite"
                      danger
                      onClick={(event) => {
                        event.stopPropagation();
                        onDeclineInvite();
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
                    onFollowHost();
                  }}
                >
                  <UserPlus size={16} />
                </StreamIconButton>
                <StreamIconButton
                  title="Share stream"
                  disabled={isInvitedPending}
                  onClick={(event) => {
                    event.stopPropagation();
                    onShare();
                  }}
                >
                  <Share2 size={16} />
                </StreamIconButton>
              </>
            )}
            <div className="hidden sm:block">
              <StreamIconButton
                title="Close stream"
                onClick={(event) => {
                  event.stopPropagation();
                  onClose();
                }}
              >
                <X size={16} />
              </StreamIconButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
