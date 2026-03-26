import { supabase } from './supabase';
import type { ConversationRow, Message, AppNotification } from './types';

// ── Normalize participant order (smaller UUID = participant_1) ─────────────────

function normalizeParticipants(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

// ── Conversations ─────────────────────────────────────────────────────────────

export async function getOrCreateConversation(
  currentUserId: string,
  otherUserId: string,
): Promise<string> {
  const [p1, p2] = normalizeParticipants(currentUserId, otherUserId);

  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('participant_1', p1)
    .eq('participant_2', p2)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from('conversations')
    .insert({ participant_1: p1, participant_2: p2 })
    .select('id')
    .single();

  if (error || !created) throw new Error('Failed to create conversation');
  return created.id;
}

export async function getConversations(userId: string): Promise<ConversationRow[]> {
  const { data: convos, error } = await supabase
    .from('conversations')
    .select('*')
    .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
    .order('last_message_at', { ascending: false });

  if (error || !convos?.length) return [];

  const otherIds = convos.map(c =>
    c.participant_1 === userId ? c.participant_2 : c.participant_1,
  );

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, first_name, last_name, avatar_url')
    .in('id', otherIds);

  const profileMap = new Map(profiles?.map(p => [p.id, p]) ?? []);

  const rows = await Promise.all(
    convos.map(async (conv) => {
      const otherId = conv.participant_1 === userId ? conv.participant_2 : conv.participant_1;

      const [{ data: lastMsg }, { count: unread }] = await Promise.all([
        supabase
          .from('messages')
          .select('content, sender_id')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .neq('sender_id', userId)
          .is('read_at', null),
      ]);

      return {
        id: conv.id,
        participant_1: conv.participant_1,
        participant_2: conv.participant_2,
        last_message_at: conv.last_message_at,
        created_at: conv.created_at,
        other_participant: (profileMap.get(otherId) as ConversationRow['other_participant']) ?? null,
        last_message: lastMsg?.content ?? null,
        last_message_sender_id: lastMsg?.sender_id ?? null,
        unread_count: unread ?? 0,
      } satisfies ConversationRow;
    }),
  );

  return rows;
}

// ── Messages ──────────────────────────────────────────────────────────────────

export async function getMessages(
  conversationId: string,
  currentUserId: string,
): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) return [];

  // Mark unread messages from the other user as read
  const unreadIds = (data ?? [])
    .filter(m => m.sender_id !== currentUserId && !m.read_at)
    .map(m => m.id);

  if (unreadIds.length > 0) {
    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .in('id', unreadIds);
  }

  return (data ?? []) as Message[];
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string,
  senderName: string,
): Promise<Message> {
  // Insert message
  const { data: msg, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: senderId, content })
    .select()
    .single();

  if (error || !msg) throw new Error('Failed to send message');

  // Update conversation last_message_at
  await supabase
    .from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversationId);

  // Find recipient
  const { data: conv } = await supabase
    .from('conversations')
    .select('participant_1, participant_2')
    .eq('id', conversationId)
    .single();

  if (conv) {
    const recipientId = conv.participant_1 === senderId ? conv.participant_2 : conv.participant_1;

    await supabase.from('notifications').insert({
      user_id: recipientId,
      type: 'new_message',
      title: `${senderName} sent you a message`,
      body: content.slice(0, 80),
      link: `/messages?conversation=${conversationId}`,
      actor_id: senderId,
    });
  }

  return msg as Message;
}

// ── Notifications ─────────────────────────────────────────────────────────────

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('read_at', null);
  return count ?? 0;
}

export async function getNotifications(
  userId: string,
  limit = 20,
): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*, actor:profiles!notifications_actor_id_fkey(id, full_name, first_name, last_name, avatar_url)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data ?? []) as AppNotification[];
}

export async function markNotificationsRead(userId: string): Promise<void> {
  await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null);
}

// ── Profile search (for new chat modal) ───────────────────────────────────────

export async function searchProfiles(query: string, excludeId: string) {
  if (query.length < 2) return [];
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, first_name, last_name, avatar_url')
    .neq('id', excludeId)
    .or(
      `full_name.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`,
    )
    .limit(10);
  return data ?? [];
}
