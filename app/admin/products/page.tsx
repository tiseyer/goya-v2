import { createSupabaseServerClient } from '@/lib/supabaseServer'
import AdminProductsClient from './AdminProductsClient'

export default async function AdminProductsPage() {
  const supabase = await createSupabaseServerClient()

  const { data: products } = await supabase
    .from('products')
    .select('id, slug, name, full_name, category, price_display, image_path, priority, is_active')
    .order('priority', { ascending: true })

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1B3A5C]">Products &amp; Add-Ons</h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Manage designation products, set display priority, and enable or disable items.
        </p>
      </div>

      <AdminProductsClient initialProducts={products ?? []} />
    </div>
  )
}
