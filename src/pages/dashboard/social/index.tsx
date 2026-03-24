import React, { useEffect, useMemo, useState } from 'react';
import { Gift, Heart, ImagePlus, RefreshCcw, Search, Video } from 'lucide-react';
import { motion } from 'motion/react';
import { useSocial, type SocialUser } from '../../../hooks/useSocial';
import { useWallet } from '../../../hooks/useWallet';
import { useToast } from '../../../components/ToastProvider';
import { useMediaUpload } from '../../../hooks/useMediaUpload';

export default function Social() {
  const [activeTab, setActiveTab] = useState<'feed' | 'discover' | 'requests'>('feed');
  const [selectedGamer, setSelectedGamer] = useState<SocialUser | null>(null);
  const [giftAmount, setGiftAmount] = useState('10');
  const [postText, setPostText] = useState('');
  const [search, setSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const {
    discoverUsers,
    requests,
    feed,
    loading,
    error,
    sendRequest,
    acceptRequest,
    fetchSocial,
    createPost,
    togglePostLike,
  } = useSocial(true);
  const { walletData, gift } = useWallet(true);
  const { uploadMedia } = useMediaUpload();

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return discoverUsers;
    }

    return discoverUsers.filter((user) =>
      [user.username, user.fullName, user.bio].join(' ').toLowerCase().includes(query),
    );
  }, [discoverUsers, search]);

  useEffect(() => {
    if (error) {
      toast.error(error, { title: 'Community Error' });
    }
  }, [error, toast]);

  const handleCreatePost = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      await createPost({ content: postText.trim(), mediaType: 'text' });
      setPostText('');
      toast.success('Post shared to the community feed.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to create post.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadMediaPost = async (
    event: React.ChangeEvent<HTMLInputElement>,
    mediaType: 'image' | 'video',
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setIsSubmitting(true);
      const uploaded = await uploadMedia({
        file,
        purpose: 'post',
        resourceType: mediaType,
      });
      await createPost({
        content: postText.trim(),
        mediaUrl: uploaded.secureUrl,
        mediaType,
      });
      setPostText('');
      event.target.value = '';
      toast.success(`${mediaType === 'image' ? 'Image' : 'Video'} post published.`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to upload post media.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendRequest = async (targetUserId: string) => {
    try {
      await sendRequest(targetUserId);
      toast.success('Connection request sent.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to send request.');
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await acceptRequest(requestId);
      toast.success('Connection request accepted.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to accept request.');
    }
  };

  const handleGift = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedGamer) {
      return;
    }

    try {
      setIsSubmitting(true);
      await gift({
        receiverUserId: selectedGamer.id,
        amount: Number(giftAmount),
        description: `Gift sent to ${selectedGamer.username}`,
      });
      toast.success(`Gift sent successfully to ${selectedGamer.username}.`);
      setSelectedGamer(null);
      setGiftAmount('10');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to send gift.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-12 pb-12">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-black text-white uppercase italic">Community</h1>
          <p className="mt-2 text-sm text-zinc-500">
            A mini social feed for creators and players, plus discovery and requests.
          </p>
        </div>
        <button
          onClick={() => void fetchSocial()}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all"
        >
          <RefreshCcw size={14} />
          Refresh
        </button>
      </header>

      <div className="flex gap-6 border-b border-white/10">
        {[
          { id: 'feed', label: 'Feed' },
          { id: 'discover', label: 'Discover' },
          { id: 'requests', label: `Requests (${requests.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'feed' | 'discover' | 'requests')}
            className={`pb-4 text-[10px] font-black uppercase tracking-[0.2em] ${
              activeTab === tab.id ? 'text-white' : 'text-zinc-500'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'feed' && (
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <form onSubmit={handleCreatePost} className="rounded-[2.5rem] border border-white/10 bg-white/5 p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-accent">
                Share With Community
              </p>
              <textarea
                value={postText}
                onChange={(event) => setPostText(event.target.value)}
                placeholder="Drop a challenge update, stream highlight, or callout..."
                className="mt-4 min-h-32 w-full rounded-[1.5rem] border border-white/10 bg-black/20 px-4 py-4 text-sm text-white outline-none"
              />
              <div className="mt-4 flex flex-wrap gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white">
                  <ImagePlus size={14} />
                  Image
                  <input type="file" accept="image/*" className="hidden" onChange={(event) => void handleUploadMediaPost(event, 'image')} />
                </label>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white">
                  <Video size={14} />
                  Video
                  <input type="file" accept="video/*" className="hidden" onChange={(event) => void handleUploadMediaPost(event, 'video')} />
                </label>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-full bg-brand-primary px-5 py-2 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-50"
                >
                  {isSubmitting ? 'Posting...' : 'Post Now'}
                </button>
              </div>
            </form>

            <div className="space-y-5">
              {feed.map((post) => (
                <motion.article
                  key={post._id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-[2.5rem] border border-white/10 bg-white/5 p-6"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={post.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.username}`}
                      alt={post.username}
                      className="h-12 w-12 rounded-full border border-white/10 object-cover"
                    />
                    <div>
                      <p className="font-black text-white">{post.userFullName || post.username}</p>
                      <p className="text-[10px] uppercase tracking-widest text-zinc-500">
                        @{post.username} • {post.createdAt ? new Date(post.createdAt).toLocaleString() : 'Now'}
                      </p>
                    </div>
                  </div>
                  {post.content ? <p className="mt-5 text-sm leading-relaxed text-zinc-200">{post.content}</p> : null}
                  {post.mediaUrl ? (
                    post.mediaType === 'video' ? (
                      <video src={post.mediaUrl} controls className="mt-5 max-h-[28rem] w-full rounded-[2rem] bg-black/30" />
                    ) : (
                      <img src={post.mediaUrl} alt={post.content || post.username} className="mt-5 w-full rounded-[2rem] object-cover" />
                    )
                  ) : null}
                  <div className="mt-5 flex items-center gap-3">
                    <button
                      onClick={() => void togglePostLike(post._id)}
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-widest ${
                        post.likedByMe
                          ? 'bg-brand-primary/20 text-brand-primary'
                          : 'bg-white/5 text-zinc-300'
                      }`}
                    >
                      <Heart size={14} />
                      {post.likesCount}
                    </button>
                  </div>
                </motion.article>
              ))}
              {!feed.length && !loading && (
                <div className="rounded-[2rem] border border-white/10 bg-white/5 px-6 py-12 text-center text-zinc-500">
                  No posts yet. Start the community feed.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-white/10 bg-white/5 p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-accent">
              Wallet Snapshot
            </p>
            <p className="mt-3 text-3xl font-black italic text-white">
              ${walletData?.wallet.usdBalance.toFixed(2) ?? '0.00'}
            </p>
            <p className="mt-2 text-sm text-zinc-400">Use gifts and posts to stay active in the feed.</p>
          </div>
        </div>
      )}

      {activeTab === 'discover' && (
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search people"
                className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-14 pr-6 text-white"
              />
            </div>
            {filteredUsers.map((gamer) => (
              <button
                key={gamer.id}
                onClick={() => setSelectedGamer(gamer)}
                className="flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-left"
              >
                <img
                  src={gamer.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${gamer.username}`}
                  alt={gamer.username}
                  className="h-14 w-14 rounded-full object-cover"
                />
                <div>
                  <p className="font-black text-white">{gamer.fullName || gamer.username}</p>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500">@{gamer.username}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="rounded-[3rem] border border-white/10 bg-white/5 p-12 text-center">
            {selectedGamer ? (
              <>
                <p className="text-xl font-black uppercase italic text-white">
                  {selectedGamer.fullName || selectedGamer.username}
                </p>
                <p className="mt-3 text-zinc-400">{selectedGamer.bio || 'Ready to connect on iGamia.'}</p>
                <div className="mt-8 flex flex-wrap justify-center gap-4">
                  <button
                    onClick={() => void handleSendRequest(selectedGamer.id)}
                    className="rounded-2xl bg-brand-primary px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white"
                  >
                    Send Request
                  </button>
                  <button
                    onClick={() => setSelectedGamer(selectedGamer)}
                    className="rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white"
                  >
                    Send Gift
                  </button>
                </div>
              </>
            ) : (
              <p className="text-zinc-500">Select a player to connect.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {requests.map((request) => (
            <div key={request._id} className="rounded-[2.5rem] border border-white/10 bg-white/5 p-6">
              <p className="font-black text-white">{request.fromUserId?.fullName ?? request.fromUserId?.username}</p>
              <p className="mt-1 text-[10px] uppercase tracking-widest text-zinc-500">
                @{request.fromUserId?.username}
              </p>
              <button
                onClick={() => void handleAcceptRequest(request._id)}
                className="mt-5 rounded-2xl bg-brand-primary px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white"
              >
                Accept
              </button>
            </div>
          ))}
          {!requests.length && (
            <div className="rounded-[2rem] border border-white/10 bg-white/5 px-6 py-12 text-center text-zinc-500">
              No pending requests.
            </div>
          )}
        </div>
      )}

      {selectedGamer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0f0b21]/90 p-6 backdrop-blur-md">
          <div className="w-full max-w-md rounded-[3rem] border border-white/10 bg-[#1a1635] p-10">
            <h3 className="text-2xl font-black uppercase italic text-white">
              Gift {selectedGamer.fullName || selectedGamer.username}
            </h3>
            <form onSubmit={handleGift} className="mt-8 space-y-6">
              <input
                type="number"
                min="1"
                step="0.01"
                value={giftAmount}
                onChange={(event) => setGiftAmount(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-white"
              />
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setSelectedGamer(null)}
                  className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-2xl bg-brand-primary px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white disabled:opacity-50"
                >
                  <Gift size={14} className="inline-block" /> Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
