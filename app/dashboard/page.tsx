import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: state } = await supabase
    .from('onboarding_state')
    .select('onboarding_complete')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!state?.onboarding_complete) {
    redirect('/onboarding')
  }

  return (
    <div className="bg-slate-50 text-slate-900">
      <main className="mx-auto max-w-screen-xl px-6 lg:px-12">
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <h1 className="text-2xl">Dashboard</h1>
            <p className="text-slate-600">Logged in as: {user.email}</p>

            <form action="/logout" method="post">
              <button
                className="w-full rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:opacity-50"
                style={{ backgroundColor: '#0f172a', color: '#ffffff' }}
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
