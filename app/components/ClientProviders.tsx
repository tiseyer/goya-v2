'use client';

import { ThemeProvider } from 'next-themes';
import { CartProvider } from '@/app/context/CartContext';
import { ConnectionsProvider } from '@/app/context/ConnectionsContext';
import { ImpersonationProvider } from '@/app/context/ImpersonationContext';
import { CookieConsentProvider } from '@/app/context/CookieConsentContext';
import type { ImpersonationState } from '@/lib/impersonation';
import { ReactNode } from 'react';

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
            </ConnectionsProvider>
          </CartProvider>
        </CookieConsentProvider>
      </ImpersonationProvider>
    </ThemeProvider>
  );
}
