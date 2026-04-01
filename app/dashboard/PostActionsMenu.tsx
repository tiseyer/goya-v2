'use client'

import { useState } from 'react'
import { Post, togglePin, deletePost } from '@/lib/feed'

interface PostActionsMenuProps {
  post: Post
  currentUserId: string
  currentUserRole: string
  onDelete: (postId: string) => void
  onPin: (postId: string, currentIsPinned: boolean) => void
}

export default function PostActionsMenu({
  post, currentUserId, currentUserRole, onDelete, onPin
}: PostActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const isAdminOrMod = currentUserRole === 'admin' || currentUserRole === 'moderator'
  const isAuthor = post.author_id === currentUserId

  // Only show if admin/mod or own post
  if (!isAdminOrMod && !isAuthor) return null

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    setIsActionLoading(true)
    try {
      await deletePost(post.id, currentUserId)
      onDelete(post.id)
      setIsOpen(false)
    } catch {
      setLocalError('Failed to delete post')
      setIsActionLoading(false)
    }
  }

  const handlePin = async () => {
    setIsActionLoading(true)
    setLocalError(null)
    try {
      const result = await togglePin(post.id, currentUserId)
      if (!result.success) {
        setLocalError(result.error ?? 'Failed to pin post')
        setTimeout(() => setLocalError(null), 4000)
      } else {
        onPin(post.id, post.is_pinned)
      }
    } catch {
      setLocalError('Failed to pin post')
    } finally {
      setIsActionLoading(false)
      if (!localError) setIsOpen(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); setConfirmDelete(false); setLocalError(null) }}
        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#F3F4F6] text-[#9CA3AF] hover:text-[#374151] transition-colors text-lg leading-none"
        aria-label="Post actions"
      >
        ···
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => { setIsOpen(false); setConfirmDelete(false) }} />

          {/* Dropdown */}
          <div className="absolute right-0 top-9 z-50 bg-white border border-[#E5E7EB] rounded-xl shadow-lg py-1 min-w-[160px]">
            {/* Error message */}
            {localError && (
              <div className="px-3 py-2 text-xs text-red-600 bg-red-50 mx-1 rounded-lg mb-1">
                {localError}
              </div>
            )}

            {/* Pin option — admins/mods only */}
            {isAdminOrMod && (
              <button
                onClick={handlePin}
                disabled={isActionLoading}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[#374151] hover:bg-[#F3F4F6] transition-colors disabled:opacity-50"
              >
                <span>📌</span>
                <span>{post.is_pinned ? 'Unpin Post' : 'Pin Post'}</span>
              </button>
            )}

            {/* Delete option */}
            {!confirmDelete ? (
              <button
                onClick={handleDelete}
                disabled={isActionLoading}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <span>🗑</span>
                <span>Delete Post</span>
              </button>
            ) : (
              <div className="px-3 py-2">
                <p className="text-xs text-[#6B7280] mb-2">Are you sure?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 text-xs px-2 py-1.5 border border-[#E5E7EB] rounded-lg text-[#374151] hover:bg-[#F3F4F6]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isActionLoading}
                    className="flex-1 text-xs px-2 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    {isActionLoading && <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />}
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
