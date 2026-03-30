'use client';

import { ThemeProvider } from 'next-themes';
import { CartProvider } from '@/app/context/CartContext';
import { ConnectionsProvider } from '@/app/context/ConnectionsContext';
import { ImpersonationProvider } from '@/app/context/ImpersonationContext';
import { CookieConsentProvider } from '@/app/context/CookieConsentContext';
import type { ImpersonationState } from '@/lib/impersonation';
import { ReactNode } from 'react';
import FlowPlayerLoader from '@/app/components/flow-player/FlowPlayerLoader';

export default function ClientProviders({
  children,
  impersonationState,
}: {
  children: ReactNode;
  impersonationState: ImpersonationState;
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
      <ImpersonationProvider value={impersonationState}>
        <CookieConsentProvider>
          <CartProvider>
            <ConnectionsProvider>
              {children}
              <FlowPlayerLoader />
            </ConnectionsProvider>
          </CartProvider>
        </CookieConsentProvider>
      </ImpersonationProvider>
    </ThemeProvider>
  );
}
