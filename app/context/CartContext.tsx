'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Items that allow quantity > 1
export const VARIABLE_QTY_IDS = ['experience-years', 'giving-tree-donation'];

export interface CartItem {
  id: string;
  name: string;
  acronym: string;
  badgeLines: string[];
  price: number;
  priceType: string;
  signUpFee?: number;
  quantity: number;
}

export interface SavedOrder {
  orderNumber: string;
  date: string;
  items: CartItem[];
  subtotal: number;
  signUpFees: number;
  total: number;
  customer: { firstName: string; lastName: string; email: string; country: string };
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  setQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  totalSignUpFees: number;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('goya-cart');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('goya-cart', JSON.stringify(items));
  }, [items]);

  const addItem = (item: Omit<CartItem, 'quantity'>) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        if (VARIABLE_QTY_IDS.includes(item.id)) {
          return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
        }
        return prev; // max 1 for standard items
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

  const setQuantity = (id: string, qty: number) => {
    if (qty < 1) { removeItem(id); return; }
    if (!VARIABLE_QTY_IDS.includes(id)) return;
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i));
  };

  const clearCart = () => setItems([]);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal  = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const totalSignUpFees = items.reduce((sum, i) => sum + (i.signUpFee ?? 0), 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, setQuantity, clearCart, itemCount, subtotal, totalSignUpFees }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
