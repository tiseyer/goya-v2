const users = [
  {
    id: 'u1',
    name: 'Maya Hernandez',
    avatar: 'https://i.pravatar.cc/80?img=32',
    role: 'Student',
    badges: ['CYT200', 'Breathwork Lv1'],
  },
  {
    id: 'u2',
    name: 'Jordan Lee',
    avatar: 'https://i.pravatar.cc/80?img=12',
    role: 'Teacher',
    badges: ['E-CYT500', 'Trauma-Informed'],
  },
  {
    id: 'u3',
    name: 'Sage Patel',
    avatar: 'https://i.pravatar.cc/80?img=48',
    role: 'Wellness Practitioner',
    badges: ['Ayurveda', 'Sound Healing'],
  },
  {
    id: 'u4',
    name: 'Cedar Ridge School',
    avatar: 'https://i.pravatar.cc/80?img=5',
    role: 'School',
    badges: ['GOYA Partner', 'RYT 200 Host'],
  },
  {
    id: 'u5',
    name: 'Avery Nguyen',
    avatar: 'https://i.pravatar.cc/80?img=22',
    role: 'Student',
    badges: ['Meditation 101', 'CYT200'],
  },
]

const roles = ['Student', 'Teacher', 'School', 'Wellness Practitioner']
const countries = ['All Countries', 'United States', 'Canada', 'Mexico', 'United Kingdom']

export default async function CommunityPage() {
  return (
    <div className="bg-slate-50 text-slate-900">
      <main className="mx-auto max-w-screen-xl px-6 lg:px-12 py-12 space-y-10">
        <header className="space-y-3">
          <h1 className="text-3xl font-semibold">GOYA Community</h1>
          <p className="text-slate-600 max-w-2xl">
            A calm, growing directory of learners, guides, and partner schools. Explore who is
            practicing, teaching, and supporting the community.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-6 rounded-2xl border border-slate-200 bg-white p-6 md:grid-cols-[260px_1fr]">
          <aside className="space-y-6">
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Filter by Role
              </h2>
              <div className="space-y-2">
                {roles.map((role) => (
                  <label key={role} className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 bg-white text-slate-900"
                      defaultChecked={role === 'Student'}
                    />
                    {role}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Country
              </h2>
              <select className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                {countries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>
          </aside>

          <div className="space-y-4">
            {users.map((user) => (
              <article
                key={user.id}
                className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="h-14 w-14 rounded-full object-cover border border-slate-200"
                  />
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold">{user.name}</h3>
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                        {user.role}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">Member of GOYA Community</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 sm:ml-auto">
                  {user.badges.map((badge) => (
                    <span
                      key={badge}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
