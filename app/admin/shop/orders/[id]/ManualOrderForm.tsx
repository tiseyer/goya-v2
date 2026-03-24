'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createManualOrder } from './actions';

type Product = {
  id: string;
  name: string | null;
  stripe_product_id: string | null;
};

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  stripe_customer_id: string | null;
};

type Props = {
  products: Product[];
  profiles: Profile[];
};

export default function ManualOrderForm({ products, profiles }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedProductId, setSelectedProductId] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [priceType, setPriceType] = useState<'one_time' | 'recurring'>('one_time');
  const [stripePriceId, setStripePriceId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // Filter profiles client-side
  const filteredProfiles = userSearch.trim()
    ? profiles.filter((p) => {
        const q = userSearch.toLowerCase();
        return (
          (p.full_name?.toLowerCase().includes(q) ?? false) ||
          (p.email?.toLowerCase().includes(q) ?? false)
        );
      })
    : profiles.slice(0, 20);

  const selectedProfile = profiles.find((p) => p.id === selectedUserId);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!selectedProductId || !selectedUserId || !stripePriceId) {
      setError('Please select a product, user, and enter a price ID.');
      return;
    }
    if (!selectedProduct?.stripe_product_id) {
      setError('Selected product has no Stripe product ID.');
      return;
    }

    startTransition(async () => {
      const result = await createManualOrder({
        userId: selectedUserId,
        productId: selectedProductId,
        stripeProductId: selectedProduct.stripe_product_id!,
        stripePriceId,
        priceType,
      });

      if (result.success) {
        router.push('/admin/shop/orders');
      } else {
        setError(result.error ?? 'Failed to create order.');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="px-4 py-2.5 rounded-lg text-sm font-medium bg-red-50 text-red-700 border border-red-200">
          {error}
        </div>
      )}

      {/* Product selector */}
      <div>
        <label className="block text-sm font-medium text-[#374151] mb-1">
          Product
        </label>
        <select
          value={selectedProductId}
          onChange={(e) => setSelectedProductId(e.target.value)}
          className="w-full h-10 px-3 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00B5A3]/30"
          required
        >
          <option value="">Select a product...</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name ?? p.id}
            </option>
          ))}
        </select>
        {selectedProduct?.stripe_product_id && (
          <p className="text-xs text-[#6B7280] mt-1">
            Stripe: <span className="font-mono">{selectedProduct.stripe_product_id}</span>
          </p>
        )}
      </div>

      {/* Price Type */}
      <div>
        <label className="block text-sm font-medium text-[#374151] mb-1">
          Price Type
        </label>
        <select
          value={priceType}
          onChange={(e) => setPriceType(e.target.value as 'one_time' | 'recurring')}
          className="w-full h-10 px-3 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00B5A3]/30"
        >
          <option value="one_time">One-time payment</option>
          <option value="recurring">Recurring subscription</option>
        </select>
      </div>

      {/* Stripe Price ID */}
      <div>
        <label className="block text-sm font-medium text-[#374151] mb-1">
          Stripe Price ID
        </label>
        <input
          type="text"
          value={stripePriceId}
          onChange={(e) => setStripePriceId(e.target.value)}
          placeholder="price_..."
          className="w-full h-10 px-3 border border-[#E5E7EB] rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#00B5A3]/30"
          required
        />
      </div>

      {/* User selector */}
      <div>
        <label className="block text-sm font-medium text-[#374151] mb-1">
          User
        </label>
        <input
          type="text"
          value={userSearch}
          onChange={(e) => {
            setUserSearch(e.target.value);
            setSelectedUserId('');
          }}
          placeholder="Search by name or email..."
          className="w-full h-10 px-3 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00B5A3]/30 mb-1"
        />
        {!selectedUserId && filteredProfiles.length > 0 && userSearch.trim() && (
          <ul className="border border-[#E5E7EB] rounded-lg bg-white shadow-sm divide-y divide-[#F1F5F9] max-h-48 overflow-y-auto">
            {filteredProfiles.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUserId(p.id);
                    setUserSearch(p.full_name ?? p.email ?? '');
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors"
                >
                  <p className="font-medium text-[#374151]">{p.full_name ?? '(no name)'}</p>
                  <p className="text-xs text-[#6B7280]">{p.email}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
        {selectedProfile && (
          <p className="text-xs text-[#6B7280] mt-1">
            Selected: <span className="font-medium">{selectedProfile.email}</span>
            {selectedProfile.stripe_customer_id ? (
              <span className="ml-1 text-emerald-600">(has Stripe customer)</span>
            ) : (
              <span className="ml-1 text-amber-600">(no Stripe customer — will be created)</span>
            )}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending || !selectedProductId || !selectedUserId || !stripePriceId}
        className="w-full h-10 px-4 text-sm font-semibold text-white bg-[#1B3A5C] rounded-lg hover:bg-[#1B3A5C]/90 transition-colors disabled:opacity-50"
      >
        {isPending ? 'Creating order...' : 'Create Order'}
      </button>
    </form>
  );
}
