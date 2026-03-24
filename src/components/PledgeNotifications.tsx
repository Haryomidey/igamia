import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Bell, Radio, UserPlus, X } from 'lucide-react';
import { io, type Socket } from 'socket.io-client';
import { api, getAccessToken, pledgeSocketUrl, streamSocketUrl } from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { useToast } from './ToastProvider';

type PledgeRequestNotification = {
  id: string;
  type: 'pledge_request';
  matchId: string;
  title: string;
  gameTitle: string;
  hostUserId: string;
  joinedByUserId: string;
  joinedByUsername: string;
  amountUsd: number;
  joinedAt: string;
  read: boolean;
};

type FollowedHostLiveNotification = {
  id: string;
  type: 'followed_host_live';
  streamId: string;
  hostUserId: string;
  hostUsername: string;
  title: string;
  createdAt: string;
  read: boolean;
};

type StreamInviteNotification = {
  id: string;
  type: 'stream_invite';
  streamId: string;
  hostUserId: string;
  hostUsername: string;
  title: string;
  createdAt: string;
  read: boolean;
};

type PledgeResultClaimNotification = {
  id: string;
  type: 'pledge_result_claim';
  matchId: string;
  title: string;
  claimedByUserId: string;
  claimedByUsername: string;
  outcome: 'win' | 'loss' | 'draw';
  note?: string;
  createdAt: string;
  read: boolean;
};

type PledgeDisputeNotification = {
  id: string;
  type: 'pledge_dispute';
  matchId: string;
  title: string;
  senderUsername: string;
  senderRole: 'streamer' | 'assistant';
  message: string;
  createdAt: string;
  read: boolean;
};

type DashboardNotification =
  | PledgeRequestNotification
  | FollowedHostLiveNotification
  | StreamInviteNotification
  | PledgeResultClaimNotification
  | PledgeDisputeNotification;

type PledgeNotificationsContextValue = {
  notifications: DashboardNotification[];
  unreadCount: number;
  activeNotification: DashboardNotification | null;
  setActiveNotification: (notification: DashboardNotification | null) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
};

const PledgeNotificationsContext = createContext<PledgeNotificationsContextValue | null>(null);

function formatNotificationTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Just now';
  }

  return date.toLocaleString();
}

export function PledgeNotificationsProvider({ children }: { children: React.ReactNode }) {
  const pledgeSocketRef = useRef<Socket | null>(null);
  const streamSocketRef = useRef<Socket | null>(null);
  const navigate = useNavigate();
  const toast = useToast();
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const [activeNotification, setActiveNotification] = useState<DashboardNotification | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token || pledgeSocketRef.current || streamSocketRef.current) {
      return;
    }

    const pledgeSocket = io(pledgeSocketUrl, {
      transports: ['websocket'],
      auth: {
        token,
      },
    });

    pledgeSocket.on('pledgeJoinRequested', (payload: Omit<PledgeRequestNotification, 'read' | 'type'>) => {
      const nextNotification: PledgeRequestNotification = {
        ...payload,
        type: 'pledge_request',
        read: false,
      };
      setNotifications((prev) => [nextNotification, ...prev].slice(0, 20));
      setActiveNotification(nextNotification);
    });

    pledgeSocket.on('pledgeJoinAccepted', (payload: {
      streamId: string;
      title: string;
      joinedByUsername: string;
    }) => {
      toast.success(`${payload.joinedByUsername} is ready. Opening the pledge live now.`, {
        title: 'Pledge Accepted',
      });
      navigate(`/stream?streamId=${payload.streamId}`);
    });

    pledgeSocket.on('pledgeJoinRejected', (payload: { title: string; hostUsername: string }) => {
      toast.info(`${payload.hostUsername} declined your request for ${payload.title}.`, {
        title: 'Pledge Rejected',
      });
    });

    pledgeSocket.on('pledgeResultClaimed', (payload: {
      matchId: string;
      title: string;
      claimedByUserId: string;
      claimedByUsername: string;
      outcome: 'win' | 'loss' | 'draw';
      note?: string;
    }) => {
      const nextNotification: PledgeResultClaimNotification = {
        ...payload,
        id: `claim:${payload.matchId}:${Date.now()}`,
        type: 'pledge_result_claim',
        createdAt: new Date().toISOString(),
        read: false,
      };

      setNotifications((prev) => [nextNotification, ...prev].slice(0, 20));
      setActiveNotification(nextNotification);
    });

    pledgeSocket.on('pledgeResultResolved', (payload: {
      title: string;
      decision: 'approved' | 'rejected';
      disputed?: boolean;
    }) => {
      toast.info(
        payload.decision === 'approved'
          ? `${payload.title} has been settled.`
          : payload.disputed
            ? `${payload.title} moved into dispute.`
            : `${payload.title} was updated.`,
        { title: 'Pledge Result' },
      );
    });

    pledgeSocket.on('pledgeDisputeUpdated', (payload: {
      matchId: string;
      title: string;
      senderUsername: string;
      senderRole: 'streamer' | 'assistant';
      message: string;
    }) => {
      const nextNotification: PledgeDisputeNotification = {
        ...payload,
        id: `dispute:${payload.matchId}:${Date.now()}`,
        type: 'pledge_dispute',
        createdAt: new Date().toISOString(),
        read: false,
      };

      setNotifications((prev) => [nextNotification, ...prev].slice(0, 20));
    });

    const streamSocket = io(streamSocketUrl, {
      transports: ['websocket'],
      auth: {
        token,
      },
    });

    streamSocket.on('followedHostLive', (payload: {
      streamId: string;
      hostUserId: string;
      hostUsername: string;
      title: string;
    }) => {
      const nextNotification: FollowedHostLiveNotification = {
        ...payload,
        id: `live:${payload.streamId}:${Date.now()}`,
        type: 'followed_host_live',
        createdAt: new Date().toISOString(),
        read: false,
      };

      setNotifications((prev) => [nextNotification, ...prev].slice(0, 20));
      toast.info(`${payload.hostUsername} just went live.`, { title: 'Following Live' });
    });

    streamSocket.on('streamInviteReceived', (payload: {
      streamId: string;
      hostUserId: string;
      hostUsername: string;
      title: string;
    }) => {
      const nextNotification: StreamInviteNotification = {
        ...payload,
        id: `invite:${payload.streamId}:${Date.now()}`,
        type: 'stream_invite',
        createdAt: new Date().toISOString(),
        read: false,
      };

      setNotifications((prev) => [nextNotification, ...prev].slice(0, 20));
      setActiveNotification(nextNotification);
      toast.info(`${payload.hostUsername} invited you to join a live stream.`, { title: 'Live Invite' });
    });

    pledgeSocketRef.current = pledgeSocket;
    streamSocketRef.current = streamSocket;

    return () => {
      pledgeSocket.disconnect();
      streamSocket.disconnect();
      pledgeSocketRef.current = null;
      streamSocketRef.current = null;
    };
  }, [navigate, toast]);

  const markAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId ? { ...notification, read: true } : notification,
      ),
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));
  };

  const value: PledgeNotificationsContextValue = {
    notifications,
    unreadCount: notifications.filter((notification) => !notification.read).length,
    activeNotification,
    setActiveNotification,
    markAsRead,
    markAllAsRead,
  };

  return (
    <PledgeNotificationsContext.Provider value={value}>
      {children}
      <PledgeJoinNotificationModal />
    </PledgeNotificationsContext.Provider>
  );
}

export function usePledgeNotifications() {
  const context = useContext(PledgeNotificationsContext);
  if (!context) {
    throw new Error('usePledgeNotifications must be used within PledgeNotificationsProvider');
  }

  return context;
}

export function PledgeNotificationsBell() {
  const [open, setOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    setActiveNotification,
    markAsRead,
    markAllAsRead,
  } = usePledgeNotifications();

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen((current) => !current);
          if (!open) {
            markAllAsRead();
          }
        }}
        className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 transition-colors hover:bg-white/10"
      >
        <Bell size={20} className="text-zinc-300" />
        {unreadCount > 0 && (
          <span className="absolute right-2 top-2 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-brand-accent px-1 text-[10px] font-black text-black">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-16 z-[120] w-80 rounded-[2rem] border border-white/10 bg-[#1a1635] p-4 shadow-2xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-widest text-white">Notifications</h3>
            <button
              onClick={() => setOpen(false)}
              className="text-zinc-500 transition-colors hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          {notifications.length ? (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => {
                    markAsRead(notification.id);
                    setActiveNotification({ ...notification, read: true });
                    setOpen(false);
                  }}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition-colors ${
                    notification.read
                      ? 'border-white/5 bg-white/5'
                      : 'border-brand-primary/30 bg-brand-primary/10'
                  }`}
                >
                  <p className="text-sm font-bold text-white">
                    {notification.type === 'pledge_request'
                      ? `${notification.joinedByUsername} wants to join your pledge`
                      : notification.type === 'pledge_result_claim'
                        ? `${notification.claimedByUsername} submitted a result`
                        : notification.type === 'pledge_dispute'
                          ? `${notification.senderUsername} updated a dispute`
                      : notification.type === 'stream_invite'
                        ? `${notification.hostUsername} invited you to a live`
                        : `${notification.hostUsername} went live`}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    {notification.type === 'pledge_request'
                      ? `${notification.gameTitle} • $${notification.amountUsd.toFixed(2)} stake`
                      : notification.type === 'pledge_result_claim'
                        ? `${notification.outcome.toUpperCase()} claim for ${notification.title}`
                        : notification.type === 'pledge_dispute'
                          ? notification.message
                      : notification.title}
                  </p>
                  <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    {formatNotificationTime(
                      notification.type === 'pledge_request'
                        ? notification.joinedAt
                        : notification.type === 'pledge_result_claim' || notification.type === 'pledge_dispute'
                          ? notification.createdAt
                        : notification.createdAt,
                    )}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/5 bg-white/5 px-4 py-8 text-center text-sm text-zinc-500">
              No pledge notifications yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PledgeJoinNotificationModal() {
  const { activeNotification, setActiveNotification, markAsRead } = usePledgeNotifications();
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  if (!activeNotification) {
    return null;
  }

  if (activeNotification.type !== 'pledge_request') {
    if (activeNotification.type === 'pledge_result_claim') {
      const handlePledgeClaimDecision = async (decision: 'approve' | 'reject') => {
        try {
          setSubmitting(true);
          await api.post(`/pledges/matches/${activeNotification.matchId}/result-claim/respond`, {
            decision,
          });
          markAsRead(activeNotification.id);
          setActiveNotification(null);
          toast.success(
            decision === 'approve' ? 'Result approved.' : 'Result rejected and moved to dispute.',
          );
        } catch (err: any) {
          toast.error(err?.response?.data?.message ?? 'Unable to update result claim.');
        } finally {
          setSubmitting(false);
        }
      };

      return (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-[#0f0b21]/85 p-6 backdrop-blur-md">
          <div className="w-full max-w-md rounded-[2.5rem] border border-white/10 bg-[#1a1635] p-8 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-accent">
                  Result Claim
                </p>
                <h3 className="mt-2 text-xl font-black uppercase italic text-white">
                  {activeNotification.claimedByUsername} claimed {activeNotification.outcome}
                </h3>
              </div>
              <button
                onClick={() => {
                  markAsRead(activeNotification.id);
                  setActiveNotification(null);
                }}
                className="text-zinc-500 transition-colors hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3 rounded-[2rem] border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-zinc-300">{activeNotification.title}</p>
              {activeNotification.note ? (
                <p className="text-xs text-zinc-400">{activeNotification.note}</p>
              ) : null}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <button
                onClick={() => void handlePledgeClaimDecision('reject')}
                disabled={submitting}
                className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-xs font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-white/10 disabled:opacity-50"
              >
                Reject
              </button>
              <button
                onClick={() => void handlePledgeClaimDecision('approve')}
                disabled={submitting}
                className="rounded-2xl bg-brand-primary px-6 py-4 text-xs font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-brand-accent hover:text-black disabled:opacity-50"
              >
                {submitting ? 'Updating...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (activeNotification.type === 'pledge_dispute') {
      return (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-[#0f0b21]/85 p-6 backdrop-blur-md">
          <div className="w-full max-w-md rounded-[2.5rem] border border-white/10 bg-[#1a1635] p-8 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-accent">
                  Dispute Update
                </p>
                <h3 className="mt-2 text-xl font-black uppercase italic text-white">
                  {activeNotification.title}
                </h3>
              </div>
              <button
                onClick={() => {
                  markAsRead(activeNotification.id);
                  setActiveNotification(null);
                }}
                className="text-zinc-500 transition-colors hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-2 rounded-[2rem] border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-black uppercase tracking-widest text-brand-primary">
                {activeNotification.senderUsername}
              </p>
              <p className="text-sm text-zinc-300">{activeNotification.message}</p>
            </div>
            <button
              onClick={() => {
                markAsRead(activeNotification.id);
                setActiveNotification(null);
                navigate(`/disputes/${activeNotification.matchId}`);
              }}
              className="mt-6 w-full rounded-2xl bg-brand-primary px-6 py-4 text-xs font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-brand-accent hover:text-black"
            >
              Open Dispute
            </button>
          </div>
        </div>
      );
    }

    const handleStreamNotification = async (action: 'watch' | 'accept' | 'decline') => {
      try {
        setSubmitting(true);

        if (activeNotification.type === 'stream_invite') {
          if (action === 'accept') {
            await api.post(`/streams/${activeNotification.streamId}/accept-invite`);
          }

          if (action === 'decline') {
            await api.post(`/streams/${activeNotification.streamId}/leave`);
          }
        }

        markAsRead(activeNotification.id);
        setActiveNotification(null);

        if (action === 'accept' || action === 'watch') {
          navigate(`/stream?streamId=${activeNotification.streamId}`);
        }
      } catch (err: any) {
        toast.error(
          err?.response?.data?.message ??
            (action === 'decline' ? 'Unable to decline live invite.' : 'Unable to open live.'),
        );
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="fixed inset-0 z-[140] flex items-center justify-center bg-[#0f0b21]/85 p-6 backdrop-blur-md">
        <div className="w-full max-w-md rounded-[2.5rem] border border-white/10 bg-[#1a1635] p-8 shadow-2xl">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-primary/20 text-brand-primary">
                <Radio size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-accent">
                  {activeNotification.type === 'stream_invite' ? 'Live Invitation' : 'Following Live'}
                </p>
                <h3 className="mt-2 text-xl font-black uppercase italic text-white">
                  {activeNotification.type === 'stream_invite'
                    ? `${activeNotification.hostUsername} Invited You`
                    : `${activeNotification.hostUsername} Is Live`}
                </h3>
              </div>
            </div>
            <button
              onClick={() => {
                markAsRead(activeNotification.id);
                setActiveNotification(null);
              }}
              className="text-zinc-500 transition-colors hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
          <div className="space-y-3 rounded-[2rem] border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-zinc-300">
              {activeNotification.type === 'stream_invite'
                ? `${activeNotification.hostUsername} wants you to join "${activeNotification.title}".`
                : activeNotification.title}
            </p>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
              {formatNotificationTime(activeNotification.createdAt)}
            </p>
          </div>
          {activeNotification.type === 'stream_invite' ? (
            <div className="mt-6 grid grid-cols-2 gap-4">
              <button
                onClick={() => void handleStreamNotification('decline')}
                disabled={submitting}
                className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-xs font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-white/10 disabled:opacity-50"
              >
                {submitting ? 'Updating...' : 'Decline'}
              </button>
              <button
                onClick={() => void handleStreamNotification('accept')}
                disabled={submitting}
                className="rounded-2xl bg-brand-primary px-6 py-4 text-xs font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-brand-accent hover:text-black disabled:opacity-50"
              >
                {submitting ? 'Updating...' : 'Accept Invite'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => void handleStreamNotification('watch')}
              disabled={submitting}
              className="mt-6 w-full rounded-2xl bg-brand-primary px-6 py-4 text-xs font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-brand-accent hover:text-black disabled:opacity-50"
            >
              {submitting ? 'Opening...' : 'Watch Live'}
            </button>
          )}
        </div>
      </div>
    );
  }

  const handleDecision = async (action: 'accept' | 'reject') => {
    try {
      setSubmitting(true);
      await api.post(
        `/pledges/matches/${activeNotification.matchId}/requests/${activeNotification.joinedByUserId}/${action}`,
      );
      markAsRead(activeNotification.id);
      setActiveNotification(null);
      toast.success(
        action === 'accept' ? 'Pledge request accepted.' : 'Pledge request rejected.',
        { title: 'Pledge Updated' },
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to update pledge request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-[#0f0b21]/85 p-6 backdrop-blur-md">
      <div className="w-full max-w-md rounded-[2.5rem] border border-white/10 bg-[#1a1635] p-8 shadow-2xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-primary/20 text-brand-primary">
              <UserPlus size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-accent">
                Pledge Update
              </p>
              <h3 className="mt-2 text-xl font-black uppercase italic text-white">
                New Player Joined
              </h3>
            </div>
          </div>
          <button
            onClick={() => {
              markAsRead(activeNotification.id);
              setActiveNotification(null);
            }}
            className="text-zinc-500 transition-colors hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3 rounded-[2rem] border border-white/10 bg-white/5 p-5">
          <p className="text-sm text-zinc-300">
            <span className="font-black text-white">{activeNotification.joinedByUsername}</span>{' '}
            wants to join your pledge for{' '}
            <span className="font-black text-white">{activeNotification.gameTitle}</span>.
          </p>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-accent">
            Stake ${activeNotification.amountUsd.toFixed(2)}
          </p>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
            {activeNotification.title}
          </p>
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
            {formatNotificationTime(activeNotification.joinedAt)}
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <button
            onClick={() => void handleDecision('reject')}
            disabled={submitting}
            className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-xs font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-white/10 disabled:opacity-50"
          >
            Reject
          </button>
          <button
            onClick={() => void handleDecision('accept')}
            disabled={submitting}
            className="rounded-2xl bg-brand-primary px-6 py-4 text-xs font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-brand-accent hover:text-black disabled:opacity-50"
          >
            {submitting ? 'Updating...' : 'Accept & Go Live'}
          </button>
        </div>
      </div>
    </div>
  );
}
