'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Post,
  PollOption,
  ReactionType,
  getFeedPosts,
  deletePost,
  togglePin,
  getPinnedCount,
  votePoll,
} from '@/lib/feed'
import { supabase } from '@/lib/supabase'
import FeedPostCard from './FeedPostCard'
import PostComposer from './PostComposer'

interface FeedViewProps {
  currentUserId: string
  currentUserRole: string
  currentUserFirstName: string
}

function SkeletonPosts() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-4 space-y-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full animate-pulse bg-[#E5E7EB]" />
            <div className="space-y-1.5">
              <div className="h-3 w-32 animate-pulse bg-[#E5E7EB] rounded" />
              <div className="h-2.5 w-20 animate-pulse bg-[#E5E7EB] rounded" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full animate-pulse bg-[#E5E7EB] rounded" />
            <div className="h-3 w-4/5 animate-pulse bg-[#E5E7EB] rounded" />
          </div>
        </div>
      ))}
    </>
  )
}

export default function FeedView({
  currentUserId,
  currentUserRole,
  currentUserFirstName,
}: FeedViewProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [page, setPage] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [newPostsCount, setNewPostsCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'text' | 'image' | 'video' | 'poll'>('all')
  const [pinnedCount, setPinnedCount] = useState(0)
  const [pinError, setPinError] = useState<string | null>(null)

  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const realtimeChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  // Initial load
  useEffect(() => {
    async function initialLoad() {
      setIsLoading(true)
      try {
        const [feedPage, count] = await Promise.all([
          getFeedPosts(0, 20),
          getPinnedCount(),
        ])
        setPosts(feedPage.posts)
        setHasMore(feedPage.hasMore)
        setPage(feedPage.nextPage)
        setPinnedCount(count)
      } catch (e) {
        console.error('Feed load failed', e)
      } finally {
        setIsLoading(false)
      }
    }
    initialLoad()
  }, [])

  // Realtime subscription for new posts
  useEffect(() => {
    const channel = supabase
      .channel('feed-new-posts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        (payload) => {
          const newPost = payload.new as Post
          // Don't show banner for own posts (we'll add them directly via handleNewPost)
          if (newPost.author_id !== currentUserId) {
            setNewPostsCount((prev) => prev + 1)
          }
        }
      )
      .subscribe()

    realtimeChannelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      realtimeChannelRef.current = null
    }
  }, [currentUserId])

  // Infinite scroll via IntersectionObserver
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore) return
    setIsLoadingMore(true)
    try {
      const feedPage = await getFeedPosts(page, 20)
      setPosts((prev) => [...prev, ...feedPage.posts])
      setHasMore(feedPage.hasMore)
      setPage(feedPage.nextPage)
    } catch (e) {
      console.error('Load more failed', e)
    } finally {
      setIsLoadingMore(false)
    }
  }, [hasMore, isLoadingMore, page])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, isLoadingMore, loadMore])

  async function handleRefreshFeed() {
    setIsLoading(true)
    setNewPostsCount(0)
    try {
      const feedPage = await getFeedPosts(0, 20)
      setPosts(feedPage.posts)
      setHasMore(feedPage.hasMore)
      setPage(feedPage.nextPage)
    } catch (e) {
      console.error('Refresh failed', e)
    } finally {
      setIsLoading(false)
    }
  }

  // Handlers
  const handleDelete = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId))
    deletePost(postId, currentUserId).catch(() => {
      console.error('Delete failed')
    })
  }

  const handlePin = async (postId: string, currentIsPinned: boolean) => {
    // Optimistic update
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              is_pinned: !currentIsPinned,
              pinned_at: !currentIsPinned ? new Date().toISOString() : null,
            }
          : p
      )
    )
    const result = await togglePin(postId, currentUserId)
    if (!result.success) {
      // Revert
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, is_pinned: currentIsPinned } : p))
      )
      setPinError(result.error ?? 'Failed to pin post')
      setTimeout(() => setPinError(null), 4000)
    } else {
      setPinnedCount(await getPinnedCount())
    }
  }

  const handleReact = (postId: string, type: ReactionType, delta: number) => {
    const key = type === 'like' ? 'like_count' : 'heart_count'
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, [key]: Math.max(0, (p[key] ?? 0) + delta) } : p
      )
    )
  }

  const handleComment = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, comment_count: (p.comment_count ?? 0) + 1 } : p
      )
    )
  }

  const handleDeleteComment = (_commentId: string, postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, comment_count: Math.max(0, (p.comment_count ?? 0) - 1) }
          : p
      )
    )
  }

  const handleVote = (postId: string, optionId: string, options: PollOption[]) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p
        const oldVoteId = p.user_vote
        const newOptions = (p.poll_options ?? []).map((o) => ({
          ...o,
          vote_count:
            (o.vote_count ?? 0) +
            (o.id === optionId ? 1 : 0) -
            (o.id === oldVoteId ? 1 : 0),
        }))
        return { ...p, user_vote: optionId, poll_options: newOptions }
      })
    )
    // Suppress unused parameter warning — options passed through but DB handles it
    void options
    votePoll(postId, optionId, currentUserId).catch(console.error)
  }

  const handleNewPost = (post: Post) => {
    setPosts((prev) => [post, ...prev])
    if (currentUserRole === 'admin' || currentUserRole === 'moderator') {
      getPinnedCount().then(setPinnedCount).catch(console.error)
    }
  }

  // Filtered posts
  const filteredPosts = posts.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      p.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.author?.full_name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType =
      filterType === 'all' ||
      p.post_type === filterType ||
      (filterType === 'image' && p.post_type === 'image')
    return matchesSearch && matchesType
  })

  return (
    <div className="space-y-4">
      {/* Post composer */}
      <PostComposer
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
        currentUserFirstName={currentUserFirstName}
        onPostCreated={handleNewPost}
      />

      {/* Search + filter bar */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-3 flex gap-2">
        <input
          type="text"
          placeholder="🔍  Search posts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 text-sm outline-none text-[#374151] placeholder:text-[#9CA3AF]"
        />
        <select
          value={filterType}
          onChange={(e) =>
            setFilterType(e.target.value as typeof filterType)
          }
          className="text-xs border border-[#E5E7EB] rounded-lg px-2 py-1 text-[#374151] outline-none"
        >
          <option value="all">All updates</option>
          <option value="text">Text only</option>
          <option value="image">Images</option>
          <option value="video">Videos</option>
          <option value="poll">Polls</option>
        </select>
      </div>

      {/* Admin pin counter */}
      {(currentUserRole === 'admin' || currentUserRole === 'moderator') && (
        <p className="text-xs text-[#9CA3AF] px-1">
          📌 {pinnedCount}/3 posts pinned
        </p>
      )}

      {/* Pin error toast */}
      {pinError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-xl">
          {pinError}
        </div>
      )}

      {/* New posts banner */}
      {newPostsCount > 0 && (
        <button
          onClick={handleRefreshFeed}
          className="w-full py-2 bg-[#4E87A0]/10 text-[#4E87A0] text-sm font-medium rounded-xl hover:bg-[#4E87A0]/20 transition-colors"
        >
          {newPostsCount} new post{newPostsCount !== 1 ? 's' : ''} — click to refresh
        </button>
      )}

      {/* Posts */}
      {isLoading ? (
        <SkeletonPosts />
      ) : (
        <>
          {filteredPosts.map((post) => (
            <FeedPostCard
              key={post.id}
              post={post}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              onDelete={handleDelete}
              onPin={(id) =>
                handlePin(id, posts.find((p) => p.id === id)?.is_pinned ?? false)
              }
              onReact={handleReact}
              onComment={handleComment}
              onDeleteComment={handleDeleteComment}
              onVote={handleVote}
              pinError={pinError}
            />
          ))}
          {isLoadingMore && (
            <div className="text-center py-4 text-sm text-[#9CA3AF]">Loading more…</div>
          )}
          {!hasMore && posts.length > 0 && (
            <p className="text-center text-xs text-[#9CA3AF] py-4">
              You&apos;ve seen all posts
            </p>
          )}
          {posts.length === 0 && !isLoading && (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-8 text-center">
              <p className="text-[#9CA3AF] text-sm">
                No posts yet. Be the first to share something!
              </p>
            </div>
          )}
          <div ref={sentinelRef} className="h-4" />
        </>
      )}
    </div>
  )
}
