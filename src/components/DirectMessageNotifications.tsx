import React, { useEffect, useRef } from 'react';
import { useSocial } from '../hooks/useSocial';
import { useToast } from './ToastProvider';
import { useAuth } from '../hooks/useAuth';

export function DirectMessageNotifications() {
  const { user } = useAuth();
  const toast = useToast();
  const { messages, connect } = useSocial(false);
  const seenMessageIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user?._id) {
      return;
    }

    connect();
  }, [connect, user?._id]);

  useEffect(() => {
    const latestMessage = messages[messages.length - 1];
    if (!latestMessage?._id || seenMessageIdsRef.current.has(latestMessage._id)) {
      return;
    }

    seenMessageIdsRef.current.add(latestMessage._id);

    const isLiveShare = latestMessage.message.includes('/stream?streamId=');
    toast.info(latestMessage.message, {
      title: isLiveShare
        ? `${latestMessage.fromUsername || 'A friend'} shared a live`
        : `New message from ${latestMessage.fromUsername || 'a friend'}`,
      duration: isLiveShare ? 7000 : 5000,
    });
  }, [messages, toast]);

  return null;
}
