import Link from 'next/link';
import {
  GraduationCap,
  Heart,
  Flower2,
  Users,
  Award,
  Clock,
  ArrowRight,
} from 'lucide-react';

export const metadata = {
  title: 'Learn About Credits | GOYA',
  description: 'Understand the GOYA credits program — how to earn credits, credit types, and expiration policies.',
};

const creditTypes = [
  {
    icon: GraduationCap,
    name: 'CE Credits',
    description:
      'Continuing Education credits are earned through professional development activities such as workshops, courses, trainings, and seminars. These help demonstrate your commitment to staying current in your practice.',
  },
  {
    icon: Heart,
    name: 'Karma Hours',
    description:
      'Karma Hours recognize your community service and volunteer work. Whether you\'re teaching free classes, organizing community events, or supporting fellow practitioners, your contributions matter.',
  },
  {
    icon: Flower2,
    name: 'Practice Hours',
    description:
      'Track your personal yoga practice sessions. Consistent practice is the foundation of teaching — logging your hours helps you maintain accountability and see your dedication over time.',
  },
  {
    icon: Users,
    name: 'Teaching Hours',
    description:
      'For certified teachers, Teaching Hours track your active teaching time. This includes group classes, private sessions, workshops, and mentoring activities.',
  },
  {
    icon: Award,
    name: 'Community Engagement Credits',
    description:
      'Earned automatically through platform participation.',
    points: [
      { action: 'Creating a post', value: '5 credits' },
      { action: 'Commenting on a post', value: '2 credits' },
      { action: 'Attending an event', value: '10 credits' },
      { action: 'Completing a course', value: '15 credits' },
      { action: 'Receiving a like', value: '1 credit' },
    ],
    conversion: '100 Community Engagement Credits = 1 Practice Hour',
  },
];

export default function LearnAboutCreditsPage() {
  return (
    <main className="min-h-screen bg-slate-50 pt-20 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <section className="text-center mb-16">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#1B3A5C] mb-4">
            Welcome to the GOYA Credits Program
          </h1>
          <p className="text-foreground-secondary text-base sm:text-lg leading-relaxed max-w-3xl mx-auto">
            As a GOYA member, you&rsquo;re part of a global community committed to continuous
            growth and professional development. Our credits program helps you track your
            professional development hours, community contributions, and teaching
            experience &mdash; all in one place.
          </p>
        </section>

        {/* ── DIVIDER ──────────────────────────────────────────────────── */}
        <hr className="border-goya-border mb-12" />

        {/* ── HOW TO EARN CREDITS ──────────────────────────────────────── */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-6">How to Earn Credits</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Automated Credits */}
            <div className="bg-white rounded-2xl border border-goya-border shadow-soft p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                  <Award className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Automated Credits</h3>
              </div>
              <p className="text-foreground-secondary leading-relaxed text-sm">
                Some credits are awarded automatically based on your activity within the
                GOYA platform. Community Engagement Credits are earned by participating in
                discussions, attending events, and engaging with fellow practitioners.
              </p>
            </div>

            {/* Manual Credits */}
            <div className="bg-white rounded-2xl border border-goya-border shadow-soft p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Manual Credits</h3>
              </div>
              <p className="text-foreground-secondary leading-relaxed text-sm">
                For activities outside the platform &mdash; workshops, courses, teaching
                sessions, community service &mdash; you can submit credits manually. Each
                submission is reviewed by our team to ensure quality and accuracy.
              </p>
            </div>
          </div>
        </section>

        {/* ── DIVIDER ──────────────────────────────────────────────────── */}
        <hr className="border-goya-border mb-12" />

        {/* ── TYPES OF CREDITS ─────────────────────────────────────────── */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-6">Types of Credits</h2>

          <div className="space-y-4">
            {creditTypes.map(({ icon: Icon, name, description, points, conversion }) => (
              <div
                key={name}
                className="bg-white rounded-2xl border border-goya-border shadow-soft p-6"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{name}</h3>
                </div>

                <p className="text-foreground-secondary leading-relaxed text-sm">
                  {description}
                </p>

                {points && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-foreground mb-2">
                      Here&rsquo;s how points are awarded:
                    </p>
                    <ul className="space-y-1.5 ml-1">
                      {points.map((p) => (
                        <li
                          key={p.action}
                          className="flex items-center gap-2 text-sm text-foreground-secondary"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                          <span>
                            {p.action}: <strong className="text-foreground">{p.value}</strong>
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 text-sm font-semibold text-primary bg-primary-50 rounded-lg px-3 py-2 inline-block">
                      {conversion}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── DIVIDER ──────────────────────────────────────────────────── */}
        <hr className="border-goya-border mb-12" />

        {/* ── CREDIT EXPIRATION ─────────────────────────────────────────── */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-6">Credit Expiration</h2>
          <p className="text-foreground-secondary leading-relaxed text-sm sm:text-base">
            Credits are valid for one year from the date of the activity (not the
            submission date). This ensures your professional development record reflects
            recent, relevant experience. Credits approaching expiration will be flagged on
            your credits dashboard so you can plan ahead.
          </p>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────────── */}
        <div className="text-center">
          <Link
            href="/credits"
            className="inline-flex items-center justify-center gap-2 font-semibold text-sm text-white bg-primary hover:bg-primary-dark active:bg-primary-dark shadow-soft hover:shadow-card rounded-xl h-10 px-5 transition-all duration-200"
          >
            Submit Credits
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </main>
  );
}
