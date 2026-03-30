'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useImpersonation } from '@/app/context/ImpersonationContext';
import {
  getConversations,
  getMessages,
  sendMessage,
  getOrCreateConversation,
  searchProfiles,
} from '@/lib/messaging';
import type { ConversationRow, Message } from '@/lib/types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  return name.trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase();
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatRelative(iso: string): string {
  const now = new Date();
  const d = new Date(iso);
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return formatTime(iso);
  if (days === 1) return 'Yesterday';
  if (days < 7) return d.toLocaleDateString('en-US', { weekday: 'short' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDateSeparator(iso: string): string {
  const now = new Date();
  const d = new Date(iso);
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function isoDate(iso: string): string {
  return new Date(iso).toDateString();
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ src, name, size = 'md' }: { src?: string | null; name?: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const cls = size === 'sm' ? 'w-8 h-8 text-[10px]' : size === 'lg' ? 'w-12 h-12 text-sm' : 'w-10 h-10 text-xs';
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name ?? ''} className={`${cls} rounded-full object-cover shrink-0 ring-1 ring-slate-200`} />;
  }
  return (
    <div className={`${cls} rounded-full bg-[#4E87A0] flex items-center justify-center shrink-0`}>
      <span className="text-white font-bold">{getInitials(name)}</span>
    </div>
  );
}

// ── Conversation list item ────────────────────────────────────────────────────

function ConvItem({
  conv,
  active,
  currentUserId,
  onClick,
}: {
  conv: ConversationRow;
  active: boolean;
  currentUserId: string;
  onClick: () => void;
}) {
  const name = [conv.other_participant?.first_name, conv.other_participant?.last_name]
    .filter(Boolean).join(' ') || conv.other_participant?.full_name || 'Unknown';
  const isOwn = conv.last_message_sender_id === currentUserId;
  const preview = conv.last_message
    ? `${isOwn ? 'You: ' : ''}${conv.last_message}`
    : 'No messages yet';

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${
        active ? 'bg-[#4E87A0]/10 border-l-2 border-[#4E87A0]' : 'hover:bg-slate-50 border-l-2 border-transparent'
      }`}
    >
      <Avatar src={conv.other_participant?.avatar_url} name={name} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-[13px] text-slate-900 truncate">{name}</span>
          <span className="text-[10px] text-slate-400 shrink-0">{formatRelative(conv.last_message_at)}</span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <span className="text-xs text-slate-500 truncate">{preview}</span>
          {conv.unread_count > 0 && (
            <span className="shrink-0 w-5 h-5 rounded-full bg-[#4E87A0] text-white text-[10px] font-bold flex items-center justify-center">
              {conv.unread_count > 9 ? '9+' : conv.unread_count}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────

function MsgBubble({ msg, isOwn }: { msg: Message; isOwn: boolean }) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed relative group ${
          isOwn
            ? 'bg-[#1B3A5C] text-white rounded-br-sm'
            : 'bg-white text-slate-800 border border-slate-100 shadow-sm rounded-bl-sm'
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
        <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <span className={`text-[10px] ${isOwn ? 'text-white/60' : 'text-slate-400'}`}>
            {formatTime(msg.created_at)}
          </span>
          {isOwn && msg.read_at && (
            <svg className="w-3 h-3 text-[#4E87A0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}

// ── New Chat Modal ────────────────────────────────────────────────────────────

function NewChatModal({
  currentUserId,
  onClose,
  onConversationOpened,
}: {
  currentUserId: string;
  onClose: () => void;
  onConversationOpened: (convId: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ id: string; full_name: string | null; first_name: string | null; last_name: string | null; avatar_url: string | null }>>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    let cancelled = false;
    setLoading(true);
    searchProfiles(query, currentUserId).then(data => {
      if (!cancelled) { setResults(data); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [query, currentUserId]);

  async function startChat(otherId: string) {
    const convId = await getOrCreateConversation(currentUserId, otherId);
    onConversationOpened(convId);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-[#1B3A5C]">New Message</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4">
          <div className="relative mb-3">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search members by name…"
              className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4E87A0]/40"
            />
          </div>
          <div className="max-h-64 overflow-y-auto space-y-0.5">
            {loading && (
              <div className="py-6 text-center text-sm text-slate-400">Searching…</div>
            )}
            {!loading && query.length >= 2 && results.length === 0 && (
              <div className="py-6 text-center text-sm text-slate-400">No members found</div>
            )}
            {!loading && query.length < 2 && (
              <div className="py-6 text-center text-sm text-slate-400">Type at least 2 characters</div>
            )}
            {results.map(p => {
              const name = [p.first_name, p.last_name].filter(Boolean).join(' ') || p.full_name || 'Unknown';
              return (
                <button
                  key={p.id}
                  onClick={() => startChat(p.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left"
                >
                  <Avatar src={p.avatar_url} name={name} size="sm" />
                  <span className="text-sm font-medium text-slate-800">{name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page (wrapped for Suspense) ─────────────────────────────────────────

function MessagesPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialConvId = searchParams.get('conversation');
  const { isImpersonating, targetUserId, targetProfile } = useImpersonation();

  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [authLoading, setAuthLoading] = useState(true);

  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [convLoading, setConvLoading] = useState(true);

  const [activeConvId, setActiveConvId] = useState<string | null>(initialConvId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [optimisticMsgs, setOptimisticMsgs] = useState<Message[]>([]);

  const [newChatOpen, setNewChatOpen] = useState(false);
  const [mobileSide, setMobileSide] = useState<'list' | 'chat'>('list');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Auth ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (isImpersonating && targetUserId) {
      setUserId(targetUserId);
      setUserName(targetProfile?.full_name ?? '');
      setAuthLoading(false);
      return;
    }
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/sign-in'); return; }
      setUserId(data.user.id);
      supabase.from('profiles').select('full_name').eq('id', data.user.id).single()
        .then(({ data: p }) => setUserName(p?.full_name ?? ''));
      setAuthLoading(false);
    });
  }, [router, isImpersonating, targetUserId, targetProfile]);

  // ── Load conversations ────────────────────────────────────────────────────

  const loadConversations = useCallback(async () => {
    if (!userId) return;
    const data = await getConversations(userId);
    setConversations(data);
    setConvLoading(false);
  }, [userId]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // ── Realtime: conversations list ──────────────────────────────────────────

  useEffect(() => {
    if (!userId) return;
    const ch = supabase
      .channel('conversations-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        loadConversations();
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userId, loadConversations]);

  // ── Load messages for active conversation ─────────────────────────────────

  useEffect(() => {
    if (!activeConvId || !userId) return;
    setMsgLoading(true);
    setOptimisticMsgs([]);
    getMessages(activeConvId, userId).then(data => {
      setMessages(data);
      setMsgLoading(false);
    });
  }, [activeConvId, userId]);

  // ── Realtime: messages in active conversation ─────────────────────────────

  useEffect(() => {
    if (!activeConvId || !userId) return;
    const ch = supabase
      .channel(`messages-${activeConvId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeConvId}` },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          // Remove matching optimistic message
          setOptimisticMsgs(prev => prev.filter(m => m.content !== newMsg.content || m.sender_id !== newMsg.sender_id));
          // Mark as read if from other user
          if (newMsg.sender_id !== userId) {
            supabase.from('messages').update({ read_at: new Date().toISOString() }).eq('id', newMsg.id);
          }
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [activeConvId, userId]);

  // ── Scroll to bottom ──────────────────────────────────────────────────────

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, optimisticMsgs]);

  // ── Send message ──────────────────────────────────────────────────────────

  async function handleSend() {
    if (!input.trim() || !activeConvId || !userId || sending) return;
    const content = input.trim();
    setInput('');

    // Optimistic
    const optimistic: Message = {
      id: `opt-${Date.now()}`,
      conversation_id: activeConvId,
      sender_id: userId,
      content,
      read_at: null,
      created_at: new Date().toISOString(),
    };
    setOptimisticMsgs(prev => [...prev, optimistic]);

    setSending(true);
    try {
      await sendMessage(activeConvId, userId, content, userName);
      // Track message_sent engagement event
      try {
        const { trackMessageSent } = await import('@/lib/analytics/tracking');
        trackMessageSent();
      } catch { /* analytics non-critical */ }
    } catch {
      setOptimisticMsgs(prev => prev.filter(m => m.id !== optimistic.id));
      setInput(content);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // ── Open conversation (from new chat modal or query param) ────────────────

  function openConversation(convId: string) {
    setActiveConvId(convId);
    setMobileSide('chat');
    router.replace(`/messages?conversation=${convId}`, { scroll: false });
    loadConversations();
  }

  // ── Active conversation data ───────────────────────────────────────────────

  const activeConv = conversations.find(c => c.id === activeConvId);
  const otherName = activeConv
    ? ([activeConv.other_participant?.first_name, activeConv.other_participant?.last_name].filter(Boolean).join(' ') || activeConv.other_participant?.full_name || 'Unknown')
    : '';

  // ── All messages (confirmed + optimistic) ────────────────────────────────

  const allMessages = [
    ...messages,
    ...optimisticMsgs.filter(o => !messages.some(m => m.id === o.id)),
  ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  // ── Render ────────────────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="w-8 h-8 border-2 border-[#4E87A0] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-slate-50 overflow-hidden">

      {/* ── Left sidebar ─────────────────────────────────────────────────── */}
      <div className={`
        flex flex-col bg-white border-r border-slate-200 shrink-0
        w-full md:w-80 lg:w-96
        ${mobileSide === 'chat' ? 'hidden md:flex' : 'flex'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 shrink-0">
          <h1 className="text-base font-bold text-[#1B3A5C]">Messages</h1>
          <button
            onClick={() => setNewChatOpen(true)}
            className="w-8 h-8 rounded-lg bg-[#1B3A5C] text-white flex items-center justify-center hover:bg-[#16304f] transition-colors"
            title="New message"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {convLoading ? (
            <div className="space-y-0 p-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 px-3 py-3 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-200 rounded w-2/3" />
                    <div className="h-2.5 bg-slate-100 rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 px-6 text-center">
              <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-slate-700 mb-1">No conversations yet</p>
              <p className="text-xs text-slate-400 mb-4">Start a new chat to connect with members.</p>
              <button
                onClick={() => setNewChatOpen(true)}
                className="px-4 py-2 bg-[#1B3A5C] text-white text-sm font-semibold rounded-lg hover:bg-[#16304f] transition-colors"
              >
                New Message
              </button>
            </div>
          ) : (
            userId && conversations.map(conv => (
              <ConvItem
                key={conv.id}
                conv={conv}
                active={conv.id === activeConvId}
                currentUserId={userId}
                onClick={() => openConversation(conv.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Right chat panel ─────────────────────────────────────────────── */}
      <div className={`
        flex flex-col flex-1 min-w-0
        ${mobileSide === 'list' ? 'hidden md:flex' : 'flex'}
      `}>
        {!activeConvId ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-slate-700 font-semibold mb-1">Select a conversation</p>
            <p className="text-slate-400 text-sm">Choose from your messages on the left, or start a new chat.</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200 shrink-0">
              {/* Mobile back button */}
              <button
                onClick={() => setMobileSide('list')}
                className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <Avatar
                src={activeConv?.other_participant?.avatar_url}
                name={otherName}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#1B3A5C] text-sm truncate">{otherName}</p>
              </div>
              {activeConv?.other_participant?.id && (
                <Link
                  href={`/members/${activeConv.other_participant.id}`}
                  className="text-xs text-[#4E87A0] font-semibold hover:underline shrink-0"
                >
                  View Profile
                </Link>
              )}
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-3 bg-slate-50">
              {msgLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'} animate-pulse`}>
                      <div className={`h-10 rounded-2xl bg-slate-200 ${i % 2 === 0 ? 'w-48' : 'w-56'}`} />
                    </div>
                  ))}
                </div>
              ) : allMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <p className="text-slate-400 text-sm">No messages yet. Say hello!</p>
                </div>
              ) : (
                <>
                  {allMessages.map((msg, idx) => {
                    const prev = allMessages[idx - 1];
                    const showSep = !prev || isoDate(prev.created_at) !== isoDate(msg.created_at);
                    const isOwn = msg.sender_id === userId;
                    return (
                      <div key={msg.id}>
                        {showSep && (
                          <div className="flex items-center gap-3 my-3">
                            <div className="flex-1 h-px bg-slate-200" />
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                              {formatDateSeparator(msg.created_at)}
                            </span>
                            <div className="flex-1 h-px bg-slate-200" />
                          </div>
                        )}
                        <MsgBubble msg={msg} isOwn={isOwn} />
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input area */}
            <div className="bg-white border-t border-slate-200 px-4 py-3 shrink-0">
              <div className="flex items-end gap-2">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message…"
                  rows={1}
                  className="flex-1 resize-none border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4E87A0]/40 focus:border-[#4E87A0] max-h-32 overflow-y-auto"
                  style={{ minHeight: '42px' }}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  className="w-10 h-10 rounded-xl bg-[#1B3A5C] text-white flex items-center justify-center hover:bg-[#16304f] disabled:opacity-40 transition-colors shrink-0"
                >
                  <svg className="w-4 h-4 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5M5 12l7-7 7 7" />
                  </svg>
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5 pl-1">Enter to send · Shift+Enter for new line</p>
            </div>
          </>
        )}
      </div>

      {/* New chat modal */}
      {newChatOpen && userId && (
        <NewChatModal
          currentUserId={userId}
          onClose={() => setNewChatOpen(false)}
          onConversationOpened={openConversation}
        />
      )}
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="w-8 h-8 border-2 border-[#4E87A0] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <MessagesPageInner />
    </Suspense>
  );
}
