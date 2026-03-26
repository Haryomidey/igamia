import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ChevronDown,
  Columns,
  Layout,
  LogOut,
  Maximize,
  Mic,
  MicOff,
  PauseCircle,
  PlayCircle,
  Radio,
  Rows,
  Trophy,
  UserPlus,
  Video,
  VideoOff,
} from 'lucide-react';
import type { Stream } from '../../../../hooks/useStream';

function ControlButton({
  icon: Icon,
  label,
  active = false,
  danger = false,
  onClick,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  active?: boolean;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2">
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-2xl border transition-all ${
          danger
            ? 'border-red-500/30 bg-red-500/15 text-red-200'
            : active
              ? 'border-white bg-white text-black'
              : 'border-white/10 bg-white/5 text-white'
        }`}
      >
        <Icon size={24} />
      </div>
      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">{label}</span>
    </button>
  );
}

export function StreamControlSheet({
  open,
  stream,
  isHostView,
  isCoStreamerView,
  isPledgeStream,
  canRespondToClaim,
  canClaimPledge,
  pendingClaimLabel,
  isMicMuted,
  isCameraPaused,
  isRecording,
  isSavingRecording,
  onClose,
  onToggleMute,
  onToggleCamera,
  onToggleRecording,
  onOpenInviteModal,
  onLeaveLive,
  onStopStream,
  onChangeOrientation,
  onClaimPledge,
  onPledgeClaimDecision,
}: {
  open: boolean;
  stream: Stream | null;
  isHostView: boolean;
  isCoStreamerView: boolean;
  isPledgeStream: boolean;
  canRespondToClaim: boolean;
  canClaimPledge: boolean;
  pendingClaimLabel?: string | null;
  isMicMuted: boolean;
  isCameraPaused: boolean;
  isRecording: boolean;
  isSavingRecording: boolean;
  onClose: () => void;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleRecording: () => void;
  onOpenInviteModal: () => void;
  onLeaveLive: () => void;
  onStopStream: () => void;
  onChangeOrientation: (orientation: Stream['orientation']) => void;
  onClaimPledge: (outcome: 'win' | 'loss' | 'draw' | 'dispute') => void;
  onPledgeClaimDecision: (decision: 'approve' | 'reject') => void;
}) {
  const canControlLive = isHostView || isCoStreamerView;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 bg-black/45 backdrop-blur-[2px]"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 120 }}
            animate={{ y: 0 }}
            exit={{ y: 120 }}
            transition={{ type: 'spring', damping: 26, stiffness: 260 }}
            className="absolute inset-x-0 bottom-0 rounded-t-[2rem] border-t border-white/10 bg-zinc-900/95 p-6 shadow-2xl backdrop-blur-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Streamer Controls</h3>
              <button onClick={onClose} className="text-white/45 transition-colors hover:text-white">
                <ChevronDown size={24} />
              </button>
            </div>

            {canControlLive && (
              <div className={`grid gap-4 ${isHostView && !isPledgeStream ? 'grid-cols-5' : 'grid-cols-4'}`}>
                <ControlButton
                  icon={isMicMuted ? MicOff : Mic}
                  label={isMicMuted ? 'Unmute' : 'Mute'}
                  active={isMicMuted}
                  onClick={onToggleMute}
                />
                <ControlButton
                  icon={isCameraPaused ? VideoOff : Video}
                  label={isCameraPaused ? 'Camera On' : 'Camera Off'}
                  active={isCameraPaused}
                  onClick={onToggleCamera}
                />
                <ControlButton
                  icon={isRecording ? PauseCircle : PlayCircle}
                  label={isSavingRecording ? 'Saving' : isRecording ? 'Stop Rec' : 'Record'}
                  active={isRecording || isSavingRecording}
                  onClick={onToggleRecording}
                />
                {isHostView && !isPledgeStream && (
                  <ControlButton icon={UserPlus} label="Invite" onClick={onOpenInviteModal} />
                )}
                {isCoStreamerView ? (
                  <ControlButton icon={LogOut} label="Leave" danger onClick={onLeaveLive} />
                ) : (
                  <ControlButton icon={Radio} label="End" danger onClick={onStopStream} />
                )}
              </div>
            )}

            {(isHostView || isCoStreamerView) && (
              <div className="mt-6 border-t border-white/5 pt-6">
                <div className="mb-4 flex items-center gap-2">
                  <Layout size={18} className="text-blue-400" />
                  <span className="font-semibold text-white">Stream Orientation</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'vertical' as const, icon: Rows, label: 'Vertical' },
                    { id: 'horizontal' as const, icon: Columns, label: 'Horizontal' },
                    { id: 'pip' as const, icon: Maximize, label: 'PiP' },
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => onChangeOrientation(option.id)}
                      className={`flex flex-col items-center gap-2 rounded-2xl p-3 transition-all ${
                        stream?.orientation === option.id
                          ? 'bg-white text-black'
                          : 'bg-white/5 text-white/65'
                      }`}
                    >
                      <option.icon size={20} />
                      <span className="text-[10px] font-bold uppercase tracking-[0.14em]">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isPledgeStream && canControlLive && (
              <div className="mt-6 border-t border-white/5 pt-6">
                <div className="mb-4 flex items-center gap-2">
                  <Trophy size={18} className="text-yellow-400" />
                  <span className="font-semibold text-white">Pledge Results</span>
                </div>
                {canClaimPledge && (
                  <div className="grid grid-cols-4 gap-2">
                    <button onClick={() => onClaimPledge('win')} className="rounded-xl bg-green-500/20 py-2 text-xs font-bold uppercase text-green-300">Win</button>
                    <button onClick={() => onClaimPledge('loss')} className="rounded-xl bg-red-500/20 py-2 text-xs font-bold uppercase text-red-200">Lose</button>
                    <button onClick={() => onClaimPledge('draw')} className="rounded-xl bg-blue-500/20 py-2 text-xs font-bold uppercase text-blue-200">Draw</button>
                    <button onClick={() => onClaimPledge('dispute')} className="rounded-xl bg-orange-500/20 py-2 text-xs font-bold uppercase text-orange-200">Dispute</button>
                  </div>
                )}
                {pendingClaimLabel && (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-200">
                    {pendingClaimLabel}
                  </div>
                )}
                {canRespondToClaim && (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <button onClick={() => onPledgeClaimDecision('reject')} className="rounded-xl bg-red-500/20 py-3 text-xs font-bold uppercase text-red-200">Reject</button>
                    <button onClick={() => onPledgeClaimDecision('approve')} className="rounded-xl bg-emerald-500/20 py-3 text-xs font-bold uppercase text-emerald-300">Accept</button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
