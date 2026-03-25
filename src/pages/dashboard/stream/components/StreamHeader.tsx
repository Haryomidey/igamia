import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
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
  isSavingRecording,
  onBack,
  onPreviousStream,
  onNextStream,
  canBrowseStreams,
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
  isSavingRecording: boolean;
  onBack: () => void;
  onPreviousStream: () => void;
  onNextStream: () => void;
  canBrowseStreams: boolean;
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
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 bg-linear-to-b from-black/70 to-transparent px-4 pb-16 pt-4 sm:px-6 lg:px-8">
      <div className="pointer-events-auto flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <StreamIconButton
            title="Back"
            onClick={(event) => {
              event.stopPropagation();
              onBack();
            }}
          >
            <ChevronLeft size={20} />
          </StreamIconButton>
          <StreamIconButton
            title="Previous stream"
            disabled={!canBrowseStreams}
            onClick={(event) => {
              event.stopPropagation();
              onPreviousStream();
            }}
          >
            <ChevronLeft size={16} />
          </StreamIconButton>
          <StreamIconButton
            title="Next stream"
            disabled={!canBrowseStreams}
            onClick={(event) => {
              event.stopPropagation();
              onNextStream();
            }}
          >
            <ChevronRight size={16} />
          </StreamIconButton>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 overflow-hidden rounded-2xl border-2 border-brand-primary bg-black/30 p-1">
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${host?.username ?? stream?.title ?? 'streamer'}`}
                alt={host?.username ?? 'Host'}
                className="h-full w-full rounded-xl object-cover"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-xs font-black uppercase italic text-white sm:text-base">
                  {host?.username ?? 'Live Host'}
                </p>
                <Shield size={14} className="text-brand-primary" />
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[9px] font-black uppercase tracking-[0.18em] text-zinc-300 sm:text-[10px] sm:tracking-[0.2em]">
                <span className="rounded-full bg-red-600 px-2.5 py-1 text-white">Live</span>
                <span>{stream?.viewersCount ?? 0} Watching</span>
                {isRecording && (
                  <span className="rounded-full bg-brand-primary/20 px-2.5 py-1 text-brand-primary">
                    Rec {formatDuration(recordingDurationSeconds)}
                  </span>
                )}
                {isPledgeStream && (
                  <span className="rounded-full bg-brand-accent/20 px-2.5 py-1 text-brand-accent">
                    Pledge
                  </span>
                )}
                {connectionStatus === 'connecting' && <span>Connecting</span>}
                {connectionStatus === 'error' && <span>Connection Error</span>}
              </div>
            </div>
          </div>
          <p
            title={stream?.title ?? 'Live stream'}
            className="mt-2 max-w-xl truncate text-xs font-medium text-zinc-200 sm:mt-3 sm:text-sm"
          >
            {truncateText(stream?.title ?? 'Live stream', 72)}
          </p>
          {canRemoveParticipants && removableParticipants.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 sm:mt-4">
              {removableParticipants.map((participant) => (
                <div
                  key={`${participant.role}-${participant.userId}`}
                  className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-2.5 py-1.5 backdrop-blur-md sm:px-3 sm:py-2"
                >
                  <span className="text-[9px] font-black uppercase tracking-[0.14em] text-white sm:text-[10px] sm:tracking-[0.18em]">
                    {participant.username}
                  </span>
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.14em] sm:text-[9px] ${
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
                    className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-red-200 transition-colors hover:bg-red-500/20 sm:text-[9px] sm:tracking-[0.16em]"
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
  );
}
