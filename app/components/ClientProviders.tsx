'use client';

import { CartProvider } from '@/app/context/CartContext';
import { ConnectionsProvider } from '@/app/context/ConnectionsContext';
import { ReactNode } from 'react';

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <ConnectionsProvider>
        {children}
      </ConnectionsProvider>
    </CartProvider>
  );
}
