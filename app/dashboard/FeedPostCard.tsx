'use client'

import { useState, useEffect, useRef } from 'react'
import { formatDistanceToNow } from 'date-fns'
import {
  Post,
  PostComment,
  PollOption,
  ReactionType,
  toggleReaction,
  getPostComments,
  addComment,
  deleteComment,
} from '@/lib/feed'
import { supabase } from '@/lib/supabase'
import PostActionsMenu from './PostActionsMenu'

interface FeedPostCardProps {
  post: Post
  currentUserId: string
  currentUserRole: string
  onDelete: (postId: string) => void
  onPin: (postId: string, isPinned: boolean) => void
  onReact: (postId: string, type: ReactionType, delta: number) => void
  onComment: (postId: string) => void
  onDeleteComment: (commentId: string, postId: string) => void
  onVote: (postId: string, optionId: string, options: PollOption[]) => void
  pinError?: string | null
}

const ROLE_BADGE: Record<string, { label: string; className: string }> = {
  student: { label: 'Student', className: 'bg-blue-100 text-blue-700' },
  teacher: { label: 'Teacher', className: 'bg-teal-100 text-teal-700' },
  wellness_practitioner: { label: 'Wellness', className: 'bg-purple-100 text-purple-700' },
  moderator: { label: 'Mod', className: 'bg-amber-100 text-amber-700' },
  admin: { label: 'Admin', className: 'bg-red-100 text-red-700' },
}

function Avatar({
  avatarUrl,
  fullName,
  size = 40,
}: {
  avatarUrl: string | null | undefined
  fullName: string | undefined
  size?: number
}) {
  const initials = (fullName ?? '?')
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={fullName ?? ''}
        style={{ width: size, height: size }}
        className="rounded-full object-cover shrink-0"
      />
    )
  }
  return (
    <div
      style={{ width: size, height: size, backgroundColor: '#4E87A0' }}
      className="rounded-full flex items-center justify-center shrink-0"
    >
      <span className="text-white font-bold" style={{ fontSize: size * 0.35 }}>
        {initials}
      </span>
    </div>
  )
}

function CommentItem({
  comment,
  currentUserId,
  currentUserRole,
  postId,
  onDeleted,
}: {
  comment: PostComment
  currentUserId: string
  currentUserRole: string
  postId: string
  onDeleted: (commentId: string, postId: string) => void
}) {
  const canDelete =
    currentUserRole === 'admin' ||
    currentUserRole === 'moderator' ||
    comment.author_id === currentUserId

  async function handleDelete() {
    try {
      await deleteComment(comment.id, currentUserId)
      onDeleted(comment.id, postId)
    } catch (e) {
      console.error('Failed to delete comment', e)
    }
  }

  return (
    <div className="flex items-start gap-2">
      <Avatar
        avatarUrl={comment.author?.avatar_url}
        fullName={comment.author?.full_name}
        size={32}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-[#1B3A5C]">
              {comment.author?.full_name ?? 'Unknown'}
            </span>
            <span className="text-[10px] text-[#9CA3AF]">
              ·{' '}
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>
          </div>
          {canDelete && (
            <button
              onClick={handleDelete}
              className="text-[#9CA3AF] hover:text-red-500 transition-colors shrink-0"
              title="Delete comment"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.75}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </div>
        <p className="text-xs text-[#374151] leading-relaxed mt-0.5">{comment.content}</p>
      </div>
    </div>
  )
}

export default function FeedPostCard({
  post,
  currentUserId,
  currentUserRole,
  onDelete,
  onPin,
  onReact,
  onComment,
  onDeleteComment,
  onVote,
  pinError,
}: FeedPostCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showFullContent, setShowFullContent] = useState(false)
  const [comments, setComments] = useState<PostComment[]>([])
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const author = post.author
  const role = author?.role ?? ''
  const badge = ROLE_BADGE[role]

  const content = post.content ?? ''
  const isLong = content.length > 300
  const displayContent = isLong && !showFullContent ? content.slice(0, 300) + '…' : content

  const userLiked = post.reactions?.some(
    (r) => r.user_id === currentUserId && r.reaction_type === 'like'
  )
  const userHearted = post.reactions?.some(
    (r) => r.user_id === currentUserId && r.reaction_type === 'heart'
  )

  // Load + subscribe when expanding
  useEffect(() => {
    if (!isExpanded) {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      return
    }

    setIsLoadingComments(true)
    getPostComments(post.id)
      .then((data) => setComments(data))
      .catch(console.error)
      .finally(() => setIsLoadingComments(false))

    const channel = supabase
      .channel(`post-comments-${post.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'post_comments',
          filter: `post_id=eq.${post.id}`,
        },
        (payload) => {
          const newComment = payload.new as PostComment
          // Only add if not already in list (e.g. if we inserted it ourselves)
          setComments((prev) => {
            if (prev.some((c) => c.id === newComment.id)) return prev
            return [...prev, newComment]
          })
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [isExpanded, post.id])

  async function handleReact(type: ReactionType) {
    const isCurrentlyReacted =
      type === 'like' ? userLiked : userHearted
    const delta = isCurrentlyReacted ? -1 : 1

    // Optimistic
    onReact(post.id, type, delta)

    try {
      const result = await toggleReaction(post.id, currentUserId, type)
      // If server says removed but we added optimistically, or vice versa, correct it
      if (result.action === 'removed' && delta === 1) {
        onReact(post.id, type, -2)
      } else if (result.action === 'added' && delta === -1) {
        onReact(post.id, type, 2)
      }
    } catch (e) {
      // Revert
      onReact(post.id, type, -delta)
      console.error('Reaction failed', e)
    }
  }

  async function handleSubmitComment() {
    const text = commentText.trim()
    if (!text || isSubmitting) return
    setIsSubmitting(true)
    try {
      const newComment = await addComment(post.id, currentUserId, text)
      setComments((prev) => [newComment, ...prev])
      onComment(post.id)
      setCommentText('')
    } catch (e) {
      console.error('Comment failed', e)
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleCommentKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmitComment()
    }
  }

  function handleCommentDeleted(commentId: string, postId: string) {
    setComments((prev) => prev.filter((c) => c.id !== commentId))
    onDeleteComment(commentId, postId)
  }

  const visibleComments = showAll ? comments : comments.slice(0, 5)

  // Poll totals
  const totalVotes =
    post.poll_options?.reduce((sum, o) => sum + (o.vote_count ?? 0), 0) ?? 0

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
      <div className="p-4">
        {/* Top row: pinned badge + admin menu */}
        <div className="flex items-center justify-between mb-2">
          <div>
            {post.is_pinned && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#4E87A0] bg-[#4E87A0]/10 px-2 py-0.5 rounded-full">
                📌 Pinned
              </span>
            )}
          </div>

          {/* Admin/mod menu */}
          <PostActionsMenu
            post={post}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            onDelete={onDelete}
            onPin={onPin}
          />
        </div>

        {/* Author row */}
        <div className="flex items-center gap-2.5 mb-3">
          <Avatar avatarUrl={author?.avatar_url} fullName={author?.full_name} size={40} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-bold text-[#1B3A5C] truncate">
                {author?.full_name ?? 'Unknown'}
              </span>
              {badge && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${badge.className}`}
                >
                  {badge.label}
                </span>
              )}
              {author?.is_verified && (
                <span className="text-[#4E87A0]" title="Verified">
                  ✓
                </span>
              )}
              <span className="text-[#9CA3AF] text-xs">·</span>
              <span className="text-xs text-[#9CA3AF]">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        {content && (
          <div className="mb-3">
            <p className="text-sm text-[#374151] leading-relaxed whitespace-pre-wrap">
              {displayContent}
            </p>
            {isLong && (
              <button
                onClick={() => setShowFullContent((v) => !v)}
                className="text-xs text-[#4E87A0] font-semibold mt-1 hover:underline"
              >
                {showFullContent ? 'Show less' : 'Read more'}
              </button>
            )}
          </div>
        )}

        {/* Media */}
        {post.post_type === 'image' && post.media_urls.length > 0 && (
          <div className="mb-3">
            {post.media_urls.length === 1 && (
              <img
                src={post.media_urls[0]}
                alt="Post media"
                className="w-full rounded-xl max-h-96 object-cover"
              />
            )}
            {post.media_urls.length === 2 && (
              <div className="grid grid-cols-2 gap-2">
                {post.media_urls.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`Post media ${i + 1}`}
                    className="w-full rounded-xl h-48 object-cover"
                  />
                ))}
              </div>
            )}
            {post.media_urls.length >= 3 && (
              <div className="grid grid-cols-2 gap-2">
                {post.media_urls.slice(0, 4).map((url, i) => {
                  const isLast = i === 3 && post.media_urls.length > 4
                  const remaining = post.media_urls.length - 4
                  return (
                    <div key={i} className="relative">
                      <img
                        src={url}
                        alt={`Post media ${i + 1}`}
                        className="w-full rounded-xl h-40 object-cover"
                      />
                      {isLast && (
                        <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                          <span className="text-white text-xl font-bold">+{remaining}</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {post.post_type === 'video' && post.media_urls.length > 0 && (
          <div className="mb-3">
            <video controls className="w-full rounded-xl max-h-96" src={post.media_urls[0]} />
          </div>
        )}

        {post.post_type === 'audio' && post.media_urls.length > 0 && (
          <div className="mb-3">
            <audio controls className="w-full" src={post.media_urls[0]} />
          </div>
        )}

        {post.post_type === 'gif' && post.gif_url && (
          <div className="mb-3">
            <img src={post.gif_url} className="w-full rounded-xl" alt="GIF" />
          </div>
        )}

        {/* Poll */}
        {post.post_type === 'poll' && post.poll_options && post.poll_options.length > 0 && (
          <div className="mb-3 space-y-2">
            {!post.user_vote
              ? post.poll_options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => onVote(post.id, opt.id, post.poll_options!)}
                    className="w-full text-left px-4 py-2.5 rounded-xl border border-[#E5E7EB] hover:border-[#4E87A0] hover:bg-[#4E87A0]/5 transition-all text-sm"
                  >
                    {opt.option_text}
                  </button>
                ))
              : post.poll_options.map((opt) => {
                  const pct =
                    totalVotes > 0
                      ? Math.round(((opt.vote_count ?? 0) / totalVotes) * 100)
                      : 0
                  const isSelected = opt.id === post.user_vote
                  return (
                    <div
                      key={opt.id}
                      className={`relative rounded-xl px-4 py-2.5 overflow-hidden border ${
                        isSelected ? 'border-[#4E87A0]' : 'border-[#E5E7EB]'
                      }`}
                    >
                      <div
                        className="absolute inset-0 bg-[#4E87A0]/10 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                      <div className="relative flex justify-between">
                        <span
                          className={`text-sm ${
                            isSelected
                              ? 'font-semibold text-[#4E87A0]'
                              : 'text-[#374151]'
                          }`}
                        >
                          {opt.option_text}
                        </span>
                        <span className="text-sm text-[#6B7280]">{pct}%</span>
                      </div>
                    </div>
                  )
                })}
            <p className="text-xs text-[#9CA3AF] mt-1">
              {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Reaction bar */}
        <div className="flex items-center gap-3 pt-2 border-t border-[#F3F4F6]">
          <button
            onClick={() => handleReact('like')}
            className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
              userLiked ? 'text-[#4E87A0]' : 'text-[#6B7280] hover:text-[#4E87A0]'
            }`}
          >
            👍 {post.like_count ?? 0}
          </button>
          <button
            onClick={() => handleReact('heart')}
            className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
              userHearted ? 'text-rose-500' : 'text-[#6B7280] hover:text-rose-500'
            }`}
          >
            ❤️ {post.heart_count ?? 0}
          </button>
          <span className="text-[#E5E7EB]">·</span>
          <button
            onClick={() => setIsExpanded((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-medium text-[#6B7280] hover:text-[#4E87A0] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            {post.comment_count ?? 0} Comment{(post.comment_count ?? 0) !== 1 ? 's' : ''}
          </button>
        </div>
      </div>

      {/* Comments section */}
      {isExpanded && (
        <div className="border-t border-[#F3F4F6] px-4 pt-3 pb-4 space-y-3 bg-[#FAFAFA]">
          {isLoadingComments ? (
            <div className="text-xs text-[#9CA3AF] text-center py-2">Loading comments…</div>
          ) : comments.length === 0 ? (
            <p className="text-xs text-[#9CA3AF] text-center py-2">
              No comments yet. Be the first!
            </p>
          ) : (
            <div className="space-y-3">
              {visibleComments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  currentUserId={currentUserId}
                  currentUserRole={currentUserRole}
                  postId={post.id}
                  onDeleted={handleCommentDeleted}
                />
              ))}
              {!showAll && comments.length > 5 && (
                <button
                  onClick={() => setShowAll(true)}
                  className="text-xs text-[#4E87A0] font-semibold hover:underline"
                >
                  Load {comments.length - 5} more comment{comments.length - 5 !== 1 ? 's' : ''}
                </button>
              )}
            </div>
          )}

          {/* Comment input */}
          <div className="flex items-start gap-2 pt-1">
            <div
              style={{ width: 32, height: 32, backgroundColor: '#4E87A0' }}
              className="rounded-full flex items-center justify-center shrink-0"
            >
              <span className="text-white text-[10px] font-bold">Me</span>
            </div>
            <div className="flex-1">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={handleCommentKeyDown}
                placeholder="Write a comment… (Enter to submit)"
                rows={1}
                className="w-full text-xs border border-[#E5E7EB] rounded-xl px-3 py-2 outline-none focus:border-[#4E87A0] resize-none text-[#374151] placeholder:text-[#9CA3AF] bg-white"
              />
              {commentText.trim() && (
                <button
                  onClick={handleSubmitComment}
                  disabled={isSubmitting}
                  className="mt-1.5 px-3 py-1 bg-[#4E87A0] text-white text-xs font-semibold rounded-lg hover:bg-[#3A7190] transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Posting…' : 'Post'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
