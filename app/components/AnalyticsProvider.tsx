'use client';

import { Suspense, useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackPageView, setGA4UserProperties, setClarityUserTags } from '@/lib/analytics/tracking';
import { supabase } from '@/lib/supabase';

/**
 * Inner component that uses useSearchParams (requires Suspense boundary).
 */
function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const userPropsSet = useRef(false);

  // ── Page view tracking on every navigation ─────────────────────────────────
  useEffect(() => {
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    trackPageView(url);
  }, [pathname, searchParams]);

  // ── User properties — set once per session ─────────────────────────────────
  useEffect(() => {
    if (userPropsSet.current) return;

    async function setUserProperties() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('role, member_type, designations, onboarding_completed')
          .eq('id', user.id)
          .single();

        if (!profile) return;

        const role = profile.member_type || profile.role || 'student';
        const designations = (profile.designations as string[] | null) ?? [];
        const designation = designations.filter(Boolean).join(', ') || 'none';

        const { count } = await supabase
          .from('stripe_orders')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('type', 'recurring')
          .eq('subscription_status', 'active');

        const hasSubscription = (count ?? 0) > 0;

        const props = {
          user_role: role,
          membership_status: 'member' as const,
          has_subscription: hasSubscription,
          designation,
        };

        setGA4UserProperties(props);
        setClarityUserTags(props);
        userPropsSet.current = true;
      } catch {
        // Non-critical — don't break the app
      }
    }

    setUserProperties();
  }, []);

  return null;
}

/**
 * Wraps AnalyticsTracker in Suspense (required for useSearchParams in App Router).
 */
export default function AnalyticsProvider() {
  return (
    <Suspense fallback={null}>
      <AnalyticsTracker />
    </Suspense>
  );
}
