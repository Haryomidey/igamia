import React, { useEffect, useMemo, useState } from 'react';
import { MessageCircle, MoveLeft, Send } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useSocial, type SocialUser } from '../../../hooks/useSocial';
import { useToast } from '../../../components/ToastProvider';
import { renderMessageWithLiveLinks } from '../../../lib/liveLinks';

export default function MessagesPage() {
  const { userId } = useParams();
  const toast = useToast();
  const [draftMessage, setDraftMessage] = useState('');
  const [isLoadingThread, setIsLoadingThread] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [targetUser, setTargetUser] = useState<SocialUser | null>(null);

  const {
    messages,
    error,
    connect,
    fetchSocialUser,
    fetchMessages,
    sendMessage,
  } = useSocial(false);

  const threadMessages = useMemo(() => {
    if (!userId) {
      return [];
    }

    return messages.filter(
      (message) => message.fromUserId === userId || message.toUserId === userId,
    );
  }, [messages, userId]);

  useEffect(() => {
    if (error) {
      toast.error(error, { title: 'Messages Error' });
    }
  }, [error, toast]);

  useEffect(() => {
    if (!userId) {
      setIsLoadingThread(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        setIsLoadingThread(true);
        connect();
        const [user] = await Promise.all([
          fetchSocialUser(userId),
          fetchMessages(userId),
        ]);

        if (!cancelled) {
          setTargetUser(user);
        }
      } catch (err: any) {
        if (!cancelled) {
          toast.error(err?.response?.data?.message ?? 'Unable to load this conversation.');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingThread(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!userId || !draftMessage.trim()) {
      return;
    }

    try {
      setIsSending(true);
      await sendMessage(userId, draftMessage.trim());
      setDraftMessage('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to send direct message.');
    } finally {
      setIsSending(false);
    }
  };

  if (!userId) {
    return (
      <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 text-sm text-zinc-400">
        Invalid conversation link.
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 sm:space-y-8">
      <header className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(157,124,240,0.16),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5 sm:rounded-[2.5rem] sm:p-6 md:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <Link
              to="/social"
              className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-zinc-400 transition-colors hover:text-white"
            >
              <MoveLeft size={14} />
              Back To Community
            </Link>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-accent">Direct Messages</p>
              <h1 className="mt-3 text-3xl font-black uppercase italic tracking-tight text-white sm:text-4xl md:text-5xl">
                {targetUser ? `Chat with ${targetUser.fullName || targetUser.username}` : 'Conversation'}
              </h1>
            </div>
          </div>
        </div>
      </header>

      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5 sm:rounded-[2.5rem] sm:p-6">
        <div className="flex items-center gap-4 border-b border-white/10 pb-5">
          <img
            src={targetUser?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${targetUser?.username || userId}`}
            alt={targetUser?.username || userId}
            className="h-14 w-14 rounded-full border border-white/10 object-cover"
          />
          <div className="min-w-0">
            <p className="break-words font-black text-white">
              {targetUser?.fullName || targetUser?.username || 'Loading user...'}
            </p>
            <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
              @{targetUser?.username || 'user'}
            </p>
            {targetUser?.bio ? (
              <p className="mt-2 break-words text-sm leading-relaxed text-zinc-400">
                {targetUser.bio}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-5 max-h-[28rem] space-y-3 overflow-y-auto pr-1">
          {isLoadingThread ? (
            <div className="rounded-2xl bg-black/20 px-4 py-6 text-center text-zinc-500">
              Loading conversation...
            </div>
          ) : threadMessages.length ? (
            threadMessages.map((message) => (
              <div
                key={message._id}
                className={`break-words rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  message.toUserId === userId
                    ? 'ml-10 bg-brand-primary/20 text-white'
                    : 'mr-10 bg-white/10 text-zinc-200'
                }`}
              >
                {renderMessageWithLiveLinks(message.message)}
              </div>
            ))
          ) : (
            <div className="rounded-2xl bg-black/20 px-4 py-6 text-center text-zinc-500">
              No messages yet. Say hello.
            </div>
          )}
        </div>

        <form onSubmit={handleSendMessage} className="mt-5 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={draftMessage}
            onChange={(event) => setDraftMessage(event.target.value)}
            placeholder="Send a direct message"
            className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"
          />
          <button
            type="submit"
            disabled={!draftMessage.trim() || isSending}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-primary px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-50"
          >
            {isSending ? <MessageCircle size={14} /> : <Send size={14} />}
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </form>
      </section>
    </div>
  );
}
