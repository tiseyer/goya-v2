import { supabase } from './supabase'

// Types
export type PostType = 'text' | 'image' | 'video' | 'audio' | 'gif' | 'poll'
export type ReactionType = 'like' | 'heart'

export interface PollOption {
  id: string
  post_id: string
  option_text: string
  position: number
  created_at: string
  vote_count?: number
}

export interface PostComment {
  id: string
  post_id: string
  author_id: string
  content: string
  is_deleted: boolean
  deleted_at: string | null
  deleted_by: string | null
  created_at: string
  author?: {
    id: string
    full_name: string
    avatar_url: string | null
    role: string
    is_verified: boolean
  }
  reactions?: { reaction_type: string; user_id: string }[]
}

export interface Post {
  id: string
  author_id: string
  content: string | null
  post_type: PostType
  media_urls: string[]
  gif_url: string | null
  is_pinned: boolean
  pinned_at: string | null
  pinned_by: string | null
  is_deleted: boolean
  deleted_at: string | null
  deleted_by: string | null
  created_at: string
  updated_at: string
  author?: {
    id: string
    full_name: string
    avatar_url: string | null
    role: string
    is_verified: boolean
  }
  reactions?: { reaction_type: string; user_id: string }[]
  comments?: PostComment[]
  comment_count?: number
  poll_options?: PollOption[]
  user_vote?: string | null
  like_count?: number
  heart_count?: number
}

export interface FeedPage {
  posts: Post[]
  hasMore: boolean
  nextPage: number
}

// Get paginated feed posts — pinned first, then by created_at DESC
export async function getFeedPosts(page = 0, limit = 20): Promise<FeedPage> {
  const from = page * limit
  const to = from + limit - 1

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: posts, error } = await supabase
    .from('posts')
    .select(
      `
      *,
      author:profiles!posts_author_id_fkey(id, full_name, avatar_url, role, is_verified),
      reactions:post_reactions(reaction_type, user_id),
      comments:post_comments(id, is_deleted)
    `
    )
    .eq('is_deleted', false)
    .order('is_pinned', { ascending: false })
    .order('pinned_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw error

  const pollPostIds = (posts ?? [])
    .filter((p) => p.post_type === 'poll')
    .map((p) => p.id)

  const pollOptionsMap: Record<string, PollOption[]> = {}
  const userVotesMap: Record<string, string> = {}

  if (pollPostIds.length > 0) {
    const { data: options } = await supabase
      .from('poll_options')
      .select('*')
      .in('post_id', pollPostIds)
      .order('position')

    const { data: votes } = await supabase
      .from('poll_votes')
      .select('post_id, option_id, user_id')
      .in('post_id', pollPostIds)

    const voteCounts: Record<string, number> = {}
    ;(votes ?? []).forEach((v) => {
      voteCounts[v.option_id] = (voteCounts[v.option_id] ?? 0) + 1
      if (user && v.user_id === user.id) {
        userVotesMap[v.post_id] = v.option_id
      }
    })

    ;(options ?? []).forEach((opt) => {
      if (!pollOptionsMap[opt.post_id]) pollOptionsMap[opt.post_id] = []
      pollOptionsMap[opt.post_id].push({ ...opt, vote_count: voteCounts[opt.id] ?? 0 })
    })
  }

  const enriched: Post[] = (posts ?? []).map((post) => {
    const reactions = (post.reactions ?? []) as { reaction_type: string; user_id: string }[]
    const likeCount = reactions.filter((r) => r.reaction_type === 'like').length
    const heartCount = reactions.filter((r) => r.reaction_type === 'heart').length
    const visibleComments = (post.comments ?? []).filter(
      (c: { is_deleted: boolean }) => !c.is_deleted
    )

    return {
      ...post,
      like_count: likeCount,
      heart_count: heartCount,
      comment_count: visibleComments.length,
      poll_options: pollOptionsMap[post.id] ?? [],
      user_vote: userVotesMap[post.id] ?? null,
    }
  })

  return {
    posts: enriched,
    hasMore: (posts ?? []).length === limit,
    nextPage: page + 1,
  }
}

// Create a new post
export async function createPost(
  authorId: string,
  content: string | null,
  postType: PostType,
  mediaUrls: string[] = [],
  gifUrl: string | null = null,
  pollOptionTexts: string[] = []
): Promise<Post> {
  const { data: post, error } = await supabase
    .from('posts')
    .insert({
      author_id: authorId,
      content,
      post_type: postType,
      media_urls: mediaUrls,
      gif_url: gifUrl,
    })
    .select()
    .single()

  if (error) throw error

  if (postType === 'poll' && pollOptionTexts.length >= 2) {
    const { error: pollError } = await supabase.from('poll_options').insert(
      pollOptionTexts.map((text, i) => ({
        post_id: post.id,
        option_text: text,
        position: i,
      }))
    )
    if (pollError) throw pollError
  }

  return post as Post
}

// Soft delete a post
export async function deletePost(postId: string, deletedBy: string): Promise<void> {
  const { error } = await supabase
    .from('posts')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      deleted_by: deletedBy,
    })
    .eq('id', postId)

  if (error) throw error
}

// Toggle pin — max 3 pinned at a time
export async function togglePin(
  postId: string,
  pinnedBy: string
): Promise<{ success: boolean; error?: string; is_pinned: boolean }> {
  const { data: post } = await supabase
    .from('posts')
    .select('is_pinned')
    .eq('id', postId)
    .single()

  if (!post) return { success: false, error: 'Post not found', is_pinned: false }

  if (!post.is_pinned) {
    const { count } = await supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('is_pinned', true)
      .eq('is_deleted', false)

    if ((count ?? 0) >= 3) {
      return {
        success: false,
        error: 'Maximum 3 posts can be pinned at a time. Unpin one first.',
        is_pinned: false,
      }
    }
  }

  const nowPinned = !post.is_pinned
  const { error } = await supabase
    .from('posts')
    .update({
      is_pinned: nowPinned,
      pinned_at: nowPinned ? new Date().toISOString() : null,
      pinned_by: nowPinned ? pinnedBy : null,
    })
    .eq('id', postId)

  if (error) throw error
  return { success: true, is_pinned: nowPinned }
}

// Toggle reaction on a post
export async function toggleReaction(
  postId: string,
  userId: string,
  reactionType: ReactionType
): Promise<{ action: 'added' | 'removed' }> {
  const { data: existing } = await supabase
    .from('post_reactions')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .eq('reaction_type', reactionType)
    .maybeSingle()

  if (existing) {
    await supabase.from('post_reactions').delete().eq('id', existing.id)
    return { action: 'removed' }
  }

  await supabase.from('post_reactions').insert({ post_id: postId, user_id: userId, reaction_type: reactionType })
  return { action: 'added' }
}

// Add a comment
export async function addComment(
  postId: string,
  authorId: string,
  content: string
): Promise<PostComment> {
  const { data, error } = await supabase
    .from('post_comments')
    .insert({ post_id: postId, author_id: authorId, content })
    .select(
      `
      *,
      author:profiles!post_comments_author_id_fkey(id, full_name, avatar_url, role, is_verified)
    `
    )
    .single()

  if (error) throw error
  return data as PostComment
}

// Soft delete a comment
export async function deleteComment(commentId: string, deletedBy: string): Promise<void> {
  const { error } = await supabase
    .from('post_comments')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      deleted_by: deletedBy,
    })
    .eq('id', commentId)

  if (error) throw error
}

// Get comments for a post
export async function getPostComments(postId: string): Promise<PostComment[]> {
  const { data, error } = await supabase
    .from('post_comments')
    .select(
      `
      *,
      author:profiles!post_comments_author_id_fkey(id, full_name, avatar_url, role, is_verified),
      reactions:comment_reactions(reaction_type, user_id)
    `
    )
    .eq('post_id', postId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []) as PostComment[]
}

// Vote on a poll (replaces existing vote)
export async function votePoll(postId: string, optionId: string, userId: string): Promise<void> {
  await supabase.from('poll_votes').delete().eq('post_id', postId).eq('user_id', userId)

  const { error } = await supabase
    .from('poll_votes')
    .insert({ post_id: postId, option_id: optionId, user_id: userId })

  if (error) throw error
}

// Get pinned post count
export async function getPinnedCount(): Promise<number> {
  const { count } = await supabase
    .from('posts')
    .select('id', { count: 'exact', head: true })
    .eq('is_pinned', true)
    .eq('is_deleted', false)

  return count ?? 0
}

// Upload file to storage and return public URL
export async function uploadPostMedia(
  bucket: 'post-images' | 'post-videos' | 'post-audio',
  userId: string,
  file: File
): Promise<string> {
  const ext = file.name.split('.').pop()
  const filename = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error } = await supabase.storage.from(bucket).upload(filename, file, {
    cacheControl: '3600',
    upsert: false,
  })

  if (error) throw error

  const { data } = supabase.storage.from(bucket).getPublicUrl(filename)
  return data.publicUrl
}
