import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, Users, Share2, Send, Maximize2, Volume2, Settings, Play, Gift, Shield, X, Heart, RefreshCcw, UserPlus, Radio, UserRoundPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useStream } from '../../../hooks/useStream';
import { useToast } from '../../../components/ToastProvider';
import { useSocial } from '../../../hooks/useSocial';

function renderTaggedMessage(message: string) {
  const parts = message.split(/(@[a-zA-Z0-9_]+)/g);

  return (
    <>
      {parts.map((part, index) =>
        part.startsWith('@') ? (
          <span key={`${part}-${index}`} className="font-black text-brand-accent">
            {part}
          </span>
        ) : (
          <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
        ),
      )}
    </>
  );
}

export default function LiveStream() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const streamId = searchParams.get('streamId');

  const { user } = useAuth();
  const {
    activeStreams,
    stream,
    comments,
    loading,
    error,
    fetchActiveStreams,
    fetchStream,
    likeStream,
    shareStream,
    commentOnStream,
    giftStream,
    connect,
    joinRoom,
    leaveRoom,
    inviteStreamer,
    stopStream,
    startStream,
  } = useStream();
  const { discoverUsers, sendRequest, fetchSocial } = useSocial(true);
  const toast = useToast();

  const [message, setMessage] = useState('');
  const [isGifting, setIsGifting] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [giftAmount, setGiftAmount] = useState('10');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startForm, setStartForm] = useState({
    title: '',
    description: '',
    category: 'General',
  });

  useEffect(() => {
    void fetchActiveStreams();
    void fetchSocial();
  }, []);

  const resolvedStreamId = streamId ?? activeStreams[0]?._id ?? null;

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

  const host = stream?.participants.find((participant) => participant.role === 'host') ?? stream?.participants[0];
  const isHostView = Boolean(user?._id && stream?.hostUserId === user._id);
  const heroImage = useMemo(() => `https://picsum.photos/seed/${stream?._id ?? 'stream'}/1600/900`, [stream?._id]);

  const mentionCandidates = useMemo(() => {
    const usernames = new Set<string>();
    if (host?.username) usernames.add(host.username);
    stream?.participants.forEach((participant) => usernames.add(participant.username));
    comments.forEach((comment) => usernames.add(comment.username));
    return Array.from(usernames).filter((username) => username !== user?.username).slice(0, 5);
  }, [comments, host?.username, stream?.participants, user?.username]);

  const inviteCandidates = useMemo(() => {
    const participantIds = new Set(stream?.participants.map((participant) => participant.userId) ?? []);
    return discoverUsers.filter((candidate) => !participantIds.has(candidate.id) && candidate.id !== user?._id);
  }, [discoverUsers, stream?.participants, user?._id]);

  useEffect(() => {
    if (error) {
      toast.error(error, { title: 'Stream Error' });
    }
  }, [error, toast]);

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!resolvedStreamId || !message.trim()) {
      return;
    }

    try {
      setIsSubmitting(true);
      await commentOnStream(resolvedStreamId, message.trim());
      await fetchStream(resolvedStreamId);
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
      const result = await giftStream(resolvedStreamId, {
        amount: Number(giftAmount),
        description: `Gift sent during ${stream?.title ?? 'live stream'}`,
      });
      toast.success(result.data?.message ?? 'Gift sent successfully.');
      setIsGifting(false);
      setGiftAmount('10');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to send gift.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async () => {
    if (!resolvedStreamId) {
      return;
    }

    if (isHostView) {
      toast.info('You cannot like your own live stream.');
      return;
    }

    try {
      await likeStream(resolvedStreamId);
      await fetchStream(resolvedStreamId);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to like stream.');
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
      toast.success('Stream link copied to clipboard.');
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
      toast.success('User invited to the live session.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to invite user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStopStream = async () => {
    if (!resolvedStreamId) {
      return;
    }

    try {
      await stopStream(resolvedStreamId);
      toast.success('Live stream ended.');
      navigate('/home');
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
      toast.success('Your stream is live.');
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
      <div className="min-h-screen bg-[#0a0817] text-white flex items-center justify-center px-6">
        <div className="w-full max-w-xl rounded-[3rem] border border-white/10 bg-[#141128] p-10 text-center space-y-6">
          <Radio size={32} className="mx-auto text-brand-primary" />
          <h1 className="text-3xl font-black uppercase italic">No Active Streams</h1>
          <p className="text-zinc-400">Start a live session so other players can find you, follow you, and join your game.</p>
          <button
            onClick={() => setIsStarting(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-brand-primary px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-brand-accent hover:text-black"
          >
            <Radio size={16} />
            Start Streaming
          </button>
        </div>

        <AnimatePresence>
          {isStarting && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0f0b21]/90 p-6 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-md rounded-[3rem] border border-white/10 bg-brand-deep p-10 relative"
              >
                <button onClick={() => setIsStarting(false)} className="absolute right-8 top-8 text-zinc-500 hover:text-white">
                  <X size={24} />
                </button>
                <h2 className="mb-8 text-2xl font-black uppercase italic text-white">Go Live</h2>
                <form onSubmit={handleStartStream} className="space-y-5">
                  <input
                    value={startForm.title}
                    onChange={(e) => setStartForm((current) => ({ ...current, title: e.target.value }))}
                    placeholder="Stream title"
                    className="w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-white focus:outline-none focus:border-brand-primary/50"
                    required
                  />
                  <input
                    value={startForm.category}
                    onChange={(e) => setStartForm((current) => ({ ...current, category: e.target.value }))}
                    placeholder="Category"
                    className="w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-white focus:outline-none focus:border-brand-primary/50"
                  />
                  <textarea
                    value={startForm.description}
                    onChange={(e) => setStartForm((current) => ({ ...current, description: e.target.value }))}
                    placeholder="What are you streaming?"
                    className="min-h-28 w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-white focus:outline-none focus:border-brand-primary/50"
                  />
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
    <div className="fixed inset-0 bg-[#0a0817] z-50 flex flex-col lg:flex-row overflow-hidden">
      <div className="flex-1 flex flex-col">
        <div className="flex-1 relative group bg-black">
          <div className="absolute inset-0">
            <img src={heroImage} alt={stream?.title ?? 'Live Stream'} className="w-full h-full object-cover opacity-90" />
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-black/40" />
          </div>

          <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-10">
            <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center text-white hover:bg-white/20 transition-all">
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-red-600 px-3 py-1 rounded-lg">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-white text-[10px] font-black uppercase tracking-widest">Live</span>
              </div>
              <button onClick={() => void fetchActiveStreams()} className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 text-white text-[10px] font-black uppercase tracking-widest">
                <RefreshCcw size={14} />
              </button>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-6 flex items-center justify-between z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-4">
              <button className="text-white/80 hover:text-white transition-colors"><Play size={24} fill="currentColor" /></button>
              <div className="flex items-center gap-2">
                <Volume2 size={20} className="text-white/80" />
                <div className="w-24 h-1 bg-white/20 rounded-full overflow-hidden">
                  <div className="w-2/3 h-full bg-brand-primary" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="text-white/80 hover:text-white transition-colors"><Settings size={20} /></button>
              <button className="text-white/80 hover:text-white transition-colors"><Maximize2 size={20} /></button>
            </div>
          </div>
        </div>

        <div className="bg-brand-deep p-6 border-t border-white/10 flex items-center justify-between gap-6">
          <div className="flex items-center gap-6 min-w-0">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-brand-primary p-1">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${host?.username ?? stream?.title ?? 'streamer'}`} alt="Streamer" className="w-full h-full object-cover rounded-xl" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-brand-primary rounded-full border-2 border-brand-deep flex items-center justify-center">
                <Shield size={10} className="text-white" />
              </div>
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-black text-white uppercase italic mb-1 truncate">{host?.username ?? 'Live Host'}</h2>
              <div className="flex flex-wrap items-center gap-4">
                <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">{stream?.title ?? 'Loading stream...'}</p>
                <div className="flex items-center gap-2 text-brand-primary">
                  <Users size={14} />
                  <span className="text-[10px] font-black">{stream?.viewersCount ?? 0} Watching</span>
                </div>
                {isHostView && <span className="rounded-full bg-brand-primary/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary">Your View</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 flex-wrap justify-end">
            {isHostView ? (
              <>
                <button onClick={() => setIsInviting(true)} className="bg-white/5 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all border border-white/10 flex items-center gap-2">
                  <UserRoundPlus size={16} className="text-brand-accent" /> Invite User
                </button>
                <button onClick={handleStopStream} className="bg-brand-primary text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-accent hover:text-black transition-all shadow-lg shadow-brand-primary/20 inline-flex items-center gap-2">
                  <Radio size={16} /> End Live
                </button>
              </>
            ) : (
              <>
                <button onClick={handleFollowHost} className="bg-white/5 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all border border-white/10 flex items-center gap-2">
                  <UserPlus size={16} className="text-brand-accent" /> Follow
                </button>
                <button onClick={() => setIsGifting(true)} className="bg-white/5 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all border border-white/10 flex items-center gap-2">
                  <Gift size={16} className="text-brand-accent" /> Send Gift
                </button>
                <button onClick={() => void handleLike()} className="bg-brand-primary text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-accent hover:text-black transition-all shadow-lg shadow-brand-primary/20 inline-flex items-center gap-2">
                  <Heart size={16} /> {stream?.likesCount ?? 0}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="w-full lg:w-100 bg-[#0f0b21] border-l border-white/10 flex flex-col">
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/20">
          <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] italic">Live Chat</h3>
          <div className="flex gap-4">
            <button onClick={() => void handleShare()} className="text-zinc-500 hover:text-white transition-colors"><Share2 size={18} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          <div className="bg-brand-primary/10 border border-brand-primary/20 p-4 rounded-xl mb-4">
            <p className="text-[10px] text-brand-primary font-black uppercase tracking-widest mb-1">Welcome to the chat!</p>
            <p className="text-[10px] text-zinc-400 font-medium">Use @username to tag players and streamers in chat.</p>
          </div>
          {comments.map((msg) => (
            <div key={msg._id} className="flex gap-3 group">
              <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-white/10">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.username}`} alt={msg.username} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-widest truncate text-brand-primary">{msg.username}</span>
                  {user?.username === msg.username && <span className="bg-brand-accent/20 text-brand-accent text-[8px] px-1.5 py-0.5 rounded font-black uppercase">You</span>}
                </div>
                <p className="text-zinc-300 text-xs leading-relaxed break-words">{renderTaggedMessage(msg.message)}</p>
              </div>
            </div>
          ))}
          {!comments.length && !loading && <div className="text-center text-zinc-500">No comments yet.</div>}
        </div>

        <div className="p-6 border-t border-white/10 bg-black/40 space-y-4">
          {mentionCandidates.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {mentionCandidates.map((username) => (
                <button
                  key={username}
                  type="button"
                  onClick={() => setMessage((current) => `${current}${current.trim() ? ' ' : ''}@${username} `)}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-300 hover:border-brand-primary/30 hover:text-white"
                >
                  @{username}
                </button>
              ))}
            </div>
          )}
          <form onSubmit={handleSendMessage} className="relative">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Send a message or tag @username..."
              className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-6 pr-14 text-white text-xs focus:outline-none focus:border-brand-primary/50 transition-all"
            />
            <button type="submit" disabled={isSubmitting} className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-brand-primary text-white rounded-lg flex items-center justify-center hover:bg-brand-accent hover:text-black transition-all disabled:opacity-50">
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>

      <AnimatePresence>
        {isGifting && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-6 bg-[#0f0b21]/90 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="w-full max-w-md bg-brand-deep border border-white/10 rounded-[3rem] p-10 relative shadow-2xl">
              <button onClick={() => setIsGifting(false)} className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
              <div className="flex flex-col items-center text-center mb-10">
                <div className="w-24 h-24 rounded-3xl overflow-hidden bg-white/5 border border-white/10 mb-6 p-2">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${host?.username ?? 'host'}`} alt={host?.username ?? 'Host'} className="w-full h-full object-cover rounded-2xl" />
                </div>
                <h3 className="text-2xl font-black text-white uppercase italic">Gift {host?.username ?? 'Host'}</h3>
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-2">Support the live host with a wallet-backed gift.</p>
              </div>
              <form onSubmit={handleGift} className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-1">Gift Amount (USD)</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-primary font-black">$</span>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      value={giftAmount}
                      onChange={(e) => setGiftAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 pl-12 pr-6 text-white font-black focus:outline-none focus:border-brand-primary/50 transition-all"
                      required
                    />
                  </div>
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full bg-brand-primary text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-brand-accent hover:text-black transition-all disabled:opacity-50 shadow-lg shadow-brand-primary/20">
                  {isSubmitting ? 'Sending...' : 'Send Gift'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isInviting && isHostView && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-6 bg-[#0f0b21]/90 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="w-full max-w-lg bg-brand-deep border border-white/10 rounded-[3rem] p-10 relative shadow-2xl">
              <button onClick={() => setIsInviting(false)} className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
              <h3 className="mb-8 text-2xl font-black uppercase italic text-white">Invite Players</h3>
              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                {inviteCandidates.length ? (
                  inviteCandidates.map((candidate) => (
                    <div key={candidate.id} className="flex items-center justify-between gap-4 rounded-[2rem] border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="h-12 w-12 overflow-hidden rounded-2xl border border-white/10">
                          <img src={candidate.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${candidate.username}`} alt={candidate.username} className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black uppercase italic text-white">{candidate.fullName || candidate.username}</p>
                          <p className="truncate text-[10px] font-black uppercase tracking-widest text-zinc-500">@{candidate.username}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => void handleInvite(candidate.id)}
                        className="rounded-xl bg-brand-primary px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-brand-accent hover:text-black"
                      >
                        Invite
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[2rem] border border-white/10 bg-white/5 px-6 py-10 text-center text-zinc-500">
                    No more users available to invite right now.
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
