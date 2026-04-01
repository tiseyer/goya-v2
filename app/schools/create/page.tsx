import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import PageContainer from '@/app/components/ui/PageContainer'
import SchoolCreateWizard from './SchoolCreateWizard'

interface Product {
  slug: string
  name: string
  full_name: string
  image_path: string
  price_cents: number
}

export default async function SchoolCreatePage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/sign-in')
  }

  // Role gate: teachers only, and only if they don't already have a school
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, principal_trainer_school_id')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'teacher' && profile.role !== 'admin')) {
    redirect('/dashboard')
  }

  if (profile.principal_trainer_school_id) {
    redirect('/dashboard')
  }

  // Fetch designation products
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: products } = await (supabase as any)
    .from('products')
    .select('slug, name, full_name, image_path, price_cents')
    .eq('category', 'school_designation')
    .order('priority') as { data: Product[] | null }

  return (
    <div className="min-h-screen bg-[#F7F8FA] py-12">
      <PageContainer>
        <Suspense fallback={<div className="animate-pulse h-96 bg-white rounded-2xl" />}>
          <SchoolCreateWizard products={products ?? []} />
        </Suspense>
      </PageContainer>
    </div>
  )
}
