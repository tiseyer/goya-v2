import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

export default async function Footer() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <footer className="mt-16 w-full border-t border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-screen-xl flex-col items-center justify-between gap-4 px-6 py-6 text-sm text-slate-600 lg:flex-row lg:px-12">
        <a
          href="https://seyer-marketing.de"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-slate-700 hover:text-slate-900"
        >
          Powered by Seyer Marketing
        </a>

        <div className="flex items-center gap-6">
          <Link href="/privacy" className="hover:text-slate-900">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-slate-900">
            Terms of Service
          </Link>
        </div>

        <div className="flex items-center">
          {user ? (
            <form action="/logout" method="post">
              <button className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:opacity-50">
                Logout
              </button>
            </form>
          ) : (
            <div className="h-9" />
          )}
        </div>
      </div>
    </footer>
  )
}
