'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { logAuditEventAction } from '@/app/actions/audit';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ConnStatus = 'pending_sent' | 'pending_received' | 'accepted';

export interface ConnRecord {
  connectionId: string;
  status: ConnStatus;
  memberId: string;  // UUID from profiles.id
  memberName: string;
  memberPhoto: string;
  role: 'requester' | 'receiver';
  type: 'peer' | 'mentorship' | 'faculty';
}

export interface NotifRecord {
  id: string;
  type: 'connection_request' | 'connection_accepted' | 'connection_declined';
  fromUserId: string;  // UUID
  fromName: string;
  fromPhoto: string;
  connectionId: string;
  read: boolean;
  createdAt: string;
}

export interface ConnectionsContextType {
  connections: Record<string, ConnRecord>; // keyed by UUID
  notifications: NotifRecord[];
  unreadCount: number;
  getStatus: (userId: string) => ConnStatus | null;
  sendRequest: (userId: string, name: string, photo: string, type?: 'peer' | 'mentorship' | 'faculty') => Promise<void>;
  acceptRequest: (connectionId: string, fromUserId: string) => Promise<void>;
  declineRequest: (connectionId: string, fromUserId: string) => Promise<void>;
  removeConnection: (connectionId: string, otherUserId: string) => Promise<void>;
  markAllRead: () => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ConnectionsContext = createContext<ConnectionsContextType | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function ConnectionsProvider({ children }: { children: ReactNode }) {
  const [connections, setConnections] = useState<Record<string, ConnRecord>>({});
  const [notifications, setNotifications] = useState<NotifRecord[]>([]);
  const [supabaseUserId, setSupabaseUserId] = useState<string | null>(null);

  // Get auth user ID on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setSupabaseUserId(data.user?.id ?? null);
    });
  }, []);

  // Load connections from Supabase on mount (once auth user is known)
  useEffect(() => {
    if (!supabaseUserId) return;
    supabase
      .from('connections')
      .select(`
        *,
        requester:profiles!connections_requester_id_fkey(id, full_name, avatar_url),
        recipient:profiles!connections_recipient_id_fkey(id, full_name, avatar_url)
      `)
      .or(`requester_id.eq.${supabaseUserId},recipient_id.eq.${supabaseUserId}`)
      .then(({ data }) => {
        if (data) {
          const map: Record<string, ConnRecord> = {};
          for (const row of data) {
            const otherId = row.requester_id === supabaseUserId ? row.recipient_id : row.requester_id;
            const role: 'requester' | 'receiver' = row.requester_id === supabaseUserId ? 'requester' : 'receiver';
            const displayStatus: ConnStatus =
              row.status === 'pending' && role === 'requester' ? 'pending_sent' :
              row.status === 'pending' && role === 'receiver' ? 'pending_received' :
              row.status as ConnStatus;
            const otherProfile = row.requester_id === supabaseUserId ? row.recipient : row.requester;
            map[otherId] = {
              connectionId: row.id,
              status: displayStatus,
              memberId: otherId,
              memberName: otherProfile?.full_name ?? '',
              memberPhoto: otherProfile?.avatar_url ?? '',
              role,
              type: row.type ?? 'peer',
            };
          }
          setConnections(map);
        }
      });
  }, [supabaseUserId]);

  // Supabase Realtime: subscribe to real notifications for logged-in user
  useEffect(() => {
    if (!supabaseUserId) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const channel = (supabase.channel(`notifications:${supabaseUserId}`) as any)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${supabaseUserId}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          const row = payload.new;
          const notif: NotifRecord = {
            id: row.id as string,
            type: row.type as NotifRecord['type'],
            fromUserId: row.from_user_id as string,
            fromName: 'Member', // would join with profiles table in production
            fromPhoto: 'https://randomuser.me/api/portraits/lego/1.jpg',
            connectionId: row.connection_id as string,
            read: false,
            createdAt: row.created_at as string,
          };
          setNotifications(prev => [notif, ...prev]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabaseUserId]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const getStatus = useCallback((userId: string): ConnStatus | null => {
    return connections[userId]?.status ?? null;
  }, [connections]);

  const sendRequest = useCallback(async (recipientId: string, name: string, photo: string, type: 'peer' | 'mentorship' | 'faculty' = 'peer') => {
    if (!supabaseUserId) return;

    // Guard: check for existing connection in either direction (bidirectional duplicate check)
    const { data: existing } = await supabase
      .from('connections')
      .select('id')
      .or(
        `and(requester_id.eq.${supabaseUserId},recipient_id.eq.${recipientId}),and(requester_id.eq.${recipientId},recipient_id.eq.${supabaseUserId})`
      )
      .maybeSingle();

    if (existing) return; // already exists in either direction

    const { data, error } = await supabase
      .from('connections')
      .insert({ requester_id: supabaseUserId, recipient_id: recipientId, type, status: 'pending' })
      .select()
      .single();

    if (!error && data) {
      setConnections(prev => ({
        ...prev,
        [recipientId]: {
          connectionId: data.id,
          status: 'pending_sent',
          memberId: recipientId,
          memberName: name,
          memberPhoto: photo,
          role: 'requester',
          type,
        },
      }));

      void logAuditEventAction({
        category: 'user',
        action: 'user.connection_requested',
        actor_id: supabaseUserId,
        target_type: 'USER',
        target_id: recipientId,
        target_label: name,
        description: `Connection request sent to ${name} (type: ${type})`,
        metadata: { connection_type: type },
      });
    }
  }, [supabaseUserId]);

  const acceptRequest = useCallback(async (connectionId: string, fromUserId: string) => {
    const { error } = await supabase
      .from('connections')
      .update({ status: 'accepted' })
      .eq('id', connectionId);

    if (!error) {
      setConnections(prev => {
        const existing = prev[fromUserId];
        if (!existing) return prev;
        return { ...prev, [fromUserId]: { ...existing, status: 'accepted' } };
      });
      // Mark related notification as read
      setNotifications(prev =>
        prev.map(n => n.connectionId === connectionId ? { ...n, read: true } : n)
      );

      void logAuditEventAction({
        category: 'user',
        action: 'user.connection_accepted',
        target_type: 'USER',
        target_id: fromUserId,
        description: `Accepted connection request from ${fromUserId}`,
      });
    }
  }, []);

  const declineRequest = useCallback(async (connectionId: string, fromUserId: string) => {
    const { error } = await supabase
      .from('connections')
      .update({ status: 'declined' })
      .eq('id', connectionId);

    if (!error) {
      setConnections(prev => {
        const { [fromUserId]: _removed, ...rest } = prev;
        return rest;
      });
      setNotifications(prev => prev.filter(n => n.connectionId !== connectionId));
    }
  }, []);

  const removeConnection = useCallback(async (connectionId: string, otherUserId: string) => {
    const { error } = await supabase
      .from('connections')
      .delete()
      .eq('id', connectionId);

    if (!error) {
      setConnections(prev => {
        const { [otherUserId]: _removed, ...rest } = prev;
        return rest;
      });
    }
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const unreadCount = notifications.filter(n => !n.read && n.type === 'connection_request').length;

  return (
    <ConnectionsContext.Provider value={{
      connections,
      notifications,
      unreadCount,
      getStatus,
      sendRequest,
      acceptRequest,
      declineRequest,
      removeConnection,
      markAllRead,
    }}>
      {children}
    </ConnectionsContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useConnections() {
  const ctx = useContext(ConnectionsContext);
  if (!ctx) throw new Error('useConnections must be used within ConnectionsProvider');
  return ctx;
}
