'use client'

import { useState } from 'react'

interface CommentDeleteButtonProps {
  commentId: string
  commentAuthorId: string
  currentUserId: string
  currentUserRole: string
  onDelete: (commentId: string) => void
}

export default function CommentDeleteButton({
  commentId, commentAuthorId, currentUserId, currentUserRole, onDelete
}: CommentDeleteButtonProps) {
  const [confirm, setConfirm] = useState(false)

  const canDelete = currentUserRole === 'admin' || currentUserRole === 'moderator' || commentAuthorId === currentUserId
  if (!canDelete) return null

  const handleClick = () => {
    if (!confirm) {
      setConfirm(true)
      // Auto-reset after 3s
      setTimeout(() => setConfirm(false), 3000)
      return
    }
    onDelete(commentId)
  }

  return (
    <button
      onClick={handleClick}
      title={confirm ? 'Click again to confirm' : 'Delete comment'}
      className={`transition-colors text-xs ${confirm ? 'text-red-500' : 'text-[#D1D5DB] hover:text-red-400'}`}
    >
      {confirm ? '✓ Delete?' : '🗑'}
    </button>
  )
}
