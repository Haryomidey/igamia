import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Gift,
  Heart,
  ImagePlus,
  MessageCircle,
  RefreshCcw,
  Search,
  UserPlus,
  Video,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useSocial, type SocialUser } from '../../../hooks/useSocial';
import { useWallet } from '../../../hooks/useWallet';
import { useToast } from '../../../components/ToastProvider';
import { useMediaUpload } from '../../../hooks/useMediaUpload';
import { CommunityVideoPlayer } from '../../../components/CommunityVideoPlayer';

type CommunityTab = 'feed' | 'friends' | 'discover' | 'requests';

type PendingMedia = {
  secureUrl: string;
  mediaType: 'image' | 'video';
  previewName: string;
  previewUrl: string;
};

export default function Social() {
  const [activeTab, setActiveTab] = useState<CommunityTab>('feed');
  const [selectedGamer, setSelectedGamer] = useState<SocialUser | null>(null);
  const [giftAmount, setGiftAmount] = useState('10');
  const [postText, setPostText] = useState('');
  const [search, setSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [sendingRequestUserId, setSendingRequestUserId] = useState<string | null>(null);
  const [acceptingRequestId, setAcceptingRequestId] = useState<string | null>(null);
  const [pendingMedia, setPendingMedia] = useState<PendingMedia | null>(null);
  const pendingPreviewUrlRef = useRef<string | null>(null);
  const toast = useToast();
  const navigate = useNavigate();

  const {
    discoverUsers,
    friends,
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

  const people = activeTab === 'friends' ? friends : discoverUsers;

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return people;
    }

    return people.filter((user) =>
      [user.username, user.fullName, user.bio].join(' ').toLowerCase().includes(query),
    );
  }, [people, search]);

  useEffect(() => {
    if (error) {
      toast.error(error, { title: 'Community Error' });
    }
  }, [error, toast]);

  useEffect(() => {
    pendingPreviewUrlRef.current = pendingMedia?.previewUrl ?? null;
  }, [pendingMedia?.previewUrl]);

  useEffect(() => {
    return () => {
      if (pendingPreviewUrlRef.current) {
        URL.revokeObjectURL(pendingPreviewUrlRef.current);
      }
    };
  }, []);

  const clearPendingMedia = () => {
    setPendingMedia((current) => {
      if (current?.previewUrl) {
        URL.revokeObjectURL(current.previewUrl);
      }

      return null;
    });
  };

  const handleCreatePost = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      await createPost({
        content: postText.trim(),
        mediaUrl: pendingMedia?.secureUrl,
        mediaType: pendingMedia?.mediaType ?? 'text',
      });
      setPostText('');
      clearPendingMedia();
      toast.success('Post shared to the community feed.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? err?.message ?? 'Unable to create post.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadMediaDraft = async (
    event: React.ChangeEvent<HTMLInputElement>,
    mediaType: 'image' | 'video',
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    clearPendingMedia();
    setPendingMedia({
      secureUrl: '',
      mediaType,
      previewName: file.name,
      previewUrl,
    });

    try {
      setIsUploadingMedia(true);
      const uploaded = await uploadMedia({
        file,
        purpose: 'post',
        resourceType: mediaType,
      });
      setPendingMedia((current) => {
        if (!current || current.previewUrl !== previewUrl) {
          return current;
        }

        return {
          ...current,
          secureUrl: uploaded.secureUrl,
        };
      });
      event.target.value = '';
      toast.success(`${mediaType === 'image' ? 'Image' : 'Video'} attached. Press Post to publish.`);
    } catch (err: any) {
      clearPendingMedia();
      toast.error(err?.response?.data?.message ?? 'Unable to upload post media.');
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleSendRequest = async (targetUserId: string) => {
    try {
      setSendingRequestUserId(targetUserId);
      await sendRequest(targetUserId);
      toast.success('Connection request sent.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to send request.');
    } finally {
      setSendingRequestUserId(null);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      setAcceptingRequestId(requestId);
      await acceptRequest(requestId);
      toast.success('Connection request accepted.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to accept request.');
    } finally {
      setAcceptingRequestId(null);
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
      setGiftAmount('10');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to send gift.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs: Array<{ id: CommunityTab; label: string; count?: number }> = [
    { id: 'feed', label: 'Feed' },
    { id: 'friends', label: 'Friends', count: friends.length },
    { id: 'discover', label: 'Discover', count: discoverUsers.length },
    { id: 'requests', label: 'Requests', count: requests.length },
  ];

  const showFeed = activeTab === 'feed';

  return (
    <div className="space-y-6 pb-12 sm:space-y-8">
      <header className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(157,124,240,0.16),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5 sm:rounded-[2.5rem] sm:p-6 md:p-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-3">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-accent">Community Feed</span>
            <h1 className="text-3xl font-black uppercase italic tracking-tight text-white sm:text-4xl md:text-5xl">Social Hub</h1>
            <p className="max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-[15px]">
              Discover is your suggestion list and now shows connected people first. Requests are pending connection
              invites sent to you. Friends are accepted connections, and only friends can gift or DM.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-black/20 px-4 py-2.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Wallet</span>
              <span className="text-sm font-black text-white">${walletData?.wallet.usdBalance.toFixed(2) ?? '0.00'}</span>
            </div>
            <button
              onClick={() => void fetchSocial()}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-white/10"
            >
              <RefreshCcw size={14} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <div className="sticky top-3 z-20 rounded-[1.6rem] border border-white/10 bg-[#16122d]/90 p-2.5 backdrop-blur-xl lg:hidden">
        <div className="grid grid-cols-4 gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-[1rem] px-1.5 py-3 text-[9px] font-black uppercase tracking-[0.14em] transition-all sm:text-[10px] ${
                activeTab === tab.id ? 'bg-brand-primary text-white' : 'text-zinc-500'
              }`}
            >
              {tab.label}
              {typeof tab.count === 'number' && tab.count > 0 ? ` (${tab.count})` : ''}
            </button>
          ))}
        </div>
      </div>

      <section className="grid gap-8 lg:grid-cols-[minmax(0,1.45fr)_360px]">
        <div className="space-y-6">
          <form onSubmit={handleCreatePost} className="rounded-[2rem] border border-white/10 bg-white/5 p-5 sm:rounded-[2.5rem] sm:p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-accent">Create Post</p>
                <h2 className="mt-2 text-lg font-black uppercase italic text-white sm:text-xl">Share with the feed</h2>
              </div>
              <div className="hidden rounded-full border border-white/10 bg-black/20 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 md:block">
                Feed First
              </div>
            </div>

            <textarea
              value={postText}
              onChange={(event) => setPostText(event.target.value)}
              placeholder="Drop a challenge update, stream highlight, or callout..."
              className="mt-5 min-h-32 w-full rounded-[1.5rem] border border-white/10 bg-black/20 px-4 py-4 text-sm leading-relaxed text-white outline-none placeholder:text-zinc-600 sm:rounded-[1.75rem] sm:px-5"
            />

            {pendingMedia && (
              <div className="mt-4 space-y-4 rounded-[1.5rem] border border-white/10 bg-black/20 p-4 sm:rounded-[1.75rem]">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-accent">Attached Draft Media</p>
                    <p className="mt-1 break-all text-sm text-white">{pendingMedia.previewName}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {isUploadingMedia ? 'Uploading media...' : 'This will post only when you click Post Now.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={clearPendingMedia}
                    className="shrink-0 rounded-full border border-white/10 bg-white/5 p-3 text-zinc-400"
                  >
                    <X size={16} />
                  </button>
                </div>

                {pendingMedia.mediaType === 'video' ? (
                  <CommunityVideoPlayer
                    src={pendingMedia.previewUrl}
                    className="max-h-[22rem] w-full rounded-[1.25rem]"
                    mutedByDefault
                  />
                ) : (
                  <img
                    src={pendingMedia.previewUrl}
                    alt={pendingMedia.previewName}
                    className="max-h-[22rem] w-full rounded-[1.25rem] object-cover"
                  />
                )}
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white">
                <ImagePlus size={14} />
                {isUploadingMedia ? 'Uploading...' : 'Attach Image'}
                <input type="file" accept="image/*" className="hidden" onChange={(event) => void handleUploadMediaDraft(event, 'image')} />
              </label>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white">
                <Video size={14} />
                {isUploadingMedia ? 'Uploading...' : 'Attach Video'}
                <input type="file" accept="video/*" className="hidden" onChange={(event) => void handleUploadMediaDraft(event, 'video')} />
              </label>
              <button
                type="submit"
                disabled={isSubmitting || isUploadingMedia || (!postText.trim() && !pendingMedia?.secureUrl)}
                className="rounded-full bg-brand-primary px-5 py-2 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-50"
              >
                {isSubmitting ? 'Posting...' : 'Post Now'}
              </button>
            </div>
          </form>

          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            {[
              { label: 'Feed Posts', value: feed.length },
              { label: 'Friends', value: friends.length },
              { label: 'Discover', value: discoverUsers.length },
              { label: 'Requests', value: requests.length },
            ].map((item) => (
              <div key={item.label} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 sm:rounded-[2rem] sm:p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{item.label}</p>
                <p className="mt-3 text-2xl font-black italic text-white sm:text-3xl">{item.value}</p>
              </div>
            ))}
          </div>

          {showFeed && (
            <div className="space-y-5">
              {feed.map((post) => (
                <motion.article
                  key={post._id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-[2rem] border border-white/10 bg-white/5 p-5 sm:rounded-[2.5rem] sm:p-6"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={post.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.username}`}
                      alt={post.username}
                      className="h-12 w-12 rounded-full border border-white/10 object-cover"
                    />
                    <div>
                      <p className="break-words font-black text-white">{post.userFullName || post.username}</p>
                      <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                        @{post.username} • {post.createdAt ? new Date(post.createdAt).toLocaleString() : 'Now'}
                      </p>
                    </div>
                  </div>
                  {post.content ? <p className="mt-5 break-words text-sm leading-relaxed text-zinc-200 sm:text-[15px]">{post.content}</p> : null}
                  {post.mediaUrl ? (
                    post.mediaType === 'video' ? (
                      <CommunityVideoPlayer
                        src={post.mediaUrl}
                        className="mt-5 max-h-[28rem] w-full"
                      />
                    ) : (
                      <img src={post.mediaUrl} alt={post.content || post.username} className="mt-5 w-full rounded-[2rem] object-cover" />
                    )
                  ) : null}
                  <div className="mt-5 flex items-center gap-3">
                    <button
                      onClick={() => void togglePostLike(post._id)}
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-widest ${
                        post.likedByMe ? 'bg-brand-primary/20 text-brand-primary' : 'bg-white/5 text-zinc-300'
                      }`}
                    >
                      <Heart size={14} />
                      {post.likesCount}
                    </button>
                    <button
                      onClick={() => navigate(`/post/${post._id}`)}
                      className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-300"
                    >
                      <MessageCircle size={14} />
                      {post.commentsCount ?? 0}
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
          )}
        </div>

        <aside className="space-y-5">
          <div className="hidden rounded-[2.5rem] border border-white/10 bg-white/5 p-3 lg:block">
            <div className="grid grid-cols-2 gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-[1.25rem] px-3 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                    activeTab === tab.id ? 'bg-brand-primary text-white' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {tab.label}
                  {typeof tab.count === 'number' && tab.count > 0 ? ` (${tab.count})` : ''}
                </button>
              ))}
            </div>
          </div>

          {(activeTab === 'discover' || activeTab === 'friends') && (
            <div className="space-y-4 rounded-[2rem] border border-white/10 bg-white/5 p-5 sm:rounded-[2.5rem] sm:p-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-accent">
                  {activeTab === 'friends' ? 'Connected Users' : 'Discover Players'}
                </p>
                <h3 className="mt-3 text-lg font-black uppercase italic text-white sm:text-xl">
                  {activeTab === 'friends' ? 'Your friends list' : 'Suggestions and connections'}
                </h3>
              </div>

              <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={`Search ${activeTab === 'friends' ? 'friends' : 'people'}`}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 py-4 pl-14 pr-6 text-white outline-none placeholder:text-zinc-600"
                />
              </div>

              <div className="space-y-3">
                {filteredUsers.map((gamer) => (
                  <button
                    key={gamer.id}
                    onClick={() => setSelectedGamer(gamer)}
                    className="flex w-full items-center gap-4 rounded-[1.5rem] border border-white/10 bg-black/20 p-4 text-left transition-all hover:bg-white/5 sm:rounded-[1.75rem]"
                  >
                    <img
                      src={gamer.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${gamer.username}`}
                      alt={gamer.username}
                      className="h-14 w-14 rounded-full object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="break-words font-black text-white">{gamer.fullName || gamer.username}</p>
                      <p className="text-[10px] uppercase tracking-widest text-zinc-500">@{gamer.username}</p>
                      {gamer.bio ? <p className="mt-2 line-clamp-2 break-words text-xs leading-relaxed text-zinc-400">{gamer.bio}</p> : null}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {gamer.connected && (
                          <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-300">
                            Connected
                          </span>
                        )}
                        {gamer.pendingRequestSent && (
                          <span className="rounded-full bg-white/10 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-zinc-400">
                            Request Sent
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
                {!filteredUsers.length && (
                  <div className="rounded-[1.75rem] border border-white/10 bg-black/20 px-5 py-8 text-center text-zinc-500">
                    No users found.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="space-y-4 rounded-[2rem] border border-white/10 bg-white/5 p-5 sm:rounded-[2.5rem] sm:p-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-accent">Pending Requests</p>
                <h3 className="mt-3 text-lg font-black uppercase italic text-white sm:text-xl">Connection invites</h3>
              </div>

              <div className="space-y-3">
                {requests.map((request) => (
                  <div key={request._id} className="rounded-[1.75rem] border border-white/10 bg-black/20 p-4">
                    <p className="break-words font-black text-white">{request.fromUserId?.fullName ?? request.fromUserId?.username}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-widest text-zinc-500">@{request.fromUserId?.username}</p>
                    <button
                      onClick={() => void handleAcceptRequest(request._id)}
                      disabled={acceptingRequestId === request._id}
                      className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-primary px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white disabled:opacity-50"
                    >
                      <UserPlus size={14} />
                      {acceptingRequestId === request._id ? 'Accepting...' : 'Accept'}
                    </button>
                  </div>
                ))}
                {!requests.length && (
                  <div className="rounded-[1.75rem] border border-white/10 bg-black/20 px-5 py-8 text-center text-zinc-500">
                    No pending requests.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'feed' && (
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 sm:rounded-[2.5rem] sm:p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-accent">How It Works</p>
              <div className="mt-4 space-y-3 text-sm leading-relaxed text-zinc-400">
                <p><span className="font-black text-white">Discover:</span> suggestions from the social discovery endpoint, now ordered with connected users first.</p>
                <p><span className="font-black text-white">Requests:</span> incoming pending connection requests waiting for your approval.</p>
                <p><span className="font-black text-white">Friends:</span> accepted connections. Only these users can receive gifts from you or chat by DM.</p>
              </div>
            </div>
          )}
        </aside>
      </section>

      {selectedGamer && (
        <div className="fixed inset-0 z-[100] bg-[#0f0b21]/90 p-3 sm:p-6 backdrop-blur-md">
          <div className="flex min-h-full items-center justify-center">
            <div className="max-h-[calc(100vh-1.5rem)] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-white/10 bg-[#1a1635] p-5 sm:max-h-[calc(100vh-3rem)] sm:rounded-[3rem] sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-accent">Player Actions</p>
                  <h3 className="mt-3 break-words text-xl font-black uppercase italic text-white sm:text-2xl">
                    {selectedGamer.fullName || selectedGamer.username}
                  </h3>
                  <p className="mt-3 break-words text-sm leading-relaxed text-zinc-400 sm:text-[15px]">
                    {selectedGamer.bio || 'Ready to connect on iGamia.'}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedGamer(null)}
                  className="rounded-full border border-white/10 bg-white/5 p-3 text-zinc-400"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {selectedGamer.connected ? (
                  <span className="rounded-full bg-emerald-500/15 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-300">
                    Connected
                  </span>
                ) : selectedGamer.pendingRequestSent ? (
                  <span className="rounded-full bg-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    Request Sent
                  </span>
                ) : (
                  <button
                    onClick={() => void handleSendRequest(selectedGamer.id)}
                    disabled={sendingRequestUserId === selectedGamer.id}
                    className="rounded-full bg-brand-primary px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white disabled:opacity-50"
                  >
                    {sendingRequestUserId === selectedGamer.id ? 'Sending...' : 'Send Request'}
                  </button>
                )}
              </div>

              {selectedGamer.connected && (
                <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                  <form onSubmit={handleGift} className="rounded-[2rem] border border-white/10 bg-black/20 p-5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-accent">Send Gift</p>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      value={giftAmount}
                      onChange={(event) => setGiftAmount(event.target.value)}
                      className="mt-4 w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-white outline-none"
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-primary px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white disabled:opacity-50"
                    >
                      <Gift size={14} />
                      Send Gift
                    </button>
                  </form>

                  <div className="rounded-[2rem] border border-white/10 bg-black/20 p-5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-accent">Direct Messages</p>
                    <p className="mt-4 text-sm leading-relaxed text-zinc-400">
                      Open the full conversation page to view message history and chat in realtime.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        navigate(`/messages/${selectedGamer.id}`);
                        setSelectedGamer(null);
                      }}
                      className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-white/10 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white"
                    >
                      <MessageCircle size={14} />
                      Open Messages
                    </button>
                  </div>
                </div>
              )}

              {!selectedGamer.connected && (
                <div className="mt-8 rounded-[2rem] border border-white/10 bg-black/20 p-5 text-sm leading-relaxed text-zinc-400">
                  Gifts and direct messages are available only after the connection request is accepted.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
