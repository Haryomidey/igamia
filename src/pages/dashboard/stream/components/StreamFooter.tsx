import React from 'react';
import { Send } from 'lucide-react';
import { StreamCommentStack } from './StreamCommentStack';
import type { StreamComment } from '../../../../hooks/useStream';

export function StreamFooter({
  isInvitedPending,
  isSubmitting,
  hostUsername,
  streamDescription,
  comments,
  message,
  onMessageChange,
  onSubmitMessage,
  onAcceptInvite,
  onDeclineInvite,
}: {
  isInvitedPending: boolean;
  isSubmitting: boolean;
  hostUsername?: string;
  streamDescription?: string;
  comments: StreamComment[];
  message: string;
  onMessageChange: (value: string) => void;
  onSubmitMessage: (event: React.FormEvent) => void;
  onAcceptInvite: () => void;
  onDeclineInvite: () => void;
}) {
  const commentEntries = [
    ...(streamDescription?.trim()
      ? [
          {
            id: 'stream-description',
            type: 'description' as const,
            username: hostUsername ?? 'Host',
            message: streamDescription.trim(),
          },
        ]
      : []),
    ...comments.map((comment) => ({
      id: comment._id,
      type: 'comment' as const,
      username: comment.username,
      message: comment.message,
    })),
  ];

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-linear-to-t from-black via-black/60 to-transparent px-3 pb-3 pt-24 sm:px-5 sm:pb-5 lg:px-8">
      <div className="flex h-full flex-col justify-end gap-3 sm:gap-4">
        {isInvitedPending && (
          <div
            className="pointer-events-auto flex flex-col gap-4 rounded-[1.75rem] border border-brand-primary/25 bg-black/55 p-4 shadow-xl backdrop-blur-md sm:flex-row sm:items-center sm:justify-between"
            onClick={(event) => event.stopPropagation()}
          >
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-brand-accent sm:text-[10px] sm:tracking-[0.24em]">
                Invitation Pending
              </p>
              <p className="mt-1.5 text-xs text-zinc-200 sm:mt-2 sm:text-sm">
                {hostUsername ?? 'The host'} invited you to join on camera. Accept to go live with
                them, or decline to stay out of the stage.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => onDeclineInvite()}
                disabled={isSubmitting}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-[9px] font-black uppercase tracking-[0.14em] text-white transition-colors hover:bg-white/10 disabled:opacity-50 sm:px-5 sm:py-3 sm:text-[10px] sm:tracking-[0.18em]"
              >
                Decline
              </button>
              <button
                onClick={() => onAcceptInvite()}
                disabled={isSubmitting}
                className="rounded-full bg-brand-primary px-4 py-2.5 text-[9px] font-black uppercase tracking-[0.14em] text-white transition-colors hover:bg-brand-accent hover:text-black disabled:opacity-50 sm:px-5 sm:py-3 sm:text-[10px] sm:tracking-[0.18em]"
              >
                {isSubmitting ? 'Updating...' : 'Accept Invite'}
              </button>
            </div>
          </div>
        )}

        <div className="pointer-events-auto w-full max-w-[min(92vw,26rem)] sm:max-w-sm">
          <StreamCommentStack comments={commentEntries} />
        </div>

        <form
          onSubmit={(event) => {
            event.stopPropagation();
            onSubmitMessage(event);
          }}
          className="pointer-events-auto flex items-center gap-2 rounded-[1.5rem] border border-white/10 bg-black/35 p-2 backdrop-blur-xl sm:gap-3"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex-1 rounded-[1.1rem] border border-white/10 bg-white/10 backdrop-blur-md">
            <input
              type="text"
              value={message}
              onChange={(event) => onMessageChange(event.target.value)}
              placeholder="Say something nice..."
              className="w-full bg-transparent px-4 py-3 text-xs text-white placeholder:text-zinc-400 focus:outline-none sm:px-5 sm:py-3.5 sm:text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] bg-brand-primary text-white transition-colors hover:bg-brand-accent hover:text-black disabled:opacity-50 sm:h-12 sm:w-12"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
