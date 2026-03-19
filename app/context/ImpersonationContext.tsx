'use client'
import { createContext, useContext } from 'react'
import type { ImpersonationState } from '@/lib/impersonation'

const ImpersonationContext = createContext<ImpersonationState>({
  isImpersonating: false,
  targetUserId: null,
  targetProfile: null,
  adminId: null,
  adminProfile: null,
})

export function ImpersonationProvider({
  children,
  value,
}: {
  children: React.ReactNode
  value: ImpersonationState
}) {
  return (
    <ImpersonationContext.Provider value={value}>
      {children}
    </ImpersonationContext.Provider>
  )
}

export function useImpersonation() {
  return useContext(ImpersonationContext)
}
