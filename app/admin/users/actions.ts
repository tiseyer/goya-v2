'use server'
import { getSupabaseService } from '@/lib/supabase/service'
import { logAuditEvent } from '@/lib/audit'
import type { Database } from '@/types/supabase'

type UserRole = Database['public']['Enums']['user_role']

function generatePassword(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function createUser(formData: {
  firstName: string
  lastName: string
  email: string
  role: UserRole
  password?: string
}): Promise<{ success: true; email: string; userId: string } | { success: false; error: string }> {
  const supabase = getSupabaseService()

  const password = formData.password?.trim() || generatePassword()

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: formData.email.trim(),
    password,
    email_confirm: true,
    user_metadata: {
      first_name: formData.firstName.trim(),
      last_name: formData.lastName.trim(),
    },
  })

  if (authError) {
    if (authError.message.toLowerCase().includes('already')) {
      return { success: false, error: 'A user with this email already exists.' }
    }
    return { success: false, error: authError.message }
  }

  if (!authData.user) {
    return { success: false, error: 'User creation failed — no user returned.' }
  }

  const { error: profileError } = await supabase.from('profiles').upsert({
    id: authData.user.id,
    email: formData.email.trim(),
    first_name: formData.firstName.trim(),
    last_name: formData.lastName.trim(),
    full_name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
    role: formData.role,
  }, { onConflict: 'id' })

  if (profileError) {
    // Auth user was created — attempt cleanup so we don't leave orphaned auth records
    await supabase.auth.admin.deleteUser(authData.user.id)
    return { success: false, error: `Profile creation failed: ${profileError.message}` }
  }

  void logAuditEvent({
    category: 'admin',
    action: 'admin.user_created',
    target_type: 'USER',
    target_id: authData.user.id,
    target_label: `${formData.firstName} ${formData.lastName}`,
    description: `Created user ${formData.firstName} ${formData.lastName} (${formData.email}) with role ${formData.role}`,
    metadata: { role: formData.role, email: formData.email.trim() },
  })

  return { success: true, email: formData.email.trim(), userId: authData.user.id }
}

export async function updateUserProfile(userId: string, updates: Record<string, unknown>) {
  const supabase = getSupabaseService()

  // Capture old role if role is being changed
  let oldRole: string | undefined
  if ('role' in updates) {
    const { data: existing } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()
    oldRole = existing?.role ?? undefined
  }

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
  if (error) return { success: false, error: error.message }

  if ('role' in updates && oldRole !== updates.role) {
    void logAuditEvent({
      category: 'admin',
      action: 'admin.user_role_changed',
      target_type: 'USER',
      target_id: userId,
      description: `Changed user role from ${oldRole} to ${updates.role}`,
      metadata: { old_role: oldRole ?? null, new_role: (updates.role as string) ?? null },
    })
  }

  return { success: true }
}
