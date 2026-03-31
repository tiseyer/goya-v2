import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { isProductVisible } from '@/lib/productVisibility'
import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import PageHero from '@/app/components/PageHero'
import SchoolRegistrationCTA from '@/app/components/SchoolRegistrationCTA'

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

function ProductCard({ product, upgradeHref }: { product: Product; upgradeHref?: string }) {
  const isTeacherMembership = product.name.toLowerCase().includes('teacher') && product.name.toLowerCase().includes('membership')
  return (
    <Link
      href={upgradeHref ?? `/addons/${product.slug}`}
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
        <h3 className="text-sm font-bold text-primary-dark leading-snug group-hover:text-primary transition-colors text-center">
          {product.name}
        </h3>
        <p className="text-xs text-slate-500 text-center leading-relaxed line-clamp-2 flex-1">
          {product.full_name}
        </p>
        <div className="text-center mt-1">
          <span className="text-slate-800 font-semibold text-sm">{product.price_display}</span>
        </div>
        <div className="mt-2 text-center">
          <span className="text-xs font-semibold text-slate-600 border border-slate-300 rounded-lg px-3 py-1.5 inline-block group-hover:border-primary-dark group-hover:text-primary-dark transition-colors">
            {product.has_variants ? 'Select Options' : (isTeacherMembership ? 'Upgrade' : 'Add to Profile')}
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

  // Check for pending upgrade request
  let hasPendingUpgrade = false
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: pendingUpgrade } = await supabase
      .from('upgrade_requests')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .maybeSingle()
    hasPendingUpgrade = pendingUpgrade !== null
  } catch {
    hasPendingUpgrade = false
  }

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

  // Filter Teacher Membership: show only for eligible roles without a pending request
  const isUpgradeEligible = role === 'student' || role === 'wellness_practitioner'
  const TEACHER_MEMBERSHIP_PRODUCT_ID = 'prod_UCTigELsOhovuE'
  const filteredProducts = visibleProducts.filter(p => {
    // Teacher Membership: match by Stripe product ID or by name (fallback for un-provisioned products)
    const isTeacherMembership =
      (p as Product & { stripe_product_id?: string }).stripe_product_id === TEACHER_MEMBERSHIP_PRODUCT_ID ||
      (p.name.toLowerCase().includes('teacher') && p.name.toLowerCase().includes('membership'))
    if (isTeacherMembership) {
      return isUpgradeEligible && !hasPendingUpgrade && !isStaff
    }
    return true
  })

  return (
    <div className="min-h-screen bg-white">

      <PageHero
        variant="dark"
        pill="Brightcoms"
        title="All Add-Ons & Upgrades"
        subtitle="Enhance your GOYA profile with verified designation badges, continuing education credits, and more."
      />

      {/* School Registration Banner — teachers without a school */}
      {role === 'teacher' && !isSchoolOwner && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <SchoolRegistrationCTA variant="banner" />
        </div>
      )}

      {/* Toolbar */}
      <div className="border-b border-slate-200 bg-white sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <p className="text-sm text-slate-500">
            Showing <span className="font-semibold text-slate-800">{filteredProducts.length}</span> products
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-500 text-sm">No products available for your account at this time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {filteredProducts.map(p => {
              const isTeacherMembershipProduct =
                (p as Product & { stripe_product_id?: string }).stripe_product_id === TEACHER_MEMBERSHIP_PRODUCT_ID ||
                (p.name.toLowerCase().includes('teacher') && p.name.toLowerCase().includes('membership'))
              return (
                <ProductCard
                  key={p.slug}
                  product={p}
                  upgradeHref={isTeacherMembershipProduct ? '/upgrade' : undefined}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
