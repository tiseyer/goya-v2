/**
 * GOYA Migration — Import Users from WP Export JSON to Supabase
 *
 * Usage:
 *   npx tsx migration/import-users.ts --file=migration/dummy-users.json --mode=skip
 *   npx tsx migration/import-users.ts --file=migration/dummy-users.json --mode=overwrite
 *   npx tsx migration/import-users.ts --file="migration/goya-export-chunk-*.json" --mode=skip
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, basename } from 'path';
import { randomBytes } from 'crypto';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WPExportUser {
  wp_id: number;
  email: string;
  display_name: string;
  first_name: string;
  last_name: string;
  role: string; // 'subscriber' | 'teacher' | 'wellness' | 'administrator'
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

type ImportMode = 'skip' | 'overwrite';

interface UserResult {
  email: string;
  wp_id: number;
  status: 'created' | 'skipped' | 'updated' | 'error';
  error?: string;
  supabase_id?: string;
}

interface MigrationLog {
  started_at: string;
  completed_at: string;
  mode: ImportMode;
  files: string[];
  total: number;
  created: number;
  skipped: number;
  updated: number;
  errors: number;
  results: UserResult[];
}

// ---------------------------------------------------------------------------
// CLI Argument Parsing
// ---------------------------------------------------------------------------

function parseArgs(): { filePaths: string[]; mode: ImportMode } {
  const args = process.argv.slice(2);
  let fileArg = '';
  let mode: ImportMode = 'skip';

  for (const arg of args) {
    if (arg.startsWith('--file=')) {
      fileArg = arg.replace('--file=', '');
    } else if (arg.startsWith('--mode=')) {
      const m = arg.replace('--mode=', '');
      if (m !== 'skip' && m !== 'overwrite') {
        console.error(`Invalid mode: ${m}. Use 'skip' or 'overwrite'.`);
        process.exit(1);
      }
      mode = m;
    }
  }

  if (!fileArg) {
    console.error('Usage: npx tsx migration/import-users.ts --file=<path-or-glob> --mode=skip|overwrite');
    process.exit(1);
  }

  // Resolve glob or single file
  let filePaths: string[];
  if (fileArg.includes('*')) {
    // Use glob package if available, otherwise error
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { globSync } = require('glob');
      filePaths = (globSync(fileArg) as string[]).map((f: string) => resolve(f));
    } catch {
      console.error('Glob pattern used but "glob" package not installed. Run: npm install --save-dev glob');
      process.exit(1);
    }
  } else {
    filePaths = [resolve(fileArg)];
  }

  if (filePaths.length === 0) {
    console.error(`No files matched: ${fileArg}`);
    process.exit(1);
  }

  return { filePaths, mode };
}

// ---------------------------------------------------------------------------
// Role Mapping
// ---------------------------------------------------------------------------

function mapRole(wpRole: string): 'student' | 'teacher' | 'wellness_practitioner' | 'admin' {
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

function buildProfileUpdate(user: WPExportUser): Record<string, unknown> {
  const p = user.profile;

  // Build location string from city + country
  const locationParts: string[] = [];
  if (p.location?.city) locationParts.push(p.location.city);
  if (p.location?.country) locationParts.push(p.location.country);
  const location = locationParts.length > 0 ? locationParts.join(', ') : null;

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

  return {
    // Name fields (full_name auto-computed by sync_full_name trigger)
    first_name: firstName || null,
    last_name: lastName || null,

    // Role
    role: mapRole(user.role),

    // Avatar
    avatar_url: user.avatar_url || null,

    // About
    introduction: p.about?.introduction || null,
    biography: p.about?.personal_bio || null,

    // Practice
    practice_level: p.practice?.practice_level || null,
    practice_styles: p.practice?.practice_styles || [],

    // Teaching
    years_teaching: p.teaching?.years_teaching || null,
    teaching_styles_profile: p.teaching?.teaching_styles || [],
    teaching_focus: p.teaching?.teaching_focus || [],
    teaching_format: p.teaching?.teaching_format || null,

    // School / Lineage
    lineage: p.school?.lineage || [],

    // Socials
    website: p.socials?.website || null,
    instagram: p.socials?.instagram || null,
    youtube: p.socials?.youtube || null,

    // Location
    location: location,

    // Subscription status
    subscription_status: hasActiveSub ? 'member' : 'guest',

    // Migration flag — user must reset password on first login
    requires_password_reset: true,
  };
}

// ---------------------------------------------------------------------------
// Subscription Upsert
// ---------------------------------------------------------------------------

async function upsertSubscriptions(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  user: WPExportUser
): Promise<void> {
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
// Main Import Logic
// ---------------------------------------------------------------------------

async function importUsers(): Promise<void> {
  const startedAt = new Date().toISOString();
  const { filePaths, mode } = parseArgs();

  // Load environment variables from .env.local
  // Intentionally avoids dotenv dependency by reading the file directly
  const envPath = resolve(process.cwd(), '.env.local');
  let envContent: string;
  try {
    envContent = readFileSync(envPath, 'utf-8');
  } catch {
    console.error('ERROR: .env.local not found. Set SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL.');
    process.exit(1);
  }

  const envVars: Record<string, string> = {};
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    // Strip surrounding quotes if present
    envVars[key] = value.replace(/^["']|["']$/g, '');
  }

  const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'];
  const serviceRoleKey = envVars['SUPABASE_SERVICE_ROLE_KEY'];

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local');
    process.exit(1);
  }

  // Create Supabase admin client with service role key
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Load all users from all files
  const allUsers: WPExportUser[] = [];
  for (const fp of filePaths) {
    console.log(`Loading: ${basename(fp)}`);
    const raw = readFileSync(fp, 'utf-8');
    const users: WPExportUser[] = JSON.parse(raw);
    allUsers.push(...users);
  }

  console.log(`\nImporting ${allUsers.length} users in "${mode}" mode...\n`);

  const results: UserResult[] = [];
  let created = 0;
  let skipped = 0;
  let updated = 0;
  let errors = 0;

  for (let i = 0; i < allUsers.length; i++) {
    const user = allUsers[i];
    const progress = `[${i + 1}/${allUsers.length}]`;

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
          console.log(`${progress} SKIP: ${user.email} (already exists)`);
          results.push({
            email: user.email,
            wp_id: user.wp_id,
            status: 'skipped',
            supabase_id: existingProfile.id,
          });
          skipped++;
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

        console.log(`${progress} UPDATED: ${user.email}`);
        results.push({
          email: user.email,
          wp_id: user.wp_id,
          status: 'updated',
          supabase_id: existingProfile.id,
        });
        updated++;
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

      if (authError) throw new Error(`Auth creation failed: ${authError.message}`);
      if (!authData.user) throw new Error('Auth creation returned no user');

      const userId = authData.user.id;

      // Small delay to ensure handle_new_user trigger has created the profile row
      await new Promise((r) => setTimeout(r, 150));

      // Update the auto-created profile row with all mapped fields
      const profileData = buildProfileUpdate(user);
      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', userId);

      if (profileError) throw new Error(`Profile update failed: ${profileError.message}`);

      // Upsert Stripe subscription records into stripe_orders
      await upsertSubscriptions(supabase, userId, user);

      console.log(`${progress} CREATED: ${user.email} (${mapRole(user.role)})`);
      results.push({
        email: user.email,
        wp_id: user.wp_id,
        status: 'created',
        supabase_id: userId,
      });
      created++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`${progress} ERROR: ${user.email} — ${message}`);
      results.push({
        email: user.email,
        wp_id: user.wp_id,
        status: 'error',
        error: message,
      });
      errors++;
    }
  }

  // Write migration log JSON
  const completedAt = new Date().toISOString();
  const log: MigrationLog = {
    started_at: startedAt,
    completed_at: completedAt,
    mode,
    files: filePaths.map(basename),
    total: allUsers.length,
    created,
    skipped,
    updated,
    errors,
    results,
  };

  const logFilename = `migration/migration-log-${Date.now()}.json`;
  writeFileSync(resolve(process.cwd(), logFilename), JSON.stringify(log, null, 2));

  console.log(`\n--- Import Complete ---`);
  console.log(`Total: ${allUsers.length} | Created: ${created} | Skipped: ${skipped} | Updated: ${updated} | Errors: ${errors}`);
  console.log(`Log: ${logFilename}`);

  if (errors > 0) {
    console.warn(`\nWARN: ${errors} user(s) failed to import. Check the log for details.`);
  }
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

importUsers().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
