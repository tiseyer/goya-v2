import { createSupabaseServerClient } from '@/lib/supabaseServer'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import FileUploadSection from '@/app/addons/FileUploadSection'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Product {
  id: string
  slug: string
  name: string
  full_name: string
  category: string
  price_display: string
  price_cents: number | null
  image_path: string | null
  description: string | null
  features: Array<{ label: string; text: string }>
  requires_any_of: string[]
  hidden_if_has_any: string[]
  has_variants: boolean
  variants: Record<string, { label: string; options: string[] }> | { type: string; label: string; options: string[] }
  priority: number
  is_active: boolean
}

interface RelatedProduct {
  slug: string
  name: string
  full_name: string
  image_path: string | null
  price_display: string
}

// ─── Variant selects (client-friendly static render) ─────────────────────────

function ExperienceYearsVariants({ product }: { product: Product }) {
  const v = product.variants as { type: string; label: string; options: string[] }
  return (
    <div className="mb-6">
      <label className="block text-sm font-semibold text-[#1e3a5f] mb-2">Select Experience Level</label>
      <select className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]">
        {(v.options ?? []).map(opt => (
          <option key={opt}>{opt}</option>
        ))}
      </select>
    </div>
  )
}

function GivingTreeVariants({ product }: { product: Product }) {
  const v = product.variants as Record<string, { label: string; options: string[] }>
  return (
    <div className="mb-6 space-y-3">
      {Object.entries(v).map(([key, variant]) => (
        <div key={key}>
          <label className="block text-sm font-semibold text-[#1e3a5f] mb-2">{variant.label}</label>
          <select className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]">
            {variant.options.map(opt => <option key={opt}>{opt}</option>)}
          </select>
        </div>
      ))}
    </div>
  )
}

// ─── Detail page ──────────────────────────────────────────────────────────────

export default async function AddonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: slug } = await params
  const supabase = await createSupabaseServerClient()

  // Fetch product by slug
  const { data: productRaw } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!productRaw) notFound()

  const product = productRaw as Product

  // Related products (same category, different slug, active, ordered by priority, limit 4)
  const { data: relatedRaw } = await supabase
    .from('products')
    .select('slug, name, full_name, image_path, price_display')
    .eq('is_active', true)
    .eq('category', product.category)
    .neq('slug', slug)
    .order('priority', { ascending: true })
    .limit(4)

  const related = (relatedRaw ?? []) as RelatedProduct[]

  const features = (product.features ?? []) as Array<{ label: string; text: string }>
  const headingLabel = `GOYA ${product.full_name.toUpperCase()} ADD-ON`

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb bar */}
      <div className="border-b border-slate-100 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-xs text-slate-500">
            <Link href="/" className="hover:text-[#1e3a5f] transition-colors">Home</Link>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <Link href="/addons" className="hover:text-[#1e3a5f] transition-colors">All Add-Ons &amp; Upgrades</Link>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-slate-800 font-medium">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row gap-12 lg:gap-16">

          {/* Left: Image */}
          <div className="flex flex-col items-center gap-4 md:w-72 shrink-0">
            <div className="bg-slate-50 rounded-2xl border border-slate-100 p-8 flex items-center justify-center w-full">
              {product.image_path ? (
                <Image
                  src={encodeURI(product.image_path)}
                  alt={product.name}
                  width={240}
                  height={240}
                  className="object-contain"
                  unoptimized
                />
              ) : (
                <div className="w-[240px] h-[240px] bg-slate-100 rounded-xl flex items-center justify-center">
                  <span className="text-sm text-slate-400">No image</span>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-400 text-center max-w-[200px] leading-relaxed">
              This badge will appear on your public GOYA member profile upon verification approval.
            </p>
          </div>

          {/* Right: Details */}
          <div className="flex-1 min-w-0">
            {/* Designation heading */}
            <p className="text-xs font-bold tracking-widest text-[#8b1a1a] uppercase mb-2">
              {headingLabel}
            </p>

            {/* Product name */}
            <h1 className="text-3xl font-bold text-[#1e3a5f] mb-4">{product.name}</h1>

            {/* Price */}
            <div className="mb-6">
              <span className="text-2xl font-bold text-[#1e3a5f]">{product.price_display}</span>
            </div>

            <hr className="border-slate-100 mb-6" />

            {/* Features list */}
            {features.length > 0 && (
              <ul className="space-y-3 mb-6">
                {features.map((feat, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <svg className="w-4 h-4 text-[#1e3a5f] mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-slate-700 leading-relaxed">
                      <span className="font-semibold text-[#8b1a1a]">{feat.label}</span>{' '}
                      {feat.text}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {/* Description */}
            {product.description && (
              <div className="mb-8">
                <p className="text-sm text-slate-600 leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Variants */}
            {product.has_variants && product.slug === 'experience-years' && (
              <ExperienceYearsVariants product={product} />
            )}
            {product.has_variants && product.slug === 'giving-tree' && (
              <GivingTreeVariants product={product} />
            )}

            {/* File upload */}
            <FileUploadSection />

            {/* CTA */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <button
                disabled
                title="Payment processing coming soon"
                className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold bg-[#1e3a5f] text-white opacity-60 cursor-not-allowed shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add to Profile
              </button>
              <Link href="/addons" className="text-sm text-slate-500 hover:text-[#1e3a5f] transition-colors">
                ← Back to all add-ons
              </Link>
            </div>
            <p className="mt-4 text-xs text-slate-400">Payment processing coming soon.</p>
          </div>
        </div>
      </div>

      {/* Related products row */}
      {related.length > 0 && (
        <div className="border-t border-slate-100 bg-slate-50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-base font-bold text-[#1e3a5f] mb-6">More Add-Ons &amp; Upgrades</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {related.map(r => (
                <Link key={r.slug} href={`/addons/${r.slug}`}
                  className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col items-center gap-2 hover:shadow-md hover:border-[#1e3a5f]/20 transition-all group">
                  {r.image_path && (
                    <Image src={encodeURI(r.image_path)} alt={r.name} width={90} height={90} className="object-contain" unoptimized />
                  )}
                  <p className="text-xs font-bold text-[#1e3a5f] text-center group-hover:text-[#2d5a9e] transition-colors">{r.name}</p>
                  <p className="text-xs text-slate-500">{r.price_display}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
