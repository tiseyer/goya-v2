import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { isProductVisible } from '@/lib/productVisibility'
import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'

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

// ─── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/addons/${product.slug}`}
      className="group bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden"
    >
      {/* Image area */}
      <div className="flex items-center justify-center pt-7 pb-4 px-4 bg-white min-h-[160px]">
        {product.image_path ? (
          <Image
            src={encodeURI(product.image_path)}
            alt={product.name}
            width={130}
            height={130}
            className="object-contain"
            unoptimized
          />
        ) : (
          <div className="w-[130px] h-[130px] bg-slate-100 rounded-xl flex items-center justify-center">
            <span className="text-xs text-slate-400">No image</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pb-5 flex flex-col flex-1 gap-2">
        <h3 className="text-sm font-bold text-[#1e3a5f] leading-snug group-hover:text-[#2d5a9e] transition-colors text-center">
          {product.name}
        </h3>
        <p className="text-xs text-slate-500 text-center leading-relaxed line-clamp-2 flex-1">
          {product.full_name}
        </p>
        <div className="text-center mt-1">
          <span className="text-slate-800 font-semibold text-sm">{product.price_display}</span>
        </div>
        <div className="mt-2 text-center">
          <span className="text-xs font-semibold text-slate-600 border border-slate-300 rounded-lg px-3 py-1.5 inline-block group-hover:border-[#1e3a5f] group-hover:text-[#1e3a5f] transition-colors">
            {product.has_variants ? 'Select Options' : 'Add to Profile'}
          </span>
        </div>
      </div>
    </Link>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default async function AddonsPage() {
  // 1. Get current user
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  // 2. Get profile with role and designations
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, designations')
    .eq('id', user.id)
    .single()

  // 3. Check if user is school owner (principal_trainer_id column)
  let isSchoolOwner = false
  try {
    const { count: schoolCount } = await supabase
      .from('schools')
      .select('id', { count: 'exact', head: true })
      .eq('principal_trainer_id', user.id)
    isSchoolOwner = (schoolCount ?? 0) > 0
  } catch {
    isSchoolOwner = false
  }

  // 4. Fetch all active products ordered by priority
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('priority', { ascending: true })

  // 5. Filter with visibility logic — admins/mods see everything
  const role = profile?.role ?? 'student'
  const isStaff = role === 'admin' || role === 'moderator'
  const userCtx = {
    role,
    designations: (profile?.designations ?? []) as string[],
    isSchoolOwner,
  }
  const visibleProducts = isStaff
    ? ((products ?? []) as Product[])
    : ((products ?? []) as Product[]).filter(p => isProductVisible(p, userCtx))

  return (
    <div className="min-h-screen bg-white">

      {/* Page header */}
      <div className="bg-[#F7F8FA] pt-20 pb-8 px-4 sm:px-6 lg:px-8 border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-[#6B7280] mb-5">
            <Link href="/" className="hover:text-[#1B3A5C] transition-colors">Home</Link>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-[#374151]">All Add-Ons &amp; Upgrades</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#1B3A5C]">All Add-Ons &amp; Upgrades</h1>
          <p className="mt-2 text-[#6B7280] text-sm max-w-2xl">
            Enhance your GOYA profile with verified designation badges, continuing education credits, and more.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="border-b border-slate-200 bg-white sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <p className="text-sm text-slate-500">
            Showing <span className="font-semibold text-slate-800">{visibleProducts.length}</span> products
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {visibleProducts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-500 text-sm">No products available for your account at this time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {visibleProducts.map(p => <ProductCard key={p.slug} product={p} />)}
          </div>
        )}
      </div>
    </div>
  )
}
