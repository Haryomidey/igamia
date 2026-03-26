import React from 'react';
import {
  ChevronLeft,
  Heart,
  Shield,
  Share2,
  Users,
  UserPlus,
  MoreVertical,
  X,
} from 'lucide-react';
import type { Stream } from '../../../../hooks/useStream';

type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error';

export function StreamHeader({
  stream,
  host,
  isHostView,
  isCoStreamerView,
  isInvitedPending,
  isPledgeStream,
  connectionStatus,
  canOpenControls,
  activeParticipant,
  liveDurationLabel,
  isSavingRecording,
  onBack,
  onClose,
  onOpenControlSheet,
  onFollowHost,
  onShare,
}: {
  stream: Stream | null;
  host?: Stream['participants'][number];
  isHostView: boolean;
  isCoStreamerView: boolean;
  isInvitedPending: boolean;
  isPledgeStream: boolean;
  connectionStatus: ConnectionStatus;
  canOpenControls: boolean;
  activeParticipant?: Stream['participants'][number];
  liveDurationLabel?: string | null;
  isSavingRecording?: boolean;
  onBack: () => void;
  onClose: () => void;
  onOpenControlSheet: () => void;
  onFollowHost: () => void;
  onShare: () => void;
}) {
  const liveActor = activeParticipant ?? host;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 bg-linear-to-b from-black/85 via-black/35 to-transparent px-4 pt-6 sm:px-6 lg:px-8">
      <div className="flex items-start justify-between gap-4">
        <div className="pointer-events-auto flex min-w-0 items-start gap-3">
          <button
            onClick={(event) => {
              event.stopPropagation();
              onBack();
            }}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white backdrop-blur-md transition-colors hover:bg-black/55"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white">
                Live
              </span>
              <span className="rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white backdrop-blur-md">
                <span className="inline-flex items-center gap-1.5">
                  <Users size={12} className="text-white/65" />
                  {stream?.viewersCount ?? 0}
                </span>
              </span>
              <span className="rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white backdrop-blur-md">
                <span className="inline-flex items-center gap-1.5">
                  <Heart size={12} className="fill-red-500 text-red-500" />
                  {stream?.likesCount ?? 0}
                </span>
              </span>
              {isPledgeStream && (
                <span className="rounded-full bg-brand-accent/20 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-brand-accent">
                  Pledge
                </span>
              )}
              {connectionStatus === 'connecting' && (
                <span className="rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-200 backdrop-blur-md">
                  Connecting
                </span>
              )}
              {isHostView && liveDurationLabel && (
                <span className="rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-200 backdrop-blur-md">
                  Live {liveDurationLabel}
                </span>
              )}
              {isHostView && isSavingRecording && (
                <span className="rounded-full border border-brand-primary/20 bg-brand-primary/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-brand-primary">
                  Saving...
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${liveActor?.username ?? host?.username ?? 'streamer'}`}
                alt={liveActor?.username ?? host?.username ?? 'Host'}
                className="h-12 w-12 rounded-full border-2 border-white object-cover"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-black uppercase italic text-white sm:text-base">
                    @{liveActor?.username ?? host?.username ?? 'live'}
                  </p>
                  <Shield size={14} className="text-brand-primary" />
                </div>
                <p className="truncate text-xs text-zinc-200">{stream?.title ?? 'Live Session'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          {!isHostView && !isCoStreamerView && !isInvitedPending && (
            <button
              onClick={(event) => {
                event.stopPropagation();
                onFollowHost();
              }}
              className="hidden h-11 items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 text-[10px] font-black uppercase tracking-[0.16em] text-white backdrop-blur-md transition-colors hover:bg-black/55 sm:inline-flex"
            >
              <UserPlus size={14} />
              Follow
            </button>
          )}
          <button
            onClick={(event) => {
              event.stopPropagation();
              onShare();
            }}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white backdrop-blur-md transition-colors hover:bg-black/55"
          >
            <Share2 size={18} />
          </button>
          {canOpenControls && (
            <button
              onClick={(event) => {
                event.stopPropagation();
                onOpenControlSheet();
              }}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white backdrop-blur-md transition-colors hover:bg-black/55"
            >
              <MoreVertical size={18} />
            </button>
          )}
          <button
            onClick={(event) => {
              event.stopPropagation();
              onClose();
            }}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white backdrop-blur-md transition-colors hover:bg-black/55"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
