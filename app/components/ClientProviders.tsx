'use client';

import { ThemeProvider } from 'next-themes';
import { CartProvider } from '@/app/context/CartContext';
import { ConnectionsProvider } from '@/app/context/ConnectionsContext';
import { ImpersonationProvider } from '@/app/context/ImpersonationContext';
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
        <CartProvider>
          <ConnectionsProvider>
            {children}
          </ConnectionsProvider>
        </CartProvider>
      </ImpersonationProvider>
    </ThemeProvider>
  );
}
