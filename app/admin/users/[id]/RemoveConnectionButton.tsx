'use client'

import { useState } from 'react'
import Button from '@/app/components/ui/Button'
import { removeConnectionAsAdmin } from '@/app/actions/adminConnections'

interface Props {
  connectionId: string
  userId: string
}

export default function RemoveConnectionButton({ connectionId, userId }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleRemove() {
    setLoading(true)
    await removeConnectionAsAdmin(connectionId, userId)
    setLoading(false)
    setConfirming(false)
  }

  if (!confirming) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setConfirming(true)}>
        Remove
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="danger" size="sm" loading={loading} onClick={handleRemove}>
        Confirm
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
        Cancel
      </Button>
    </div>
  )
}
