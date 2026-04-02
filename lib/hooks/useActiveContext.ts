'use client'

import { useState, useEffect, useCallback, useTransition } from 'react'
import { switchContext } from '@/app/actions/context'
import type { ActiveContext, ContextSchool } from '@/lib/active-context'

interface UseActiveContextReturn {
  context: ActiveContext
  isSchoolContext: boolean
  availableSchools: ContextSchool[]
  switchToPersonal: () => void
  switchToSchool: (schoolId: string) => void
  isPending: boolean
}

/**
 * Client hook for reading and switching active context.
 * Props are passed down from a server component that reads the cookie.
 */
export function useActiveContext(
  initialContext: ActiveContext,
  schools: ContextSchool[],
): UseActiveContextReturn {
  const [context, setContext] = useState<ActiveContext>(initialContext)
  const [isPending, startTransition] = useTransition()

  // Sync with server when initialContext changes (e.g., after navigation)
  useEffect(() => {
    setContext(initialContext)
  }, [initialContext])

  const switchToPersonal = useCallback(() => {
    startTransition(async () => {
      const result = await switchContext('personal')
      if (!result.error) {
        setContext({ type: 'personal', profileId: context.profileId })
      }
    })
  }, [context.profileId])

  const switchToSchool = useCallback((schoolId: string) => {
    startTransition(async () => {
      const result = await switchContext(`school:${schoolId}`)
      if (!result.error) {
        setContext({ type: 'school', schoolId, profileId: context.profileId })
      }
    })
  }, [context.profileId])

  return {
    context,
    isSchoolContext: context.type === 'school',
    availableSchools: schools,
    switchToPersonal,
    switchToSchool,
    isPending,
  }
}
