import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Radio, Search, Send, Users, X } from 'lucide-react';
import type { Stream } from '../../../../hooks/useStream';

type StartForm = {
  title: string;
  description: string;
  category: string;
  orientation: 'vertical' | 'horizontal' | 'pip';
};

export function StartStreamModal({
  open,
  submitting,
  form,
  onClose,
  onChange,
  onSubmit,
}: {
  open: boolean;
  submitting: boolean;
  form: StartForm;
  onClose: () => void;
  onChange: (field: keyof StartForm, value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-[#0f0b21]/90 p-6 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md rounded-[3rem] border border-white/10 bg-brand-deep p-10"
          >
            <button onClick={onClose} className="absolute right-8 top-8 text-zinc-500 hover:text-white">
              <X size={24} />
            </button>
            <h2 className="mb-8 text-2xl font-black uppercase italic text-white">Go Live</h2>
            <form onSubmit={onSubmit} className="space-y-5">
              <input
                value={form.title}
                onChange={(event) => onChange('title', event.target.value)}
                placeholder="Stream title"
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-white focus:border-brand-primary/50 focus:outline-none"
                required
              />
              <input
                value={form.category}
                onChange={(event) => onChange('category', event.target.value)}
                placeholder="Category"
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-white focus:border-brand-primary/50 focus:outline-none"
              />
              <div className="grid grid-cols-3 gap-3">
                {(['vertical', 'horizontal', 'pip'] as const).map((orientation) => (
                  <button
                    key={orientation}
                    type="button"
                    onClick={() => onChange('orientation', orientation)}
                    className={`rounded-2xl px-4 py-3 text-[9px] font-black uppercase tracking-[0.16em] transition-all sm:text-[10px] sm:tracking-[0.2em] ${
                      form.orientation === orientation
                        ? 'bg-brand-primary text-white'
                        : 'border border-white/10 bg-black/30 text-zinc-300'
                    }`}
                  >
                    {orientation === 'pip' ? 'PiP' : orientation}
                  </button>
                ))}
              </div>
              <textarea
                value={form.description}
                onChange={(event) => onChange('description', event.target.value)}
                placeholder="What are you streaming?"
                className="min-h-28 w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-white focus:border-brand-primary/50 focus:outline-none"
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-2xl bg-brand-primary py-4 text-[9px] font-black uppercase tracking-[0.16em] text-white hover:bg-brand-accent hover:text-black disabled:opacity-50 sm:text-[10px] sm:tracking-[0.2em]"
              >
                {submitting ? 'Starting...' : 'Start Live'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function GiftModal({
  open,
  host,
  giftAmount,
  isSubmitting,
  onClose,
  onGiftAmountChange,
  onSubmit,
}: {
  open: boolean;
  host?: Stream['participants'][number];
  giftAmount: string;
  isSubmitting: boolean;
  onClose: () => void;
  onGiftAmountChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-[#0f0b21]/88 p-6 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            className="relative w-full max-w-md rounded-[2.5rem] border border-white/10 bg-brand-deep p-8 shadow-2xl"
          >
            <button onClick={onClose} className="absolute right-6 top-6 text-zinc-500 hover:text-white">
              <X size={22} />
            </button>
            <div className="mb-8 text-center">
              <div className="mx-auto mb-5 h-20 w-20 overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-2">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${host?.username ?? 'host'}`}
                  alt={host?.username ?? 'Host'}
                  className="h-full w-full rounded-2xl object-cover"
                />
              </div>
              <h3 className="text-2xl font-black uppercase italic text-white">
                Gift {host?.username ?? 'Host'}
              </h3>
              <p className="mt-2 text-[9px] font-black uppercase tracking-[0.16em] text-zinc-500 sm:text-[10px] sm:tracking-[0.2em]">
                Send IGC. The host receives NGN after the platform fee.
              </p>
            </div>
            <form onSubmit={onSubmit} className="space-y-6">
              <div>
                <label className="ml-1 text-[9px] font-black uppercase tracking-[0.18em] text-zinc-500 sm:text-[10px] sm:tracking-[0.25em]">
                  Gift Amount
                </label>
                <div className="relative mt-3">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-brand-primary">
                    IGC
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={giftAmount}
                    onChange={(event) => onGiftAmountChange(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/40 py-4 pl-16 pr-5 font-black text-white focus:border-brand-primary/50 focus:outline-none"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-brand-primary py-4 text-[10px] font-black uppercase tracking-[0.16em] text-white hover:bg-brand-accent hover:text-black disabled:opacity-50 sm:text-xs sm:tracking-[0.2em]"
              >
                {isSubmitting ? 'Sending...' : 'Send Gift'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function InvitePlayersModal({
  open,
  canShow,
  pendingInvites,
  inviteCandidates,
  onClose,
  onInvite,
  onRemoveParticipant,
}: {
  open: boolean;
  canShow: boolean;
  pendingInvites: Stream['participants'];
  inviteCandidates: Array<{
    id: string;
    username: string;
    fullName?: string;
    avatarUrl?: string;
  }>;
  onClose: () => void;
  onInvite: (targetUserId: string) => void;
  onRemoveParticipant: (participantUserId: string, participantUsername: string) => void;
}) {
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLowerCase();
  const filteredPendingInvites = useMemo(
    () =>
      pendingInvites.filter((participant) =>
        participant.username.toLowerCase().includes(normalizedQuery),
      ),
    [normalizedQuery, pendingInvites],
  );
  const filteredInviteCandidates = useMemo(
    () =>
      inviteCandidates.filter((candidate) => {
        const haystack = `${candidate.username} ${candidate.fullName ?? ''}`.toLowerCase();
        return haystack.includes(normalizedQuery);
      }),
    [inviteCandidates, normalizedQuery],
  );

  return (
    <AnimatePresence>
      {open && canShow && (
        <div className="pointer-events-none fixed right-4 top-20 z-100 w-[min(24rem,calc(100vw-2rem))] sm:right-6 sm:top-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            className="pointer-events-auto relative w-full rounded-2xl border border-white/10 bg-brand-deep p-5 shadow-2xl"
          >
            <button onClick={onClose} className="absolute right-4 top-4 text-zinc-500 hover:text-white">
              <X size={18} />
            </button>
            <h3 className="mb-4 text-sm font-black uppercase italic text-white sm:text-base">Invite Players</h3>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search users"
              className="mb-4 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-brand-primary/50 focus:outline-none"
            />
            <div className="max-h-[55vh] space-y-5 overflow-y-auto pr-1">
              {filteredPendingInvites.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-500 sm:text-[10px] sm:tracking-[0.24em]">
                    Pending Invites
                  </p>
                  {filteredPendingInvites.map((participant) => (
                    <div
                      key={participant.userId}
                      className="flex items-center justify-between gap-3 rounded-3xl border border-white/10 bg-white/5 p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-black uppercase italic text-white sm:text-sm">
                          {participant.username}
                        </p>
                        <p className="mt-1 text-[9px] font-black uppercase tracking-[0.16em] text-brand-accent sm:text-[10px] sm:tracking-[0.2em]">
                          Awaiting response
                        </p>
                      </div>
                      <button
                        onClick={() => onRemoveParticipant(participant.userId, participant.username)}
                        className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-[9px] font-black uppercase tracking-[0.16em] text-red-200 transition-colors hover:bg-red-500/20 sm:text-[10px] sm:tracking-[0.2em]"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-4">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-500 sm:text-[10px] sm:tracking-[0.24em]">
                  Invite More Players
                </p>
                {filteredInviteCandidates.length ? (
                  filteredInviteCandidates.map((candidate) => (
                    <div
                      key={candidate.id}
                      className="flex items-center justify-between gap-3 rounded-3xl border border-white/10 bg-white/5 p-3"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="h-12 w-12 overflow-hidden rounded-2xl border border-white/10">
                          <img
                            src={
                              candidate.avatarUrl ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${candidate.username}`
                            }
                            alt={candidate.username}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-black uppercase italic text-white sm:text-sm">
                            {candidate.fullName || candidate.username}
                          </p>
                          <p className="truncate text-[9px] font-black uppercase tracking-[0.16em] text-zinc-500 sm:text-[10px] sm:tracking-[0.2em]">
                            @{candidate.username}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => onInvite(candidate.id)}
                        className="rounded-xl bg-brand-primary px-4 py-3 text-[9px] font-black uppercase tracking-[0.16em] text-white hover:bg-brand-accent hover:text-black sm:text-[10px] sm:tracking-[0.2em]"
                      >
                        Invite
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-8 text-center text-sm text-zinc-500">
                    No users found.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function ShareStreamModal({
  open,
  hostUsername,
  friends,
  isSharingToFollowers,
  sendingFriendUserId,
  onClose,
  onShareToFriend,
  onShareToFollowers,
}: {
  open: boolean;
  hostUsername?: string;
  friends: Array<{
    id: string;
    username: string;
    fullName?: string;
    avatarUrl?: string;
  }>;
  isSharingToFollowers: boolean;
  sendingFriendUserId: string | null;
  onClose: () => void;
  onShareToFriend: (targetUserId: string) => void;
  onShareToFollowers: () => void;
}) {
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLowerCase();
  const filteredFriends = useMemo(
    () =>
      friends.filter((friend) => {
        const haystack = `${friend.username} ${friend.fullName ?? ''}`.toLowerCase();
        return haystack.includes(normalizedQuery);
      }),
    [friends, normalizedQuery],
  );

  return (
    <AnimatePresence>
      {open && (
        <div className="pointer-events-none fixed right-4 top-20 z-[120] w-[min(24rem,calc(100vw-2rem))] sm:right-6 sm:top-24">
          <motion.div
            initial={{ opacity: 0, x: 24, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 24, y: -8, scale: 0.98 }}
            className="pointer-events-auto relative flex max-h-[calc(100vh-7rem)] w-full flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#120f24]/95 p-5 shadow-2xl backdrop-blur-xl sm:max-h-[calc(100vh-8rem)] sm:p-6"
          >
            <button onClick={onClose} className="absolute right-5 top-5 text-zinc-500 hover:text-white">
              <X size={18} />
            </button>

            <div className="pr-8">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-brand-accent">
                Share Live
              </p>
              <h3 className="mt-2 text-lg font-black uppercase italic text-white sm:text-xl">
                Send this stream out
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-zinc-400 sm:text-sm">
                Share {hostUsername ? `@${hostUsername}` : 'this live'} directly with friends or send it to all followers at once.
              </p>
            </div>

            <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-white/5 p-3">
              <button
                type="button"
                onClick={onShareToFollowers}
                disabled={isSharingToFollowers || friends.length === 0}
                className="flex w-full items-center justify-between rounded-[1.25rem] border border-white/10 bg-black/20 px-3 py-3 text-left transition-colors hover:bg-white/5 disabled:opacity-50"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-primary/20 text-brand-primary">
                    <Users size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase italic text-white sm:text-sm">Share To Followers</p>
                    <p className="mt-1 text-[9px] font-black uppercase tracking-[0.14em] text-zinc-500 sm:text-[10px]">
                      Send to {friends.length} connected {friends.length === 1 ? 'friend' : 'friends'}
                    </p>
                  </div>
                </div>
                <span className="rounded-xl bg-brand-primary px-3 py-2 text-[9px] font-black uppercase tracking-[0.16em] text-white sm:text-[10px]">
                  {isSharingToFollowers ? 'Sending...' : 'Send'}
                </span>
              </button>
            </div>

            <div className="mt-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search friends"
                  className="w-full rounded-2xl border border-white/10 bg-black/30 py-3 pl-12 pr-4 text-sm text-white placeholder:text-zinc-500 focus:border-brand-primary/50 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
              {filteredFriends.length ? (
                filteredFriends.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between gap-3 rounded-[1.25rem] border border-white/10 bg-white/5 p-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="h-10 w-10 overflow-hidden rounded-2xl border border-white/10">
                        <img
                          src={friend.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username}`}
                          alt={friend.username}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-white">
                          {friend.fullName || friend.username}
                        </p>
                        <p className="truncate text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                          @{friend.username}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onShareToFriend(friend.id)}
                      disabled={sendingFriendUserId === friend.id || isSharingToFollowers}
                      className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-3 py-2.5 text-[9px] font-black uppercase tracking-[0.14em] text-white transition-colors hover:bg-brand-accent hover:text-black disabled:opacity-50 sm:text-[10px]"
                    >
                      <Send size={14} />
                      {sendingFriendUserId === friend.id ? 'Sending...' : 'Send'}
                    </button>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 px-5 py-8 text-center text-sm text-zinc-500">
                  {friends.length ? 'No matching friends found.' : 'No friends available to share with yet.'}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function EmptyStreamState({
  shouldStartLive,
  isStarting,
  isSubmitting,
  startForm,
  onOpenStartModal,
  onCloseStartModal,
  onStartFormChange,
  onSubmitStartStream,
}: {
  shouldStartLive: boolean;
  isStarting: boolean;
  isSubmitting: boolean;
  startForm: StartForm;
  onOpenStartModal: () => void;
  onCloseStartModal: () => void;
  onStartFormChange: (field: keyof StartForm, value: string) => void;
  onSubmitStartStream: (event: React.FormEvent) => void;
}) {
  return (
    <div className="min-h-screen bg-[#0a0817] px-6 py-10 text-white">
      <div className="mx-auto max-w-xl rounded-[3rem] border border-white/10 bg-[#141128] p-10 text-center">
        <Radio size={34} className="mx-auto text-brand-primary" />
        <h1 className="mt-5 text-3xl font-black uppercase italic">
          {shouldStartLive ? 'Go Live' : 'No Active Streams'}
        </h1>
        <p className="mt-4 text-zinc-400">
          Start a live session so other players can find you, follow you, and join your game.
        </p>
        <button
          onClick={onOpenStartModal}
          className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-brand-primary px-8 py-4 text-[9px] font-black uppercase tracking-[0.16em] text-white transition-all hover:bg-brand-accent hover:text-black sm:text-[10px] sm:tracking-[0.2em]"
        >
          <Radio size={16} />
          Start Streaming
        </button>
      </div>

      <StartStreamModal
        open={isStarting}
        submitting={isSubmitting}
        form={startForm}
        onClose={onCloseStartModal}
        onChange={onStartFormChange}
        onSubmit={onSubmitStartStream}
      />
    </div>
  );
}
