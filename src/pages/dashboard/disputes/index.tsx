import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ImagePlus, Paperclip, Send, Video } from 'lucide-react';
import { usePledges, type MatchActivity } from '../../../hooks/usePledges';
import { useToast } from '../../../components/ToastProvider';

type DraftAttachment = {
  id: string;
  file: File;
  kind: 'image' | 'video';
  previewUrl: string;
};

async function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error(`Unable to read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

export default function DisputePage() {
  const navigate = useNavigate();
  const { matchId } = useParams();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const draftAttachmentsRef = useRef<DraftAttachment[]>([]);
  const { fetchDispute, sendDisputeMessage } = usePledges(false);
  const [match, setMatch] = useState<MatchActivity | null>(null);
  const [messages, setMessages] = useState<
    Array<{
      senderUserId?: string;
      senderUsername: string;
      senderRole: 'streamer' | 'assistant';
      message: string;
      attachments?: Array<{
        url: string;
        kind: 'image' | 'video';
        mimeType?: string;
        fileName?: string;
      }>;
      createdAt: string;
    }>
  >([]);
  const [message, setMessage] = useState('');
  const [draftAttachments, setDraftAttachments] = useState<DraftAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);

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
  }, [fetchDispute, matchId, toast]);

  useEffect(() => {
    draftAttachmentsRef.current = draftAttachments;
  }, [draftAttachments]);

  useEffect(() => {
    return () => {
      draftAttachmentsRef.current.forEach((attachment) => URL.revokeObjectURL(attachment.previewUrl));
    };
  }, []);

  const addFiles = (fileList: FileList | File[]) => {
    const allowed = Array.from(fileList).filter((file) => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      return isImage || isVideo;
    });

    if (!allowed.length) {
      toast.info('Only image and video evidence files can be added here.');
      return;
    }

    setDraftAttachments((current) => {
      const remainingSlots = Math.max(0, 4 - current.length);
      const nextFiles = allowed.slice(0, remainingSlots).map((file) => ({
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        kind: file.type.startsWith('video/') ? 'video' : 'image',
        previewUrl: URL.createObjectURL(file),
      }));

      if (allowed.length > remainingSlots) {
        toast.info('You can attach up to 4 evidence files per message.');
      }

      return [...current, ...nextFiles];
    });
  };

  const removeDraftAttachment = (attachmentId: string) => {
    setDraftAttachments((current) => {
      const target = current.find((attachment) => attachment.id === attachmentId);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return current.filter((attachment) => attachment.id !== attachmentId);
    });
  };

  const canSubmit = Boolean(message.trim() || draftAttachments.length);
  const disputeReason = useMemo(() => match?.dispute?.reason?.trim() || null, [match?.dispute?.reason]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!matchId || !canSubmit) {
      return;
    }

    try {
      setSubmitting(true);
      const attachments = await Promise.all(
        draftAttachments.map(async (attachment) => ({
          fileName: attachment.file.name,
          mimeType: attachment.file.type || (attachment.kind === 'video' ? 'video/mp4' : 'image/jpeg'),
          kind: attachment.kind,
          base64Data: await fileToBase64(attachment.file),
        })),
      );

      const data = await sendDisputeMessage(matchId, {
        message: message.trim() || undefined,
        attachments,
      });
      setMessages(data.dispute.messages ?? []);
      setMessage('');
      setDraftAttachments((current) => {
        current.forEach((attachment) => URL.revokeObjectURL(attachment.previewUrl));
        return [];
      });
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
          Share your side of the match with messages, screenshots, or videos so both streamers can review the case clearly.
        </p>
        {disputeReason && (
          <div className="max-w-3xl rounded-[1.75rem] border border-brand-primary/20 bg-brand-primary/10 px-5 py-4 text-sm text-zinc-200">
            <span className="mr-2 text-[10px] font-black uppercase tracking-[0.24em] text-brand-accent">Reason</span>
            {disputeReason}
          </div>
        )}
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
                {!!entry.attachments?.length && (
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {entry.attachments.map((attachment, attachmentIndex) => (
                      <div
                        key={`${attachment.url}-${attachmentIndex}`}
                        className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/30"
                      >
                        {attachment.kind === 'video' ? (
                          <video
                            controls
                            src={attachment.url}
                            className="h-56 w-full bg-black object-cover"
                          />
                        ) : (
                          <a href={attachment.url} target="_blank" rel="noreferrer">
                            <img
                              src={attachment.url}
                              alt={attachment.fileName ?? 'Dispute evidence'}
                              className="h-56 w-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </a>
                        )}
                        <div className="flex items-center justify-between gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-300">
                          <span className="truncate">
                            {attachment.fileName ?? `${attachment.kind} evidence`}
                          </span>
                          <a
                            href={attachment.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-brand-primary transition-colors hover:text-brand-accent"
                          >
                            Open
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-[2rem] border border-white/10 bg-white/5 p-4">
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Explain your side of the match clearly..."
          className="min-h-28 w-full rounded-[1.5rem] border border-white/10 bg-black/20 px-4 py-4 text-sm text-white outline-none"
        />

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={(event) => {
            if (event.target.files?.length) {
              addFiles(event.target.files);
              event.target.value = '';
            }
          }}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragActive(false);
            if (event.dataTransfer.files?.length) {
              addFiles(event.dataTransfer.files);
            }
          }}
          className={`flex w-full items-center justify-between gap-4 rounded-[1.5rem] border px-4 py-4 text-left transition-colors ${
            dragActive
              ? 'border-brand-primary bg-brand-primary/10'
              : 'border-white/10 bg-black/20 hover:bg-black/30'
          }`}
        >
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-white">
              Drop image or video evidence
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              Add screenshots, scoreboards, or gameplay recordings. Up to 4 files per message.
            </p>
          </div>
          <div className="flex items-center gap-2 text-zinc-300">
            <ImagePlus size={18} />
            <Video size={18} />
          </div>
        </button>

        {!!draftAttachments.length && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {draftAttachments.map((attachment) => (
              <div
                key={attachment.id}
                className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/30"
              >
                {attachment.kind === 'video' ? (
                  <video src={attachment.previewUrl} className="h-44 w-full object-cover" />
                ) : (
                  <img
                    src={attachment.previewUrl}
                    alt={attachment.file.name}
                    className="h-44 w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                )}
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-black uppercase tracking-[0.16em] text-white">
                      {attachment.file.name}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-[10px] text-zinc-400">
                      <Paperclip size={12} />
                      {attachment.kind}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDraftAttachment(attachment.id)}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-300 transition-colors hover:bg-white/10"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center justify-center gap-2 rounded-[1.5rem] border border-white/10 bg-white/5 px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white"
          >
            <Paperclip size={14} />
            Add Evidence
          </button>
          <button
            type="submit"
            disabled={submitting || !canSubmit}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-[1.5rem] bg-brand-primary px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white disabled:opacity-50"
          >
            <Send size={14} />
            {submitting ? 'Sending...' : 'Send To Dispute'}
          </button>
        </div>
      </form>
    </div>
  );
}
