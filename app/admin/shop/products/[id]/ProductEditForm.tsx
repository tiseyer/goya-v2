'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  createProduct,
  editProduct,
  updateProductPrice,
  updateProductVisibility,
} from '../actions'

type ProductData = {
  id: string
  name: string
  slug: string | null
  stripe_product_id: string | null
  is_active: boolean
  requires_any_of: string[] | null
  hidden_if_has_any: string[] | null
  priority: number | null
  image_path: string | null
}

type StripeProductData = {
  stripe_id: string
  name: string | null
  description: string | null
  active: boolean | null
  images: string[] | null
  metadata: Record<string, string> | null
  statement_descriptor?: string | null
  unit_label?: string | null
  marketing_features?: string[] | null
}

type StripePriceData = {
  stripe_id: string
  stripe_product_id: string
  currency: string | null
  unit_amount: number | null
  type: string | null
  interval: string | null
  active: boolean | null
}

type AllProduct = {
  id: string
  name: string
  stripe_product_id: string | null
}

type Props = {
  product: ProductData | null
  stripeProduct: StripeProductData | null
  activePrice: StripePriceData | null
  allProducts: AllProduct[]
}

function formatPrice(amountCents: number, currency: string, type: string, interval: string | null): string {
  const dollars = (amountCents / 100).toFixed(2)
  const currencySymbol = currency.toLowerCase() === 'usd' ? '$' : currency.toUpperCase()
  if (type === 'recurring' && interval) {
    return `${currencySymbol}${dollars}/${interval}`
  }
  return `${currencySymbol}${dollars}`
}

// ——————————————————————————————————————————
// Basic Info Section
// ——————————————————————————————————————————
function BasicInfoSection({
  stripeProductId,
  initialName,
  initialDescription,
  initialImages,
}: {
  stripeProductId: string | null
  initialName: string
  initialDescription: string
  initialImages: string[]
}) {
  const [name, setName] = useState(initialName)
  const [description, setDescription] = useState(initialDescription)
  const [images, setImages] = useState<string[]>(
    initialImages.length > 0 ? initialImages : ['', '', '', '', ''],
  )
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleImageChange(index: number, value: string) {
    const next = [...images]
    next[index] = value
    setImages(next)
  }

  function handleSave() {
    if (!stripeProductId) return
    setError(null)
    setSaved(false)
    startTransition(async () => {
      try {
        const activeImages = images.filter(Boolean)
        await editProduct(stripeProductId, {
          name,
          description,
          images: activeImages,
        })
        setSaved(true)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Save failed')
      }
    })
  }

  return (
    <section className="bg-white rounded-xl border border-[#E5E7EB] p-6 mb-6">
      <h2 className="text-base font-semibold text-[#1B3A5C] mb-4">Basic Info</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#374151] mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4E87A0] focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#374151] mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4E87A0] focus:border-transparent resize-y"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#374151] mb-1">
            Featured Image URL
          </label>
          <input
            type="url"
            value={images[0] ?? ''}
            onChange={(e) => handleImageChange(0, e.target.value)}
            placeholder="https://..."
            className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4E87A0] focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#374151] mb-2">
            Additional Images (up to 4)
          </label>
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <input
                key={i}
                type="url"
                value={images[i] ?? ''}
                onChange={(e) => handleImageChange(i, e.target.value)}
                placeholder={`Image ${i + 1} URL`}
                className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4E87A0] focus:border-transparent"
              />
            ))}
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && <p className="text-sm text-emerald-600">Saved successfully.</p>}
        {stripeProductId && (
          <button
            type="button"
            disabled={isPending}
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-[#1B3A5C] text-white hover:bg-[#4E87A0] transition-colors disabled:opacity-50"
          >
            {isPending ? 'Saving...' : 'Save Basic Info'}
          </button>
        )}
        {!stripeProductId && (
          <p className="text-xs text-[#6B7280]">
            Save the product first to enable editing these fields in Stripe.
          </p>
        )}
      </div>
    </section>
  )
}

// ——————————————————————————————————————————
// Price Section
// ——————————————————————————————————————————
function PriceSection({
  stripeProductId,
  activePrice,
}: {
  stripeProductId: string | null
  activePrice: StripePriceData | null
}) {
  const [showChangeForm, setShowChangeForm] = useState(false)
  const [newAmountDollars, setNewAmountDollars] = useState('')
  const [priceType, setPriceType] = useState<'one_time' | 'recurring'>('one_time')
  const [interval, setInterval] = useState<'month' | 'year'>('month')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  function handleChangePriceSubmit() {
    if (!stripeProductId || !activePrice) return
    const cents = Math.round(parseFloat(newAmountDollars) * 100)
    if (isNaN(cents) || cents <= 0) {
      setError('Please enter a valid amount.')
      return
    }
    setError(null)
    setSaved(false)
    startTransition(async () => {
      try {
        await updateProductPrice(
          stripeProductId,
          activePrice.stripe_id,
          cents,
          'usd',
          priceType,
          priceType === 'recurring' ? interval : undefined,
        )
        setSaved(true)
        setShowChangeForm(false)
        setNewAmountDollars('')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Price change failed')
      }
    })
  }

  return (
    <section className="bg-white rounded-xl border border-[#E5E7EB] p-6 mb-6">
      <h2 className="text-base font-semibold text-[#1B3A5C] mb-4">Price</h2>

      {activePrice && activePrice.unit_amount != null ? (
        <div className="space-y-4">
          {/* Current price — READ-ONLY display */}
          <div className="flex items-center gap-3 p-3 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
            <span className="text-sm font-medium text-[#374151]">Current price:</span>
            <span className="text-sm font-semibold text-[#1B3A5C]">
              {formatPrice(
                activePrice.unit_amount,
                activePrice.currency ?? 'usd',
                activePrice.type ?? 'one_time',
                activePrice.interval,
              )}
            </span>
            <span className="text-xs text-[#6B7280] bg-[#E5E7EB] px-2 py-0.5 rounded">
              {activePrice.stripe_id}
            </span>
          </div>
          <p className="text-xs text-[#6B7280]">
            Stripe prices are immutable. Changing the price creates a new Stripe Price and archives the
            current one.
          </p>

          {!showChangeForm && (
            <button
              type="button"
              onClick={() => setShowChangeForm(true)}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-[#1B3A5C] text-[#1B3A5C] hover:bg-[#1B3A5C] hover:text-white transition-colors"
            >
              Change Price
            </button>
          )}

          {showChangeForm && (
            <div className="border border-[#E5E7EB] rounded-lg p-4 space-y-4 bg-amber-50">
              <p className="text-xs font-medium text-amber-700">
                This will create a new Stripe Price and archive the current one.
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1">
                    New Amount (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280] text-sm">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={newAmountDollars}
                      onChange={(e) => setNewAmountDollars(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-7 pr-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4E87A0] focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1">Type</label>
                  <select
                    value={priceType}
                    onChange={(e) => setPriceType(e.target.value as 'one_time' | 'recurring')}
                    className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4E87A0] focus:border-transparent"
                  >
                    <option value="one_time">One-time</option>
                    <option value="recurring">Recurring</option>
                  </select>
                </div>
                {priceType === 'recurring' && (
                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-1">Interval</label>
                    <select
                      value={interval}
                      onChange={(e) => setInterval(e.target.value as 'month' | 'year')}
                      className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4E87A0] focus:border-transparent"
                    >
                      <option value="month">Monthly</option>
                      <option value="year">Yearly</option>
                    </select>
                  </div>
                )}
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              {saved && <p className="text-sm text-emerald-600">Price updated successfully.</p>}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleChangePriceSubmit}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-[#1B3A5C] text-white hover:bg-[#4E87A0] transition-colors disabled:opacity-50"
                >
                  {isPending ? 'Saving...' : 'Confirm Price Change'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowChangeForm(false)
                    setError(null)
                  }}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-[#E5E7EB] text-[#374151] hover:border-[#1B3A5C] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-[#6B7280]">
          {stripeProductId
            ? 'No active price found for this product.'
            : 'Price will be set when creating the product in Stripe.'}
        </p>
      )}
    </section>
  )
}

// ——————————————————————————————————————————
// More Options Section (collapsible)
// ——————————————————————————————————————————
function MoreOptionsSection({
  stripeProductId,
  initialStatementDescriptor,
  initialUnitLabel,
  initialMetadata,
  initialMarketingFeatures,
}: {
  stripeProductId: string | null
  initialStatementDescriptor: string
  initialUnitLabel: string
  initialMetadata: Record<string, string>
  initialMarketingFeatures: string[]
}) {
  const [open, setOpen] = useState(false)
  const [statementDescriptor, setStatementDescriptor] = useState(initialStatementDescriptor)
  const [unitLabel, setUnitLabel] = useState(initialUnitLabel)
  const [metadata, setMetadata] = useState<Array<{ key: string; value: string }>>(
    Object.entries(initialMetadata).map(([key, value]) => ({ key, value })),
  )
  const [marketingFeatures, setMarketingFeatures] = useState<string[]>(initialMarketingFeatures)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function addMetadataRow() {
    setMetadata((prev) => [...prev, { key: '', value: '' }])
  }

  function removeMetadataRow(index: number) {
    setMetadata((prev) => prev.filter((_, i) => i !== index))
  }

  function updateMetadataRow(index: number, field: 'key' | 'value', val: string) {
    setMetadata((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: val } : row)))
  }

  function addFeature() {
    setMarketingFeatures((prev) => [...prev, ''])
  }

  function removeFeature(index: number) {
    setMarketingFeatures((prev) => prev.filter((_, i) => i !== index))
  }

  function updateFeature(index: number, val: string) {
    setMarketingFeatures((prev) => prev.map((f, i) => (i === index ? val : f)))
  }

  function handleSave() {
    if (!stripeProductId) return
    setError(null)
    setSaved(false)
    const metaObj: Record<string, string> = {}
    for (const { key, value } of metadata) {
      if (key.trim()) metaObj[key.trim()] = value
    }
    startTransition(async () => {
      try {
        await editProduct(stripeProductId, {
          statementDescriptor: statementDescriptor || undefined,
          unitLabel: unitLabel || undefined,
          metadata: metaObj,
          marketingFeatures: marketingFeatures.filter(Boolean),
        })
        setSaved(true)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Save failed')
      }
    })
  }

  return (
    <section className="bg-white rounded-xl border border-[#E5E7EB] mb-6">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-6 py-4 text-left"
      >
        <h2 className="text-base font-semibold text-[#1B3A5C]">More Options</h2>
        <span className="text-[#6B7280] text-sm">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-6 pb-6 space-y-4 border-t border-[#E5E7EB] pt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1">
                Statement Descriptor{' '}
                <span className="text-[#9CA3AF] font-normal">(max 22 chars)</span>
              </label>
              <input
                type="text"
                maxLength={22}
                value={statementDescriptor}
                onChange={(e) => setStatementDescriptor(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4E87A0] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1">Unit Label</label>
              <input
                type="text"
                value={unitLabel}
                onChange={(e) => setUnitLabel(e.target.value)}
                placeholder="e.g. seat, license"
                className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4E87A0] focus:border-transparent"
              />
            </div>
          </div>

          {/* Metadata */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-[#374151]">
                Metadata (key-value)
              </label>
              <button
                type="button"
                onClick={addMetadataRow}
                className="text-xs text-[#4E87A0] hover:text-[#1B3A5C] font-medium"
              >
                + Add Row
              </button>
            </div>
            <div className="space-y-2">
              {metadata.map((row, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={row.key}
                    onChange={(e) => updateMetadataRow(i, 'key', e.target.value)}
                    placeholder="Key"
                    className="flex-1 px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4E87A0] focus:border-transparent"
                  />
                  <input
                    type="text"
                    value={row.value}
                    onChange={(e) => updateMetadataRow(i, 'value', e.target.value)}
                    placeholder="Value"
                    className="flex-1 px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4E87A0] focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => removeMetadataRow(i)}
                    className="text-[#9CA3AF] hover:text-red-500 transition-colors text-lg leading-none px-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Marketing Features */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-[#374151]">
                Marketing Features
              </label>
              <button
                type="button"
                onClick={addFeature}
                className="text-xs text-[#4E87A0] hover:text-[#1B3A5C] font-medium"
              >
                + Add Feature
              </button>
            </div>
            <div className="space-y-2">
              {marketingFeatures.map((feature, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={feature}
                    onChange={(e) => updateFeature(i, e.target.value)}
                    placeholder="e.g. Unlimited access"
                    className="flex-1 px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4E87A0] focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => removeFeature(i)}
                    className="text-[#9CA3AF] hover:text-red-500 transition-colors text-lg leading-none px-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {saved && <p className="text-sm text-emerald-600">Options saved successfully.</p>}
          {stripeProductId && (
            <button
              type="button"
              disabled={isPending}
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-[#1B3A5C] text-white hover:bg-[#4E87A0] transition-colors disabled:opacity-50"
            >
              {isPending ? 'Saving...' : 'Save Options'}
            </button>
          )}
        </div>
      )}
    </section>
  )
}

// ——————————————————————————————————————————
// Visibility Section
// ——————————————————————————————————————————
function VisibilitySection({
  productId,
  allProducts,
  initialRequiresAnyOf,
  initialHiddenIfHasAny,
}: {
  productId: string
  allProducts: AllProduct[]
  initialRequiresAnyOf: string[]
  initialHiddenIfHasAny: string[]
}) {
  const [showToSearch, setShowToSearch] = useState('')
  const [dontShowSearch, setDontShowSearch] = useState('')
  const [requiresAnyOf, setRequiresAnyOf] = useState<string[]>(initialRequiresAnyOf)
  const [hiddenIfHasAny, setHiddenIfHasAny] = useState<string[]>(initialHiddenIfHasAny)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filter out current product from the lists
  const otherProducts = allProducts.filter((p) => p.id !== productId)

  const showToFiltered = otherProducts.filter((p) =>
    p.name.toLowerCase().includes(showToSearch.toLowerCase()),
  )
  const dontShowFiltered = otherProducts.filter((p) =>
    p.name.toLowerCase().includes(dontShowSearch.toLowerCase()),
  )

  function toggleRequires(id: string) {
    setRequiresAnyOf((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  function toggleHidden(id: string) {
    setHiddenIfHasAny((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  function handleSave() {
    setError(null)
    setSaved(false)
    startTransition(async () => {
      try {
        await updateProductVisibility(productId, requiresAnyOf, hiddenIfHasAny)
        setSaved(true)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Save failed')
      }
    })
  }

  return (
    <section className="bg-white rounded-xl border border-[#E5E7EB] p-6 mb-6">
      <h2 className="text-base font-semibold text-[#1B3A5C] mb-1">Visibility Rules</h2>
      <p className="text-xs text-[#6B7280] mb-4">
        Control who can see this product based on what they already own.
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Show To */}
        <div>
          <label className="block text-sm font-medium text-[#374151] mb-1">
            Show to{' '}
            <span className="font-normal text-[#9CA3AF]">
              (user must own at least one of these)
            </span>
          </label>
          <input
            type="text"
            value={showToSearch}
            onChange={(e) => setShowToSearch(e.target.value)}
            placeholder="Filter products..."
            className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4E87A0] focus:border-transparent mb-2"
          />
          <div className="border border-[#E5E7EB] rounded-lg overflow-y-auto max-h-48 divide-y divide-[#F3F4F6]">
            {showToFiltered.length === 0 ? (
              <p className="px-3 py-2 text-xs text-[#9CA3AF]">No products found.</p>
            ) : (
              showToFiltered.map((p) => (
                <label
                  key={p.id}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={requiresAnyOf.includes(p.id)}
                    onChange={() => toggleRequires(p.id)}
                    className="rounded border-[#D1D5DB] text-[#4E87A0] focus:ring-[#4E87A0]"
                  />
                  <span className="text-sm text-[#374151]">{p.name}</span>
                </label>
              ))
            )}
          </div>
          {requiresAnyOf.length > 0 && (
            <p className="mt-1 text-xs text-[#6B7280]">
              {requiresAnyOf.length} product{requiresAnyOf.length !== 1 ? 's' : ''} selected
            </p>
          )}
        </div>

        {/* Don't Show To */}
        <div>
          <label className="block text-sm font-medium text-[#374151] mb-1">
            Don&apos;t show to{' '}
            <span className="font-normal text-[#9CA3AF]">
              (hidden if user owns any of these — veto overrides)
            </span>
          </label>
          <input
            type="text"
            value={dontShowSearch}
            onChange={(e) => setDontShowSearch(e.target.value)}
            placeholder="Filter products..."
            className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4E87A0] focus:border-transparent mb-2"
          />
          <div className="border border-[#E5E7EB] rounded-lg overflow-y-auto max-h-48 divide-y divide-[#F3F4F6]">
            {dontShowFiltered.length === 0 ? (
              <p className="px-3 py-2 text-xs text-[#9CA3AF]">No products found.</p>
            ) : (
              dontShowFiltered.map((p) => (
                <label
                  key={p.id}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={hiddenIfHasAny.includes(p.id)}
                    onChange={() => toggleHidden(p.id)}
                    className="rounded border-[#D1D5DB] text-[#4E87A0] focus:ring-[#4E87A0]"
                  />
                  <span className="text-sm text-[#374151]">{p.name}</span>
                </label>
              ))
            )}
          </div>
          {hiddenIfHasAny.length > 0 && (
            <p className="mt-1 text-xs text-[#6B7280]">
              {hiddenIfHasAny.length} product{hiddenIfHasAny.length !== 1 ? 's' : ''} selected
            </p>
          )}
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {saved && <p className="mt-3 text-sm text-emerald-600">Visibility rules saved.</p>}
      <button
        type="button"
        disabled={isPending}
        onClick={handleSave}
        className="mt-4 px-4 py-2 text-sm font-medium rounded-lg bg-[#1B3A5C] text-white hover:bg-[#4E87A0] transition-colors disabled:opacity-50"
      >
        {isPending ? 'Saving...' : 'Save Visibility Rules'}
      </button>
    </section>
  )
}

// ——————————————————————————————————————————
// New Product Creation Form
// ——————————————————————————————————————————
function CreateProductSection({ allProducts }: { allProducts: AllProduct[] }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [priceDollars, setPriceDollars] = useState('')
  const [priceType, setPriceType] = useState<'one_time' | 'recurring'>('one_time')
  const [interval, setInterval] = useState<'month' | 'year'>('month')
  const [imagePath, setImagePath] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // We need a product ID — for new products we generate one client-side
  // In practice, the product row should be created server-side first.
  // Here we assume a product row exists with id='new' as a placeholder,
  // and createProduct will update it. For full flow, a server action
  // can create the local product row first and return its ID.

  function handleCreate() {
    const cents = Math.round(parseFloat(priceDollars) * 100)
    if (!name.trim()) {
      setError('Product name is required.')
      return
    }
    if (isNaN(cents) || cents <= 0) {
      setError('Please enter a valid price.')
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        // For new products, we create a temporary ID here.
        // In a full production flow, you'd create the local row first via a separate server action.
        const tempId = crypto.randomUUID()
        await createProduct({
          productId: tempId,
          name,
          description,
          priceCents: cents,
          priceType,
          interval: priceType === 'recurring' ? interval : undefined,
          imagePath: imagePath || undefined,
        })
        router.push('/admin/shop/products')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Creation failed')
      }
    })
  }

  // Suppress unused variable warning — allProducts passed for future visibility config
  void allProducts

  return (
    <section className="bg-white rounded-xl border border-[#E5E7EB] p-6 mb-6">
      <h2 className="text-base font-semibold text-[#1B3A5C] mb-4">Create New Product</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#374151] mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4E87A0] focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#374151] mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4E87A0] focus:border-transparent resize-y"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#374151] mb-1">Featured Image URL</label>
          <input
            type="url"
            value={imagePath}
            onChange={(e) => setImagePath(e.target.value)}
            placeholder="https://..."
            className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4E87A0] focus:border-transparent"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1">
              Price (USD) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280] text-sm">$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={priceDollars}
                onChange={(e) => setPriceDollars(e.target.value)}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4E87A0] focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1">Price Type</label>
            <select
              value={priceType}
              onChange={(e) => setPriceType(e.target.value as 'one_time' | 'recurring')}
              className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4E87A0] focus:border-transparent"
            >
              <option value="one_time">One-time</option>
              <option value="recurring">Recurring</option>
            </select>
          </div>
          {priceType === 'recurring' && (
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1">Interval</label>
              <select
                value={interval}
                onChange={(e) => setInterval(e.target.value as 'month' | 'year')}
                className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4E87A0] focus:border-transparent"
              >
                <option value="month">Monthly</option>
                <option value="year">Yearly</option>
              </select>
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="button"
          disabled={isPending}
          onClick={handleCreate}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-[#1B3A5C] text-white hover:bg-[#4E87A0] transition-colors disabled:opacity-50"
        >
          {isPending ? 'Creating...' : 'Create Product in Stripe'}
        </button>
      </div>
    </section>
  )
}

// ——————————————————————————————————————————
// Main ProductEditForm
// ——————————————————————————————————————————
export default function ProductEditForm({ product, stripeProduct, activePrice, allProducts }: Props) {
  // New product flow
  if (!product) {
    return <CreateProductSection allProducts={allProducts} />
  }

  const stripeProductId = product.stripe_product_id

  return (
    <div>
      {/* Basic Info */}
      <BasicInfoSection
        stripeProductId={stripeProductId}
        initialName={stripeProduct?.name ?? product.name}
        initialDescription={stripeProduct?.description ?? ''}
        initialImages={stripeProduct?.images ?? (product.image_path ? [product.image_path] : [])}
      />

      {/* Price */}
      <PriceSection stripeProductId={stripeProductId} activePrice={activePrice} />

      {/* More Options */}
      <MoreOptionsSection
        stripeProductId={stripeProductId}
        initialStatementDescriptor={stripeProduct?.statement_descriptor ?? ''}
        initialUnitLabel={stripeProduct?.unit_label ?? ''}
        initialMetadata={stripeProduct?.metadata ?? {}}
        initialMarketingFeatures={stripeProduct?.marketing_features ?? []}
      />

      {/* Visibility Rules */}
      <VisibilitySection
        productId={product.id}
        allProducts={allProducts}
        initialRequiresAnyOf={product.requires_any_of ?? []}
        initialHiddenIfHasAny={product.hidden_if_has_any ?? []}
      />
    </div>
  )
}
