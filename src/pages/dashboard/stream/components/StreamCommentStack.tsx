import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { StreamComment } from '../../../../hooks/useStream';

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

export function StreamCommentStack({ comments }: { comments: StreamComment[] }) {
  return (
    <div className="max-h-36 max-w-[80%] space-y-1.5 overflow-y-auto pr-1 sm:max-h-48 sm:max-w-sm">
      <AnimatePresence initial={false}>
        {comments.map((comment) => (
          <motion.div
            key={comment._id}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border border-white/10 bg-black/35 px-3 py-2 text-xs backdrop-blur-md"
          >
            <span className="mr-2 text-[9px] font-black uppercase tracking-[0.16em] text-brand-primary">
              {comment.username}
            </span>
            <span className="text-[11px] text-zinc-100">{renderTaggedMessage(comment.message)}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
