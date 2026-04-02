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

async function seed() {
  console.log('Seeding school context test data...\n')

  // 1. Create or find the test teacher auth user
  const email = 'teacher-test@goya-test.com'
  const password = 'GOYAtest2026!'

  let teacherId: string

  // Check if user already exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers()
  const existing = existingUsers?.users?.find(u => u.email === email)

  if (existing) {
    teacherId = existing.id
    console.log(`Teacher user already exists: ${teacherId}`)
  } else {
    const { data: newUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (authError || !newUser.user) {
      console.error('Failed to create auth user:', authError?.message)
      process.exit(1)
    }
    teacherId = newUser.user.id
    console.log(`Created auth user: ${teacherId}`)
  }

  // 2. Upsert teacher profile
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: teacherId,
    email,
    full_name: 'Sarah Mitchell',
    first_name: 'Sarah',
    last_name: 'Mitchell',
    role: 'teacher',
    member_type: 'teacher',
    teaching_styles: ['Hatha Yoga', 'Vinyasa Flow'],
    practice_format: 'hybrid',
    city: 'Berlin',
    country: 'Germany',
    location: 'Berlin, Germany',
    onboarding_completed: true,
    onboarding_step: 4,
    is_verified: true,
    subscription_status: 'member',
    verification_status: 'verified',
  }, { onConflict: 'id' })

  if (profileError) {
    console.error('Failed to upsert teacher profile:', profileError.message)
    process.exit(1)
  }
  console.log('Teacher profile upserted: Sarah Mitchell')

  // 3. Create or find the school
  const schoolSlug = 'berlin-yoga-studio'
  const { data: existingSchool } = await supabase
    .from('schools')
    .select('id')
    .eq('slug', schoolSlug)
    .maybeSingle()

  let schoolId: string

  if (existingSchool) {
    schoolId = existingSchool.id
    console.log(`School already exists: ${schoolId}`)
  } else {
    const { data: newSchool, error: schoolError } = await supabase.from('schools').insert({
      owner_id: teacherId,
      name: 'Berlin Yoga Studio',
      slug: schoolSlug,
      description: 'A welcoming space for all levels of yoga practice',
      short_bio: 'A welcoming space for all levels of yoga practice',
      practice_styles: ['Hatha Yoga', 'Vinyasa Flow', 'Yin Yoga'],
      programs_offered: ['Workshops', 'Community Classes'],
      course_delivery_format: 'hybrid',
      location_city: 'Berlin',
      location_country: 'Germany',
      established_year: 2018,
      languages: ['English', 'German'],
      status: 'approved',
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
      approved_at: new Date().toISOString(),
    }).select('id').single()

    if (schoolError || !newSchool) {
      console.error('Failed to create school:', schoolError?.message)
      process.exit(1)
    }
    schoolId = newSchool.id
    console.log(`Created school: ${schoolId}`)
  }

  // 4. Link teacher as principal trainer / owner in school_faculty
  // Check if already linked
  const { data: existingFaculty } = await supabase
    .from('school_faculty')
    .select('id')
    .eq('school_id', schoolId)
    .eq('profile_id', teacherId)
    .maybeSingle()

  if (!existingFaculty) {
    const { error: facultyOwnerError } = await supabase.from('school_faculty').insert({
      school_id: schoolId,
      profile_id: teacherId,
      position: 'Principal Trainer',
      is_principal_trainer: true,
      can_manage: true,
      status: 'active',
    })

    if (facultyOwnerError) {
      console.error('Failed to link owner as faculty:', facultyOwnerError.message)
    } else {
      console.log('Linked Sarah Mitchell as Principal Trainer (can_manage: true)')
    }
  } else {
    // Update can_manage if already exists
    await supabase.from('school_faculty').update({ can_manage: true }).eq('id', existingFaculty.id)
    console.log('Owner faculty record already exists, updated can_manage')
  }

  // 5. Update profile with principal_trainer_school_id
  await supabase.from('profiles').update({
    principal_trainer_school_id: schoolId,
  }).eq('id', teacherId)

  // 6. Create faculty members (profile-only, no auth accounts)
  const facultyMembers = [
    {
      full_name: 'Anna Weber',
      first_name: 'Anna',
      last_name: 'Weber',
      email: 'anna.weber@example.com',
      position: 'Teacher',
      can_manage: true,
    },
    {
      full_name: 'Max Fischer',
      first_name: 'Max',
      last_name: 'Fischer',
      email: 'max.fischer@example.com',
      position: 'Expert for Yin Yoga',
      can_manage: false,
    },
    {
      full_name: 'Lena Braun',
      first_name: 'Lena',
      last_name: 'Braun',
      email: 'lena.braun@example.com',
      position: 'Teacher',
      can_manage: false,
    },
  ]

  for (const member of facultyMembers) {
    // Create auth user for faculty (needed for profile FK)
    let memberId: string
    const existingMember = existingUsers?.users?.find(u => u.email === member.email)

    if (existingMember) {
      memberId = existingMember.id
    } else {
      const { data: newMember, error: memberAuthError } = await supabase.auth.admin.createUser({
        email: member.email,
        password: 'GOYAtest2026!',
        email_confirm: true,
      })
      if (memberAuthError || !newMember.user) {
        console.error(`Failed to create auth user for ${member.full_name}:`, memberAuthError?.message)
        continue
      }
      memberId = newMember.user.id
    }

    // Upsert profile
    await supabase.from('profiles').upsert({
      id: memberId,
      email: member.email,
      full_name: member.full_name,
      first_name: member.first_name,
      last_name: member.last_name,
      role: 'teacher',
      member_type: 'teacher',
      onboarding_completed: true,
      onboarding_step: 4,
      is_verified: true,
      subscription_status: 'member',
      verification_status: 'verified',
      faculty_school_ids: [schoolId],
    }, { onConflict: 'id' })

    // Link as faculty (check first to avoid duplicate)
    const { data: existingLink } = await supabase
      .from('school_faculty')
      .select('id')
      .eq('school_id', schoolId)
      .eq('profile_id', memberId)
      .maybeSingle()

    if (!existingLink) {
      await supabase.from('school_faculty').insert({
        school_id: schoolId,
        profile_id: memberId,
        position: member.position,
        is_principal_trainer: false,
        can_manage: member.can_manage,
        status: 'active',
      })
    } else {
      await supabase.from('school_faculty').update({
        can_manage: member.can_manage,
        position: member.position,
      }).eq('id', existingLink.id)
    }

    console.log(`Faculty: ${member.full_name} (${member.position}, can_manage: ${member.can_manage})`)
  }

  console.log('\n=== TEST ACCOUNTS CREATED ===')
  console.log(`Teacher login: ${email} / ${password}`)
  console.log(`School: Berlin Yoga Studio (${schoolId})`)
  console.log('Switch context: available in profile dropdown after login')
  console.log('')
  console.log('Faculty with context switch access:')
  console.log('  anna.weber@example.com / GOYAtest2026! (can_manage: true)')
  console.log('Faculty without context switch access:')
  console.log('  max.fischer@example.com / GOYAtest2026! (can_manage: false)')
  console.log('  lena.braun@example.com / GOYAtest2026! (can_manage: false)')
}

seed().catch(console.error)
