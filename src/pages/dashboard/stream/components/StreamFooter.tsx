import React from 'react';
import { MoreVertical, Send } from 'lucide-react';
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
  onOpenControls,
  canOpenControls,
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
  onOpenControls: () => void;
  canOpenControls: boolean;
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
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-linear-to-t from-black via-black/65 to-transparent px-4 pb-4 pt-24 sm:px-6 sm:pb-6 lg:px-8">
      <div className="flex h-full flex-col justify-end gap-3 sm:gap-4">
        {isInvitedPending && (
          <div
            className="pointer-events-auto flex flex-col gap-3 rounded-[1.4rem] border border-brand-primary/25 bg-black/55 p-3 shadow-xl backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:rounded-[1.75rem] sm:p-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div>
              <p className="text-[7px] font-black uppercase tracking-[0.16em] text-brand-accent sm:text-[9px] sm:tracking-[0.2em]">
                Invitation Pending
              </p>
              <p className="mt-1 text-[10px] text-zinc-200 sm:mt-1.5 sm:text-xs">
                {hostUsername ?? 'The host'} invited you to join on camera.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => onDeclineInvite()}
                disabled={isSubmitting}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[8px] font-black uppercase tracking-[0.12em] text-white transition-colors hover:bg-white/10 disabled:opacity-50 sm:px-5 sm:py-2.5 sm:text-[9px] sm:tracking-[0.16em]"
              >
                Decline
              </button>
              <button
                onClick={() => onAcceptInvite()}
                disabled={isSubmitting}
                className="rounded-full bg-brand-primary px-4 py-2 text-[8px] font-black uppercase tracking-[0.12em] text-white transition-colors hover:bg-brand-accent hover:text-black disabled:opacity-50 sm:px-5 sm:py-2.5 sm:text-[9px] sm:tracking-[0.16em]"
              >
                {isSubmitting ? 'Updating...' : 'Accept'}
              </button>
            </div>
          </div>
        )}

        <div className="pointer-events-auto w-full max-w-[min(100%,26rem)]">
          <StreamCommentStack comments={commentEntries} />
        </div>

        <form
          onSubmit={(event) => {
            event.stopPropagation();
            onSubmitMessage(event);
          }}
          className="pointer-events-auto flex w-full max-w-[min(92vw,32rem)] items-center gap-3"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex-1 rounded-full border border-white/10 bg-black/40 px-4 py-2.5 backdrop-blur-xl">
            <input
              type="text"
              value={message}
              onChange={(event) => onMessageChange(event.target.value)}
              placeholder="Comment..."
              className="w-full bg-transparent text-sm text-white placeholder:text-zinc-400 focus:outline-none"
            />
          </div>
          {canOpenControls && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onOpenControls();
              }}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20"
            >
              <MoreVertical size={18} />
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-primary text-white transition-colors hover:bg-brand-accent hover:text-black disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
