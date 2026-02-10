import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

function getInitials(value: string) {
  const parts = value.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]?.slice(0, 2).toUpperCase()
  return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')
}

export default async function Header() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ||
    (user?.user_metadata?.name as string | undefined) ||
    user?.email ||
    'Member'

  const initials = getInitials(displayName || 'GOYA')

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white">
      <div className="mx-auto h-16 w-full max-w-screen-xl px-6 lg:px-12">
        <div className="flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-2xl font-extrabold tracking-tight text-slate-900">
            GOYA
          </Link>
        </div>

        <nav className="hidden flex-1 items-center justify-center gap-6 text-sm font-medium text-slate-700 lg:flex">
          <Link href="/" className="hover:text-slate-900">
            Welcome
          </Link>
          <Link href="/community" className="hover:text-slate-900">
            Members
          </Link>
        </nav>

        <div className="flex items-center justify-end gap-4">
          {user ? (
            <div className="relative group">
              <button className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900">
                <span className="max-w-[140px] truncate">{displayName}</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                  {initials}
                </span>
              </button>
              <div className="pointer-events-none absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-2 opacity-0 shadow-sm transition group-hover:pointer-events-auto group-hover:opacity-100">
                <form action="/logout" method="post">
                  <button className="w-full rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:opacity-50">
                    Logout
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <Link className="text-sm font-medium text-slate-700 hover:text-slate-900" href="/login">
              Login
            </Link>
          )}
        </div>
        </div>
      </div>
    </header>
  )
}
