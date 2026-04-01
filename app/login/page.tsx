import { signIn } from '@/app/auth/actions'

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>
}) {
  const sp = (await searchParams) ?? {}
  const error = sp.error

  return (
    <div className="bg-slate-50 text-slate-900">
      <form
        action={signIn}
        className="bg-white p-8 rounded-2xl w-full max-w-md space-y-4 border border-slate-200 shadow-sm mx-auto my-12"
      >
        <h1 className="text-2xl font-semibold">Login</h1>

        <input
          name="email"
          type="email"
          placeholder="Email"
          className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
          required
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
          required
        />

        <button
          className="w-full rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:opacity-50"
          style={{ backgroundColor: '#0f172a', color: '#ffffff' }}
        >
          Login
        </button>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </form>
    </div>
  )
}
