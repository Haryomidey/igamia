import React, { useEffect, useMemo, useState } from 'react';
import { Heart, MessageCircle, MoveLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useSocial } from '../../../hooks/useSocial';
import { useToast } from '../../../components/ToastProvider';

export default function PostPage() {
  const { postId } = useParams();
  const toast = useToast();
  const [commentText, setCommentText] = useState('');
  const [isLoadingPost, setIsLoadingPost] = useState(true);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const {
    feed,
    commentsByPost,
    error,
    connect,
    fetchPost,
    fetchPostComments,
    togglePostLike,
    commentOnPost,
  } = useSocial(false);

  const post = useMemo(
    () => (postId ? feed.find((item) => item._id === postId) ?? null : null),
    [feed, postId],
  );
  const comments = postId ? commentsByPost[postId] ?? [] : [];

  useEffect(() => {
    if (error) {
      toast.error(error, { title: 'Post Error' });
    }
  }, [error, toast]);

  useEffect(() => {
    if (!postId) {
      setIsLoadingPost(false);
      setIsLoadingComments(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        setIsLoadingPost(true);
        setIsLoadingComments(true);
        connect();
        await Promise.all([fetchPost(postId), fetchPostComments(postId)]);
      } catch (err: any) {
        if (!cancelled) {
          toast.error(err?.response?.data?.message ?? 'Unable to load this post.');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingPost(false);
          setIsLoadingComments(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [postId]);

  const handleCommentSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!postId || !commentText.trim()) {
      return;
    }

    try {
      setIsSubmittingComment(true);
      await commentOnPost(postId, commentText.trim());
      setCommentText('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to add comment.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (!postId) {
    return (
      <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 text-sm text-zinc-400">
        Invalid post link.
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
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-accent">Post Thread</p>
              <h1 className="mt-3 text-3xl font-black uppercase italic tracking-tight text-white sm:text-4xl md:text-5xl">
                Community Post
              </h1>
            </div>
          </div>
        </div>
      </header>

      {isLoadingPost ? (
        <div className="rounded-[2rem] border border-white/10 bg-white/5 px-6 py-12 text-center text-zinc-500">
          Loading post...
        </div>
      ) : post ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <article className="rounded-[2rem] border border-white/10 bg-white/5 p-5 sm:rounded-[2.5rem] sm:p-6">
            <div className="flex items-center gap-4">
              <img
                src={post.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.username}`}
                alt={post.username}
                className="h-12 w-12 rounded-full border border-white/10 object-cover"
              />
              <div className="min-w-0">
                <p className="break-words font-black text-white">{post.userFullName || post.username}</p>
                <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                  @{post.username}
                  {post.createdAt ? ` • ${new Date(post.createdAt).toLocaleString()}` : ''}
                </p>
              </div>
            </div>

            {post.content ? (
              <p className="mt-5 break-words text-sm leading-relaxed text-zinc-200 sm:text-[15px]">
                {post.content}
              </p>
            ) : null}

            {post.mediaUrl ? (
              post.mediaType === 'video' ? (
                <video src={post.mediaUrl} controls className="mt-5 max-h-[32rem] w-full rounded-[2rem] bg-black/30" />
              ) : (
                <img
                  src={post.mediaUrl}
                  alt={post.content || post.username}
                  className="mt-5 w-full rounded-[2rem] object-cover"
                />
              )
            ) : null}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                onClick={() => void togglePostLike(post._id)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-widest ${
                  post.likedByMe ? 'bg-brand-primary/20 text-brand-primary' : 'bg-white/5 text-zinc-300'
                }`}
              >
                <Heart size={14} />
                {post.likesCount}
              </button>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-300">
                <MessageCircle size={14} />
                {post.commentsCount ?? comments.length}
              </div>
            </div>
          </article>

          <aside className="rounded-[2rem] border border-white/10 bg-white/5 p-5 sm:rounded-[2.5rem] sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-accent">Comments</p>
              <span className="text-xs text-zinc-500">{comments.length} loaded</span>
            </div>

            <div className="mt-4 max-h-[28rem] space-y-3 overflow-y-auto pr-1">
              {isLoadingComments ? (
                <div className="rounded-2xl bg-white/5 px-4 py-6 text-center text-zinc-500">
                  Loading comments...
                </div>
              ) : comments.length ? (
                comments.map((comment) => (
                  <div key={comment._id} className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={comment.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.username}`}
                        alt={comment.username}
                        className="h-10 w-10 rounded-full border border-white/10 object-cover"
                      />
                      <div className="min-w-0">
                        <p className="break-words text-sm font-black text-white">
                          {comment.userFullName || comment.username}
                        </p>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                          @{comment.username}
                          {comment.createdAt ? ` • ${new Date(comment.createdAt).toLocaleString()}` : ''}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 break-words text-sm leading-relaxed text-zinc-200">
                      {comment.message}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl bg-white/5 px-4 py-6 text-center text-zinc-500">
                  No comments yet. Start the conversation.
                </div>
              )}
            </div>

            <form onSubmit={handleCommentSubmit} className="mt-4 flex flex-col gap-3">
              <input
                type="text"
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                placeholder="Add a comment"
                className="min-w-0 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"
              />
              <button
                type="submit"
                disabled={!commentText.trim() || isSubmittingComment}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-primary px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-50"
              >
                <MessageCircle size={14} />
                {isSubmittingComment ? 'Sending...' : 'Comment'}
              </button>
            </form>
          </aside>
        </div>
      ) : (
        <div className="rounded-[2rem] border border-white/10 bg-white/5 px-6 py-12 text-center text-zinc-500">
          Post not found.
        </div>
      )}
    </div>
  );
}
