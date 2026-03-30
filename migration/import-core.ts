/**
 * GOYA Migration — Shared Import Core
 *
 * Extracted from migration/import-users.ts. Contains all reusable logic:
 * types, field mapping, role mapping, subscription upsert, and the main import loop.
 *
 * This module does NOT read .env.local or use process.argv — it accepts a Supabase
 * client and user data as arguments, making it usable from both the CLI script and
 * the admin API route.
 */

import { randomBytes } from 'crypto';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WPExportUser {
  wp_id: number;
  email: string;
  display_name: string;
  first_name: string;
  last_name: string;
  role: string; // 'subscriber' | 'teacher' | 'wellness' | 'administrator'
  roles?: string[]; // All WP roles (for legacy tracking)
  registered_at: string;
  profile: {
    about?: { introduction?: string; personal_bio?: string };
    practice?: { practice_level?: string; practice_styles?: string[] };
    teaching?: {
      years_teaching?: string;
      teaching_styles?: string[];
      teaching_focus?: string[];
      teaching_format?: string;
    };
    school?: { lineage?: string[] };
    socials?: { website?: string; instagram?: string; youtube?: string };
    location?: { city?: string; country?: string };
    [group: string]: Record<string, unknown> | undefined;
  };
  avatar_url: string;
  subscriptions: Array<{
    subscription_id: number;
    status: string;
    start_date: string;
    end_date: string;
    stripe_customer_id: string;
    stripe_subscription_id: string;
  }>;
}

export type ImportMode = 'skip' | 'overwrite';

export interface UserResult {
  email: string;
  wp_id: number;
  status: 'created' | 'skipped' | 'updated' | 'error';
  error?: string;
  supabase_id?: string;
}

export interface MigrationLog {
  started_at: string;
  completed_at: string;
  mode: ImportMode;
  total: number;
  created: number;
  skipped: number;
  updated: number;
  errors: number;
  results: UserResult[];
}

// ---------------------------------------------------------------------------
// Role Mapping
// ---------------------------------------------------------------------------

export function mapRole(wpRole: string): 'student' | 'teacher' | 'wellness_practitioner' | 'admin' {
  switch (wpRole.toLowerCase()) {
    case 'teacher':
      return 'teacher';
    case 'wellness':
      return 'wellness_practitioner';
    case 'administrator':
      return 'admin';
    case 'subscriber':
    case 'member':
    default:
      return 'student';
  }
}

// ---------------------------------------------------------------------------
// Profile Data Mapping
// ---------------------------------------------------------------------------

export function buildProfileUpdate(user: WPExportUser): Record<string, unknown> {
  const p = user.profile;

  // Determine first_name and last_name — prefer explicit fields, fallback to display_name split
  let firstName = user.first_name || '';
  let lastName = user.last_name || '';
  if (!firstName && !lastName && user.display_name) {
    const parts = user.display_name.split(' ');
    firstName = parts[0] || '';
    lastName = parts.slice(1).join(' ') || '';
  }

  // Determine subscription_status — 'member' if any active subscription
  const hasActiveSub = user.subscriptions.some((s) => s.status === 'active');

  // Map teaching_styles (stored as jsonb array in teaching_styles column)
  const teachingStyles = p.teaching?.teaching_styles || [];
  const teachingFocusArr = p.teaching?.teaching_focus || [];
  const influencesArr = (p.school?.lineage || []) as string[];

  return {
    // Name fields
    first_name: firstName || null,
    last_name: lastName || null,

    // Role
    role: mapRole(user.role),

    // Avatar
    avatar_url: user.avatar_url || null,

    // Bio (maps from personal_bio; introduction not a column in current schema)
    bio: p.about?.personal_bio || p.about?.introduction || null,

    // Socials
    website: p.socials?.website || null,
    instagram: p.socials?.instagram || null,
    youtube: p.socials?.youtube || null,

    // Location — stored as separate city/country columns in current schema
    city: p.location?.city || null,
    country: p.location?.country || null,
    location: [p.location?.city, p.location?.country].filter(Boolean).join(', ') || null,

    // Teaching data — mapped to current schema columns
    teaching_styles: teachingStyles.length > 0 ? teachingStyles : null,
    teaching_focus_arr: teachingFocusArr.length > 0 ? teachingFocusArr : null,
    influences_arr: influencesArr.length > 0 ? influencesArr : null,

    // Subscription status
    subscription_status: hasActiveSub ? 'member' : 'guest',

    // Migration flag — user must reset password on first login
    requires_password_reset: true,

    // Legacy WordPress roles (read-only reference)
    wp_roles: user.roles ?? [],

    // Original WP registration date
    wp_registered_at: user.registered_at ? new Date(user.registered_at.replace(' ', 'T') + 'Z').toISOString() : null,
  };
}

// ---------------------------------------------------------------------------
// Subscription Upsert
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function upsertSubscriptions(supabase: any, userId: string, user: WPExportUser): Promise<void> {
  for (const sub of user.subscriptions) {
    if (!sub.stripe_subscription_id) continue;

    let periodEnd: string | null = null;
    if (sub.end_date && sub.end_date.trim() !== '') {
      try {
        periodEnd = new Date(sub.end_date).toISOString();
      } catch {
        periodEnd = null;
      }
    }

    let periodStart: string | null = null;
    if (sub.start_date && sub.start_date.trim() !== '') {
      try {
        periodStart = new Date(sub.start_date).toISOString();
      } catch {
        periodStart = null;
      }
    }

    const { error } = await supabase
      .from('stripe_orders')
      .upsert(
        {
          stripe_id: sub.stripe_subscription_id,
          stripe_customer_id: sub.stripe_customer_id || null,
          user_id: userId,
          amount_total: 0,
          currency: 'usd',
          status: sub.status === 'active' ? 'active' : 'canceled',
          type: 'recurring',
          subscription_status: sub.status,
          current_period_start: periodStart,
          current_period_end: periodEnd,
          metadata: { wp_subscription_id: sub.subscription_id, migrated: true },
        },
        { onConflict: 'stripe_id' }
      );

    if (error) {
      console.warn(`  Warning: subscription upsert failed for ${sub.stripe_subscription_id}: ${error.message}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Main Import Loop
// ---------------------------------------------------------------------------

export async function importUsersFromData(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  users: WPExportUser[],
  mode: ImportMode,
  onProgress?: (result: UserResult, index: number, total: number) => void
): Promise<MigrationLog> {
  const startedAt = new Date().toISOString();

  const results: UserResult[] = [];
  let created = 0;
  let skipped = 0;
  let updated = 0;
  let errors = 0;

  for (let i = 0; i < users.length; i++) {
    const user = users[i];

    try {
      // Efficient email lookup via profiles table (avoids listing all auth users)
      const { data: existingProfile, error: lookupError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', user.email.toLowerCase())
        .maybeSingle();

      if (lookupError) {
        throw new Error(`Profile lookup failed: ${lookupError.message}`);
      }

      if (existingProfile?.id) {
        // User already exists
        if (mode === 'skip') {
          const result: UserResult = {
            email: user.email,
            wp_id: user.wp_id,
            status: 'skipped',
            supabase_id: existingProfile.id,
          };
          results.push(result);
          skipped++;
          onProgress?.(result, i, users.length);
          continue;
        }

        // Overwrite mode — update profile data and subscriptions
        const profileData = buildProfileUpdate(user);
        const { error: updateError } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', existingProfile.id);

        if (updateError) throw new Error(`Profile update failed: ${updateError.message}`);

        await upsertSubscriptions(supabase, existingProfile.id, user);

        const result: UserResult = {
          email: user.email,
          wp_id: user.wp_id,
          status: 'updated',
          supabase_id: existingProfile.id,
        };
        results.push(result);
        updated++;
        onProgress?.(result, i, users.length);
        continue;
      }

      // --- Create new user ---

      // Generate a random temporary password (user will reset on first login)
      const tempPassword = randomBytes(24).toString('base64url');

      // Determine first_name / last_name for user_metadata
      let firstName = user.first_name || '';
      let lastName = user.last_name || '';
      if (!firstName && !lastName && user.display_name) {
        const parts = user.display_name.split(' ');
        firstName = parts[0] || '';
        lastName = parts.slice(1).join(' ') || '';
      }

      // Create auth user (triggers handle_new_user which auto-creates profile row with MRN)
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: `${firstName} ${lastName}`.trim(),
        },
      });

      // Resolve userId — either from fresh creation or from fallback lookup for existing auth users
      let userId: string;
      let isExistingAuthUser = false;

      if (authError) {
        const errMsg = authError.message || '';
        const isKnownConflict =
          /already registered/i.test(errMsg) || /database error/i.test(errMsg);

        if (!isKnownConflict) {
          // Unknown auth error — surface immediately
          throw new Error(`Auth creation failed: ${errMsg}`);
        }

        // Known conflict in overwrite mode — look up the existing auth user by email
        const { data: listData, error: listError } = await supabase.auth.admin.listUsers({
          page: 1,
          perPage: 1000,
        });

        if (listError) {
          throw new Error(`Auth creation failed and fallback lookup errored: ${listError.message}`);
        }

        const existingAuthUser = (listData?.users ?? []).find(
          (u: { email?: string }) => u.email?.toLowerCase() === user.email.toLowerCase()
        );

        if (!existingAuthUser) {
          // Cannot create AND cannot find — real error
          throw new Error(`Auth creation failed and user not found by email: ${errMsg}`);
        }

        console.warn(
          `Auth user already exists for ${user.email}, using existing ID ${existingAuthUser.id} (overwrite mode)`
        );
        userId = existingAuthUser.id;
        isExistingAuthUser = true;
      } else {
        if (!authData.user) throw new Error('Auth creation returned no user');
        userId = authData.user.id;
      }

      // Small delay to ensure handle_new_user trigger has created the profile row.
      // Skip when reusing an existing auth user — profile row already exists.
      if (!isExistingAuthUser) {
        await new Promise((r) => setTimeout(r, 150));
      }

      // Update the auto-created profile row with all mapped fields
      const profileData = buildProfileUpdate(user);
      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', userId);

      if (profileError) throw new Error(`Profile update failed: ${profileError.message}`);

      // Upsert Stripe subscription records into stripe_orders
      await upsertSubscriptions(supabase, userId, user);

      // Existing auth users that had no profile entry yet count as "updated" not "created"
      const resultStatus: UserResult['status'] = isExistingAuthUser ? 'updated' : 'created';

      const result: UserResult = {
        email: user.email,
        wp_id: user.wp_id,
        status: resultStatus,
        supabase_id: userId,
      };
      results.push(result);
      if (isExistingAuthUser) {
        updated++;
      } else {
        created++;
      }
      onProgress?.(result, i, users.length);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const result: UserResult = {
        email: user.email,
        wp_id: user.wp_id,
        status: 'error',
        error: message,
      };
      results.push(result);
      errors++;
      onProgress?.(result, i, users.length);
    }
  }

  const completedAt = new Date().toISOString();

  return {
    started_at: startedAt,
    completed_at: completedAt,
    mode,
    total: users.length,
    created,
    skipped,
    updated,
    errors,
    results,
  };
}
