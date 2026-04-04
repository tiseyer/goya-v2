import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const TEST_EMAILS = [
  'student-test@seyer-marketing.de',
  'teacher-test@seyer-marketing.de',
  'school-test@seyer-marketing.de',
  'wp-test@seyer-marketing.de',
]

const failures: string[] = []

function logStep(step: string) {
  console.log(`\n--- ${step} ---`)
}

function logError(step: string, err: unknown) {
  let msg: string
  if (err instanceof Error) {
    msg = err.message
  } else if (err && typeof err === 'object' && 'message' in err) {
    msg = String((err as { message: unknown }).message)
    if ('code' in err) msg = `[${(err as { code: unknown }).code}] ${msg}`
    if ('details' in err) msg += ` | details: ${(err as { details: unknown }).details}`
  } else {
    msg = JSON.stringify(err)
  }
  console.error(`  ERROR [${step}]: ${msg}`)
  failures.push(`${step}: ${msg}`)
}

async function seed() {
  console.log('Seeding 4 test users with full dummy profiles...\n')

  // ─── Step 1: Create / find auth users ───────────────────────────────────────
  logStep('Step 1 — Auth users')

  const { data: listData, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  if (listError) {
    console.error('Failed to list users:', listError.message)
    process.exit(1)
  }

  const existingUsers = listData?.users ?? []

  async function getOrCreateUser(email: string, password: string): Promise<string | null> {
    const existing = existingUsers.find(u => u.email === email)
    if (existing) {
      console.log(`  Found existing: ${email} (${existing.id})`)
      return existing.id
    }
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (error || !data.user) {
      logError(`createUser(${email})`, error)
      return null
    }
    console.log(`  Created: ${email} (${data.user.id})`)
    return data.user.id
  }

  const studentId = await getOrCreateUser('student-test@seyer-marketing.de', 'Test1234!')
  const teacherId = await getOrCreateUser('teacher-test@seyer-marketing.de', 'Test1234!')
  const schoolOwnerId = await getOrCreateUser('school-test@seyer-marketing.de', 'Test1234!')
  const wpId = await getOrCreateUser('wp-test@seyer-marketing.de', 'Test1234!')

  if (!studentId || !teacherId || !schoolOwnerId || !wpId) {
    console.error('\nFailed to get all 4 user IDs. Aborting.')
    process.exit(1)
  }

  // ─── Step 2: Upsert profiles ─────────────────────────────────────────────────
  logStep('Step 2 — Profiles')

  const profiles = [
    {
      id: studentId,
      email: 'student-test@seyer-marketing.de',
      first_name: 'Maya',
      last_name: 'Collins',
      full_name: 'Maya Collins',
      role: 'student',
      bio: 'Yoga enthusiast on a journey to deepen my practice. Currently exploring Vinyasa and Yin styles.',
      location: 'Austin, Texas, USA',
      city: 'Austin',
      country: 'US',
      avatar_url: 'https://randomuser.me/api/portraits/women/44.jpg',
      instagram: '@mayacollins.yoga',
      wp_roles: ['faux'],
      onboarding_completed: true,
      onboarding_step: 5,
      is_verified: true,
      verification_status: 'verified',
    },
    {
      id: teacherId,
      email: 'teacher-test@seyer-marketing.de',
      first_name: 'Daniel',
      last_name: 'Reeves',
      full_name: 'Daniel Reeves',
      role: 'teacher',
      bio: 'RYT-500 certified teacher with 8 years of experience. Specializing in Ashtanga and Pranayama.',
      location: 'Portland, Oregon, USA',
      city: 'Portland',
      country: 'US',
      avatar_url: 'https://randomuser.me/api/portraits/men/32.jpg',
      website: 'https://danielreevesyoga.com',
      instagram: '@danielreevesyoga',
      designations: ['CYT200'],
      teaching_styles: ['Ashtanga', 'Pranayama'],
      teaching_focus_arr: ['Breathwork', 'Alignment'],
      wp_roles: ['faux'],
      onboarding_completed: true,
      onboarding_step: 5,
      is_verified: true,
      verification_status: 'verified',
      teacher_status: 'active',
    },
    {
      id: schoolOwnerId,
      email: 'school-test@seyer-marketing.de',
      first_name: 'Sandra',
      last_name: 'Kim',
      full_name: 'Sandra Kim',
      role: 'teacher',
      bio: 'Founder of Lotus Flow Yoga School. Training teachers across North America since 2015.',
      location: 'Vancouver, Canada',
      city: 'Vancouver',
      country: 'CA',
      avatar_url: 'https://randomuser.me/api/portraits/women/68.jpg',
      website: 'https://lotusflowschool.com',
      instagram: '@lotusflowschool',
      designations: ['CYT500'],
      teaching_styles: ['Vinyasa', 'Hatha', 'Restorative'],
      teaching_focus_arr: ['Teacher Training', 'Yoga Philosophy'],
      wp_roles: ['faux'],
      onboarding_completed: true,
      onboarding_step: 5,
      is_verified: true,
      verification_status: 'verified',
      teacher_status: 'active',
    },
    {
      id: wpId,
      email: 'wp-test@seyer-marketing.de',
      first_name: 'Marco',
      last_name: 'Silva',
      full_name: 'Marco Silva',
      role: 'wellness_practitioner',
      bio: 'Integrative wellness coach blending yoga, breathwork, and somatic therapy for holistic healing.',
      location: 'Miami, Florida, USA',
      city: 'Miami',
      country: 'US',
      avatar_url: 'https://randomuser.me/api/portraits/men/75.jpg',
      website: 'https://marcosilvahealth.com',
      instagram: '@marcosilvahealth',
      wellness_designations: ['Certified Wellness Coach', 'Breathwork Facilitator'],
      wellness_focus: ['Breathwork', 'Somatic Therapy', 'Holistic Healing'],
      wp_roles: ['faux'],
      onboarding_completed: true,
      onboarding_step: 5,
      is_verified: true,
      verification_status: 'verified',
    },
  ]

  for (const profile of profiles) {
    const { error } = await supabase.from('profiles').upsert(profile, { onConflict: 'id' })
    if (error) {
      logError(`profiles.upsert(${profile.full_name})`, error)
    } else {
      console.log(`  Upserted: ${profile.full_name} (${profile.role})`)
    }
  }

  // ─── Step 3: Bidirectional connections ──────────────────────────────────────
  logStep('Step 3 — Connections')

  const allIds = [studentId, teacherId, schoolOwnerId, wpId]

  try {
    // Delete existing connections between these 4 users
    const { error: delError } = await supabase
      .from('connections')
      .delete()
      .in('requester_id', allIds)
      .in('recipient_id', allIds)

    if (delError) {
      logError('connections.delete', delError)
    } else {
      console.log('  Deleted existing connections between test users')
    }

    // Build all 6 pairs, 2 rows each = 12 rows
    const pairs: { requester_id: string; recipient_id: string }[] = []
    for (let i = 0; i < allIds.length; i++) {
      for (let j = i + 1; j < allIds.length; j++) {
        pairs.push({ requester_id: allIds[i], recipient_id: allIds[j] })
        pairs.push({ requester_id: allIds[j], recipient_id: allIds[i] })
      }
    }

    const connectionRows = pairs.map(p => ({
      ...p,
      status: 'accepted',
      type: 'peer',
    }))

    const { error: insertError } = await supabase.from('connections').insert(connectionRows)
    if (insertError) {
      logError('connections.insert', insertError)
    } else {
      console.log(`  Inserted ${connectionRows.length} connection rows (6 pairs, bidirectional)`)
    }
  } catch (err) {
    logError('connections', err)
  }

  // ─── Step 4: School for Sandra Kim ──────────────────────────────────────────
  logStep('Step 4 — School')

  let schoolId: string | null = null

  try {
    // Delete existing school and faculty for Sandra (idempotent)
    const { data: existingSchool } = await supabase
      .from('schools')
      .select('id')
      .eq('owner_id', schoolOwnerId)
      .maybeSingle()

    if (existingSchool) {
      await supabase.from('school_faculty').delete().eq('school_id', existingSchool.id)
      await supabase.from('schools').delete().eq('id', existingSchool.id)
      console.log('  Deleted existing school and faculty records')
    }

    const { data: newSchool, error: schoolError } = await supabase
      .from('schools')
      .insert({
        name: 'Lotus Flow Yoga School',
        owner_id: schoolOwnerId,
        slug: 'lotus-flow-yoga-school',
        status: 'approved',
        bio: 'Premier yoga teacher training school in Vancouver.',
        description:
          'Lotus Flow Yoga School has been training yoga teachers across North America since 2015. Our programs combine traditional yoga philosophy with modern teaching methodology.',
        website: 'https://lotusflowschool.com',
        instagram: '@lotusflowschool',
        location_city: 'Vancouver',
        location_country: 'CA',
        established_year: 2015,
        practice_styles: ['Vinyasa', 'Hatha', 'Restorative'],
        programs_offered: ['200-Hour YTT', '300-Hour YTT', 'Specialty Workshops'],
      })
      .select('id')
      .single()

    if (schoolError || !newSchool) {
      logError('schools.insert', schoolError)
    } else {
      schoolId = newSchool.id
      console.log(`  Created school: Lotus Flow Yoga School (${schoolId})`)

      // Update Sandra's profile with principal_trainer_school_id
      const { error: updateSandraError } = await supabase
        .from('profiles')
        .update({ principal_trainer_school_id: schoolId })
        .eq('id', schoolOwnerId)
      if (updateSandraError) {
        logError('profiles.update(Sandra principal_trainer_school_id)', updateSandraError)
      } else {
        console.log('  Linked Sandra as principal trainer on profile')
      }

      // Sandra as PT faculty
      const { error: sandraFacultyError } = await supabase.from('school_faculty').insert({
        school_id: schoolId,
        profile_id: schoolOwnerId,
        is_principal_trainer: true,
        status: 'active',
        position: 'Principal Trainer',
      })
      if (sandraFacultyError) {
        logError('school_faculty.insert(Sandra)', sandraFacultyError)
      } else {
        console.log('  Added Sandra as Principal Trainer faculty')
      }

      // Daniel as Lead Instructor faculty
      const { error: danielFacultyError } = await supabase.from('school_faculty').insert({
        school_id: schoolId,
        profile_id: teacherId,
        is_principal_trainer: false,
        status: 'active',
        position: 'Lead Instructor',
      })
      if (danielFacultyError) {
        logError('school_faculty.insert(Daniel)', danielFacultyError)
      } else {
        console.log('  Added Daniel as Lead Instructor faculty')
      }

      // Update Daniel's faculty_school_ids
      const { error: danielProfileError } = await supabase
        .from('profiles')
        .update({ faculty_school_ids: [schoolId] })
        .eq('id', teacherId)
      if (danielProfileError) {
        logError('profiles.update(Daniel faculty_school_ids)', danielProfileError)
      } else {
        console.log('  Updated Daniel faculty_school_ids')
      }
    }
  } catch (err) {
    logError('school', err)
  }

  // ─── Step 5: Credit entries for Daniel (8 records) ──────────────────────────
  logStep('Step 5 — Credit entries (Daniel)')

  try {
    await supabase.from('credit_entries').delete().eq('user_id', teacherId)
    console.log('  Deleted existing credit_entries for Daniel')

    const now = new Date()
    const monthsAgo = (n: number) => {
      const d = new Date(now)
      d.setMonth(d.getMonth() - n)
      return d.toISOString().split('T')[0]
    }

    const danielCredits = [
      // teaching x3
      {
        user_id: teacherId,
        credit_type: 'teaching',
        amount: 8,
        activity_date: monthsAgo(1),
        description: 'Led 4-week Ashtanga intensive',
        status: 'approved',
        source: 'manual',
      },
      {
        user_id: teacherId,
        credit_type: 'teaching',
        amount: 5,
        activity_date: monthsAgo(5),
        description: 'Guest instructor at Portland Yoga Fest',
        status: 'approved',
        source: 'manual',
      },
      {
        user_id: teacherId,
        credit_type: 'teaching',
        amount: 10,
        activity_date: monthsAgo(10),
        description: 'Weekly community class series (10-week run)',
        status: 'approved',
        source: 'manual',
      },
      // ce (continuing education) x3
      {
        user_id: teacherId,
        credit_type: 'ce',
        amount: 6,
        activity_date: monthsAgo(3),
        description: 'Advanced Pranayama techniques workshop',
        status: 'approved',
        source: 'manual',
      },
      {
        user_id: teacherId,
        credit_type: 'ce',
        amount: 4,
        activity_date: monthsAgo(7),
        description: 'Anatomy for Yoga Teachers module',
        status: 'approved',
        source: 'manual',
      },
      {
        user_id: teacherId,
        credit_type: 'ce',
        amount: 8,
        activity_date: monthsAgo(14),
        description: 'Trauma-informed yoga certification',
        status: 'approved',
        source: 'manual',
      },
      // practice x2
      {
        user_id: teacherId,
        credit_type: 'practice',
        amount: 3,
        activity_date: monthsAgo(2),
        description: 'Breathwork and meditation retreat',
        status: 'approved',
        source: 'manual',
      },
      {
        user_id: teacherId,
        credit_type: 'practice',
        amount: 2,
        activity_date: monthsAgo(8),
        description: 'Alignment masterclass',
        status: 'approved',
        source: 'manual',
      },
    ]

    const { error } = await supabase.from('credit_entries').insert(danielCredits)
    if (error) {
      logError('credit_entries.insert(Daniel)', error)
    } else {
      console.log(`  Inserted ${danielCredits.length} credit entries for Daniel`)
    }
  } catch (err) {
    logError('credit_entries(Daniel)', err)
  }

  // ─── Step 6: Credit entries for Sandra (12 records) ─────────────────────────
  logStep('Step 6 — Credit entries (Sandra)')

  try {
    await supabase.from('credit_entries').delete().eq('user_id', schoolOwnerId)
    console.log('  Deleted existing credit_entries for Sandra')

    const now = new Date()
    const monthsAgo = (n: number) => {
      const d = new Date(now)
      d.setMonth(d.getMonth() - n)
      return d.toISOString().split('T')[0]
    }

    const sandraCredits = [
      // teaching x4
      {
        user_id: schoolOwnerId,
        credit_type: 'teaching',
        amount: 10,
        activity_date: monthsAgo(1),
        description: '200-Hour YTT program — Module 1 instruction',
        status: 'approved',
        source: 'manual',
      },
      {
        user_id: schoolOwnerId,
        credit_type: 'teaching',
        amount: 10,
        activity_date: monthsAgo(4),
        description: '200-Hour YTT program — Module 2 instruction',
        status: 'approved',
        source: 'manual',
      },
      {
        user_id: schoolOwnerId,
        credit_type: 'teaching',
        amount: 8,
        activity_date: monthsAgo(9),
        description: 'Restorative Yoga specialty intensive',
        status: 'approved',
        source: 'manual',
      },
      {
        user_id: schoolOwnerId,
        credit_type: 'teaching',
        amount: 6,
        activity_date: monthsAgo(16),
        description: 'Community Hatha class series — 6 weeks',
        status: 'approved',
        source: 'manual',
      },
      // ce (continuing education) x4
      {
        user_id: schoolOwnerId,
        credit_type: 'ce',
        amount: 5,
        activity_date: monthsAgo(2),
        description: 'Contemporary yoga philosophy seminar',
        status: 'approved',
        source: 'manual',
      },
      {
        user_id: schoolOwnerId,
        credit_type: 'ce',
        amount: 7,
        activity_date: monthsAgo(6),
        description: 'Yoga business and school administration course',
        status: 'approved',
        source: 'manual',
      },
      {
        user_id: schoolOwnerId,
        credit_type: 'ce',
        amount: 4,
        activity_date: monthsAgo(12),
        description: 'Advanced sequencing for Vinyasa flows',
        status: 'approved',
        source: 'manual',
      },
      {
        user_id: schoolOwnerId,
        credit_type: 'ce',
        amount: 6,
        activity_date: monthsAgo(20),
        description: 'Mind-body research and somatic awareness update',
        status: 'approved',
        source: 'manual',
      },
      // practice x2
      {
        user_id: schoolOwnerId,
        credit_type: 'practice',
        amount: 4,
        activity_date: monthsAgo(3),
        description: 'Canadian Yoga Conference — presenter',
        status: 'approved',
        source: 'manual',
      },
      {
        user_id: schoolOwnerId,
        credit_type: 'practice',
        amount: 3,
        activity_date: monthsAgo(11),
        description: 'Whistler Retreat — weekend immersive',
        status: 'approved',
        source: 'manual',
      },
      // community x2 (mentoring/outreach)
      {
        user_id: schoolOwnerId,
        credit_type: 'community',
        amount: 5,
        activity_date: monthsAgo(5),
        description: 'One-on-one mentoring for 3 new teacher trainees',
        status: 'approved',
        source: 'manual',
      },
      {
        user_id: schoolOwnerId,
        credit_type: 'community',
        amount: 5,
        activity_date: monthsAgo(18),
        description: 'Group mentor sessions — YTT cohort 2023',
        status: 'approved',
        source: 'manual',
      },
    ]

    const { error } = await supabase.from('credit_entries').insert(sandraCredits)
    if (error) {
      logError('credit_entries.insert(Sandra)', error)
    } else {
      console.log(`  Inserted ${sandraCredits.length} credit entries for Sandra`)
    }
  } catch (err) {
    logError('credit_entries(Sandra)', err)
  }

  // ─── Step 7: Summary table ───────────────────────────────────────────────────
  logStep('Step 7 — Summary')

  const userSummary = [
    {
      email: 'student-test@seyer-marketing.de',
      name: 'Maya Collins',
      role: 'student',
      id: studentId,
      connections: 3,
      creditEntries: 0,
      school: '—',
    },
    {
      email: 'teacher-test@seyer-marketing.de',
      name: 'Daniel Reeves',
      role: 'teacher',
      id: teacherId,
      connections: 3,
      creditEntries: 8,
      school: schoolId ? 'Lotus Flow (faculty)' : '—',
    },
    {
      email: 'school-test@seyer-marketing.de',
      name: 'Sandra Kim',
      role: 'teacher (school owner)',
      id: schoolOwnerId,
      connections: 3,
      creditEntries: 12,
      school: schoolId ? `Lotus Flow Yoga School (${schoolId?.substring(0, 8)}...)` : '—',
    },
    {
      email: 'wp-test@seyer-marketing.de',
      name: 'Marco Silva',
      role: 'wellness_practitioner',
      id: wpId,
      connections: 3,
      creditEntries: 0,
      school: '—',
    },
  ]

  console.log('\n')
  console.log('╔══════════════════════════════════════════════════════════════════════════╗')
  console.log('║                     TEST USER SEED SUMMARY                              ║')
  console.log('╠══════════════════════════════════════════════════════════════════════════╣')
  console.log('║ Password for all: Test1234!                                              ║')
  console.log('╠══════════════════════════════════════════════════════════════════════════╣')
  for (const u of userSummary) {
    console.log(`║ ${u.name.padEnd(16)} | ${u.role.padEnd(22)} | connections: ${u.connections} | credits: ${String(u.creditEntries).padEnd(2)} ║`)
    console.log(`║   email: ${u.email.padEnd(43)} | id: ${u.id.substring(0, 8)}...  ║`)
    if (u.school !== '—') {
      console.log(`║   school: ${u.school.padEnd(64)} ║`)
    }
    console.log('╠══════════════════════════════════════════════════════════════════════════╣')
  }
  console.log('╚══════════════════════════════════════════════════════════════════════════╝')

  if (failures.length > 0) {
    console.log('\n FAILURES:')
    failures.forEach(f => console.log(`  - ${f}`))
    console.log(`\n${failures.length} step(s) failed. See above for details.`)
  } else {
    console.log('\nAll steps completed successfully.')
  }
}

seed().catch(console.error)
