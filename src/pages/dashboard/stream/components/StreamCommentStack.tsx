import React from 'react';
import { motion } from 'motion/react';
import type { StreamComment } from '../../../../hooks/useStream';

type StreamCommentEntry =
  | {
      id: string;
      type: 'description';
      username: string;
      message: string;
    }
  | {
      id: string;
      type: 'comment';
      username: string;
      message: string;
    };

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

export function StreamCommentStack({ comments }: { comments: StreamCommentEntry[] }) {
  return (
    <div
      className="max-h-44 max-w-[80%] space-y-1.5 overflow-y-auto pr-1 sm:max-h-56 sm:max-w-sm"
      style={{ scrollbarGutter: 'stable' }}
    >
      {comments.map((comment, index) => (
        <motion.div
          key={comment.id}
          initial={index > comments.length - 4 ? { opacity: 0, y: 12 } : false}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl border px-3 py-2 text-xs backdrop-blur-md ${
            comment.type === 'description'
              ? 'border-brand-accent/20 bg-brand-accent/10'
              : 'border-white/10 bg-black/35'
          }`}
        >
          <span
            className={`mr-2 text-[9px] font-black uppercase tracking-[0.16em] ${
              comment.type === 'description' ? 'text-brand-accent' : 'text-brand-primary'
            }`}
          >
            {comment.username}
          </span>
          <span className="text-[11px] text-zinc-100">{renderTaggedMessage(comment.message)}</span>
        </motion.div>
      ))}
    </div>
  );
}
