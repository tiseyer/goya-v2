'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ConnStatus = 'pending_sent' | 'pending_received' | 'accepted';

export interface ConnRecord {
  connectionId: string;
  status: ConnStatus;
  memberSlug: string;
  memberName: string;
  memberPhoto: string;
  role: 'requester' | 'receiver';
}

export interface NotifRecord {
  id: string;
  type: 'connection_request' | 'connection_accepted' | 'connection_declined';
  fromSlug: string;
  fromName: string;
  fromPhoto: string;
  connectionId: string;
  read: boolean;
  createdAt: string;
}

interface ConnectionsContextType {
  connections: Record<string, ConnRecord>; // keyed by member slug
  notifications: NotifRecord[];
  unreadCount: number;
  getStatus: (slug: string) => ConnStatus | null;
  sendRequest: (slug: string, name: string, photo: string) => void;
  acceptRequest: (connectionId: string, fromSlug: string) => void;
  declineRequest: (connectionId: string, fromSlug: string) => void;
  markAllRead: () => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ConnectionsContext = createContext<ConnectionsContextType | null>(null);

// ─── Demo seed: incoming request from Jennifer Walsh ─────────────────────────

const DEMO_CONN_ID = 'demo-conn-jennifer';
const DEMO_NOTIF_ID = 'demo-notif-jennifer';

function buildDemoSeed(): { conn: ConnRecord; notif: NotifRecord } {
  return {
    conn: {
      connectionId: DEMO_CONN_ID,
      status: 'pending_received',
      memberSlug: 'jennifer-walsh',
      memberName: 'Jennifer Walsh',
      memberPhoto: 'https://randomuser.me/api/portraits/women/2.jpg',
      role: 'receiver',
    },
    notif: {
      id: DEMO_NOTIF_ID,
      type: 'connection_request',
      fromSlug: 'jennifer-walsh',
      fromName: 'Jennifer Walsh',
      fromPhoto: 'https://randomuser.me/api/portraits/women/2.jpg',
      connectionId: DEMO_CONN_ID,
      read: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
  };
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

const LS_CONNECTIONS = 'goya-connections';
const LS_NOTIFICATIONS = 'goya-notifications';
const LS_SEEDED = 'goya-demo-seeded';

function loadFromLS<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveToLS(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* noop */ }
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function ConnectionsProvider({ children }: { children: ReactNode }) {
  const [connections, setConnections] = useState<Record<string, ConnRecord>>({});
  const [notifications, setNotifications] = useState<NotifRecord[]>([]);
  const [supabaseUserId, setSupabaseUserId] = useState<string | null>(null);

  // Load persisted state + seed demo data
  useEffect(() => {
    const savedConns = loadFromLS<Record<string, ConnRecord>>(LS_CONNECTIONS) ?? {};
    const savedNotifs = loadFromLS<NotifRecord[]>(LS_NOTIFICATIONS) ?? [];
    const alreadySeeded = localStorage.getItem(LS_SEEDED);

    if (!alreadySeeded) {
      // First visit: seed an incoming connection request from Jennifer Walsh
      const seed = buildDemoSeed();
      const conns = { ...savedConns, [seed.conn.memberSlug]: seed.conn };
      const notifs = [seed.notif, ...savedNotifs];
      setConnections(conns);
      setNotifications(notifs);
      saveToLS(LS_CONNECTIONS, conns);
      saveToLS(LS_NOTIFICATIONS, notifs);
      localStorage.setItem(LS_SEEDED, '1');
    } else {
      setConnections(savedConns);
      setNotifications(savedNotifs);
    }

    // Check auth
    supabase.auth.getUser().then(({ data }) => {
      setSupabaseUserId(data.user?.id ?? null);
    });
  }, []);

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
            fromSlug: row.from_user_id as string,
            fromName: 'Member', // would join with profiles table in production
            fromPhoto: 'https://randomuser.me/api/portraits/lego/1.jpg',
            connectionId: row.connection_id as string,
            read: false,
            createdAt: row.created_at as string,
          };
          setNotifications(prev => {
            const next = [notif, ...prev];
            saveToLS(LS_NOTIFICATIONS, next);
            return next;
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabaseUserId]);

  // Persist connections whenever they change
  const persistConnections = useCallback((conns: Record<string, ConnRecord>) => {
    setConnections(conns);
    saveToLS(LS_CONNECTIONS, conns);
  }, []);

  const persistNotifications = useCallback((notifs: NotifRecord[]) => {
    setNotifications(notifs);
    saveToLS(LS_NOTIFICATIONS, notifs);
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────────

  const getStatus = useCallback((slug: string): ConnStatus | null => {
    return connections[slug]?.status ?? null;
  }, [connections]);

  const sendRequest = useCallback((slug: string, name: string, photo: string) => {
    const connectionId = `conn-${Date.now()}-${slug}`;
    const conn: ConnRecord = {
      connectionId,
      status: 'pending_sent',
      memberSlug: slug,
      memberName: name,
      memberPhoto: photo,
      role: 'requester',
    };
    persistConnections({ ...connections, [slug]: conn });

    // In production: insert into Supabase connections table + notification for receiver
  }, [connections, persistConnections]);

  const acceptRequest = useCallback((connectionId: string, fromSlug: string) => {
    const existing = connections[fromSlug];
    if (!existing) return;

    // Update connection to accepted
    const updatedConn: ConnRecord = { ...existing, status: 'accepted' };
    const newConns = { ...connections, [fromSlug]: updatedConn };
    persistConnections(newConns);

    // Mark the incoming notification as read + update its type implicitly (it's accepted now)
    const updatedNotifs = notifications.map(n =>
      n.connectionId === connectionId ? { ...n, read: true } : n
    );
    // Add an "accepted" confirmation visible in history
    const acceptedNotif: NotifRecord = {
      id: `accepted-${Date.now()}`,
      type: 'connection_accepted',
      fromSlug,
      fromName: existing.memberName,
      fromPhoto: existing.memberPhoto,
      connectionId,
      read: true,
      createdAt: new Date().toISOString(),
    };
    persistNotifications([acceptedNotif, ...updatedNotifs.filter(n => n.connectionId !== connectionId)]);

    // In production: supabase update connections, insert notification for requester
  }, [connections, notifications, persistConnections, persistNotifications]);

  const declineRequest = useCallback((connectionId: string, fromSlug: string) => {
    // Remove the connection record
    const { [fromSlug]: _removed, ...rest } = connections;
    persistConnections(rest);

    // Mark notification as read, remove it from list
    const updatedNotifs = notifications.filter(n => n.connectionId !== connectionId);
    persistNotifications(updatedNotifs);

    // In production: supabase update connection status to 'declined', insert notif for requester
  }, [connections, notifications, persistConnections, persistNotifications]);

  const markAllRead = useCallback(() => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    persistNotifications(updated);
  }, [notifications, persistNotifications]);

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
