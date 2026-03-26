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
      className="max-h-44 w-full space-y-1 overflow-y-auto pr-1 sm:max-h-52"
      style={{ scrollbarGutter: 'stable' }}
    >
      {comments.map((comment, index) => (
        <motion.div
          key={comment.id}
          initial={index > comments.length - 4 ? { opacity: 0, y: 12 } : false}
          animate={{ opacity: 1, y: 0 }}
          className={`max-w-[85%] rounded-2xl border px-3 py-1 text-[11px] shadow-lg backdrop-blur-md ${
            comment.type === 'description'
              ? 'border-yellow-500/30 bg-yellow-500/20'
              : 'border-white/5 bg-black/40'
          }`}
        >
          <span
            className={`mb-0.5 block text-[10px] font-bold ${
              comment.type === 'description' ? 'text-yellow-400' : 'text-white/60'
            }`}
          >
            {comment.username}
          </span>
          <span className="text-[11px] leading-tight text-zinc-100">{renderTaggedMessage(comment.message)}</span>
        </motion.div>
      ))}
    </div>
  );
}
