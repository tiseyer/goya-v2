import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

export default async function Home() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { data: state } = await supabase
      .from('onboarding_state')
      .select('onboarding_complete')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!state?.onboarding_complete) {
      redirect('/onboarding')
    }
  }

  return (
    <div className="bg-slate-50 text-slate-900">
      <main className="mx-auto max-w-screen-xl px-6 lg:px-12">
        <div className="flex items-center justify-center py-12">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 space-y-4 text-center shadow-sm">
        <h1 className="text-2xl font-semibold">GOYA</h1>

        {user ? (
          <>
            <p className="text-sm text-slate-600">Logged in as {user.email}</p>
            <Link className="block w-full p-2 bg-slate-900 text-white rounded-lg" href="/dashboard">
              Go to Dashboard
            </Link>
            <form action="/logout" method="post">
              <button className="w-full p-2 border border-slate-200 rounded-lg text-slate-700" type="submit">
                Logout
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="text-sm text-slate-600">Please log in to continue.</p>
            <Link className="block w-full p-2 bg-slate-900 text-white rounded-lg" href="/login">
              Login
            </Link>
          </>
        )}
          </div>
        </div>
      </main>
    </div>
  )
}
