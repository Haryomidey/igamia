import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { usePledges, type MatchActivity } from '../../../hooks/usePledges';
import { useToast } from '../../../components/ToastProvider';

export default function DisputePage() {
  const navigate = useNavigate();
  const { matchId } = useParams();
  const toast = useToast();
  const { fetchDispute, sendDisputeMessage } = usePledges(false);
  const [match, setMatch] = useState<MatchActivity | null>(null);
  const [messages, setMessages] = useState<
    Array<{
      senderUserId?: string;
      senderUsername: string;
      senderRole: 'streamer' | 'assistant';
      message: string;
      createdAt: string;
    }>
  >([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!matchId) {
      return;
    }

    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchDispute(matchId);
        if (active) {
          setMatch(data.match);
          setMessages(data.dispute.messages ?? []);
        }
      } catch (err: any) {
        toast.error(err?.response?.data?.message ?? 'Unable to load dispute.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();
    const interval = window.setInterval(() => {
      void load();
    }, 8000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [matchId, toast]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!matchId || !message.trim()) {
      return;
    }

    try {
      setSubmitting(true);
      const data = await sendDisputeMessage(matchId, message.trim());
      setMessages(data.dispute.messages ?? []);
      setMessage('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to send dispute message.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white"
      >
        <ArrowLeft size={14} />
        Back
      </button>

      <header className="space-y-3">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-accent">
          Dispute Room
        </p>
        <h1 className="text-4xl font-black uppercase italic text-white">
          {match?.title ?? 'Pledge Dispute'}
        </h1>
        <p className="max-w-2xl text-sm text-zinc-400">
          Use this page to explain what happened in the match. Both streamers and the assistant
          thread can respond here.
        </p>
      </header>

      <div className="rounded-[2.5rem] border border-white/10 bg-white/5 p-6">
        {loading ? (
          <div className="py-16 text-center text-zinc-500">Loading dispute conversation...</div>
        ) : (
          <div className="space-y-4">
            {messages.map((entry, index) => (
              <div
                key={`${entry.senderUsername}-${entry.createdAt}-${index}`}
                className={`rounded-[1.75rem] px-5 py-4 ${
                  entry.senderRole === 'assistant'
                    ? 'border border-brand-primary/20 bg-brand-primary/10'
                    : 'border border-white/10 bg-black/20'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-accent">
                    {entry.senderUsername}
                  </p>
                  <p className="text-[10px] text-zinc-500">
                    {new Date(entry.createdAt).toLocaleString()}
                  </p>
                </div>
                <p className="mt-3 text-sm text-zinc-200">{entry.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/5 p-4 sm:flex-row">
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Explain your side of the match clearly..."
          className="min-h-28 flex-1 rounded-[1.5rem] border border-white/10 bg-black/20 px-4 py-4 text-sm text-white outline-none"
        />
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 rounded-[1.5rem] bg-brand-primary px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white disabled:opacity-50"
        >
          <Send size={14} />
          {submitting ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
