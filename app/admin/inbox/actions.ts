'use server'
import 'server-only'
import { revalidatePath } from 'next/cache'
import { createSupabaseServerActionClient } from '@/lib/supabaseServer'
import { getStripe } from '@/lib/stripe/client'
import { getSupabaseService } from '@/lib/supabase/service'
import type { SupportTicket, TicketStatus } from '@/lib/chatbot/types'
import { writeEventAuditLog } from '@/lib/events/audit'
import { writeCourseAuditLog } from '@/lib/courses/audit'
import { logAuditEvent } from '@/lib/audit'
import { isAdminOrAbove, isAdminOrMod } from '@/lib/roles'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function approveUpgradeRequest(
  requestId: string,
): Promise<{ success: boolean; error?: string }> {
  // 1. Auth guard — require admin role
  const supabase = await createSupabaseServerActionClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const serviceClient = getSupabaseService()
  const { data: adminProfile } = await serviceClient
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!adminProfile || !isAdminOrAbove(adminProfile.role)) {
    return { success: false, error: 'Unauthorized' }
  }

  // 2. Load request
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: request } = await (serviceClient as any)
    .from('upgrade_requests')
    .select('id, user_id, stripe_payment_intent_id, status')
    .eq('id', requestId)
    .single()

  if (!request || request.status !== 'pending') {
    return { success: false, error: 'Request not found or already reviewed' }
  }

  // 3. Load profile
  const { data: profile } = await serviceClient
    .from('profiles')
    .select('stripe_customer_id, full_name, email')
    .eq('id', request.user_id)
    .single()

  if (!profile?.stripe_customer_id) {
    return { success: false, error: 'User has no Stripe customer ID' }
  }

  // 4. Capture payment
  try {
    await getStripe().paymentIntents.capture(request.stripe_payment_intent_id)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to capture payment'
    return { success: false, error: message }
  }

  // 5. Create subscription
  let subscription: { id: string }
  try {
    subscription = await getStripe().subscriptions.create({
      customer: profile.stripe_customer_id,
      items: [{ price: 'price_1TE4kfDLfij4i9P9sUpSD2Si' }],
      metadata: { goya_user_id: request.user_id },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create subscription'
    return { success: false, error: message }
  }

  // 6. Update role to teacher
  await serviceClient
    .from('profiles')
    .update({ role: 'teacher' })
    .eq('id', request.user_id)

  // 7. Update request record
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (serviceClient as any)
    .from('upgrade_requests')
    .update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
      stripe_subscription_id: subscription.id,
    })
    .eq('id', requestId)

  // 8. Notify user
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (serviceClient as any).from('notifications').insert({
    user_id: request.user_id,
    type: 'teacher_upgrade_approved',
    title: 'Your upgrade was approved!',
    body: 'Congratulations! Your teacher upgrade has been approved. Your Teacher Membership is now active.',
    link: '/settings/subscriptions',
    actor_id: user.id,
  })

  // 9. Audit
  void logAuditEvent({
    category: 'admin',
    action: 'admin.user_role_changed',
    actor_id: user.id,
    actor_role: 'admin',
    target_type: 'USER',
    target_id: request.user_id,
    target_label: profile.full_name ?? undefined,
    description: `Approved teacher upgrade for ${profile.full_name ?? request.user_id}`,
    metadata: { old_role: 'student', new_role: 'teacher', upgrade_request_id: requestId },
  })

  // 10. Revalidate
  revalidatePath('/admin/inbox')

  return { success: true }
}

export async function rejectUpgradeRequest(
  requestId: string,
  rejectionReason: string,
): Promise<{ success: boolean; error?: string }> {
  // 1. Auth guard — require admin role
  const supabase = await createSupabaseServerActionClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const serviceClient = getSupabaseService()
  const { data: adminProfile } = await serviceClient
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!adminProfile || !isAdminOrAbove(adminProfile.role)) {
    return { success: false, error: 'Unauthorized' }
  }

  // 2. Load request
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: request } = await (serviceClient as any)
    .from('upgrade_requests')
    .select('id, user_id, stripe_payment_intent_id, status')
    .eq('id', requestId)
    .single()

  if (!request || request.status !== 'pending') {
    return { success: false, error: 'Request not found or already reviewed' }
  }

  // 3. Cancel payment intent (releases authorization — no charge to user)
  try {
    await getStripe().paymentIntents.cancel(request.stripe_payment_intent_id)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to cancel payment intent'
    return { success: false, error: message }
  }

  // 4. Update request record
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (serviceClient as any)
    .from('upgrade_requests')
    .update({
      status: 'rejected',
      rejection_reason: rejectionReason.trim() || null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq('id', requestId)

  // 5. Notify user
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (serviceClient as any).from('notifications').insert({
    user_id: request.user_id,
    type: 'teacher_upgrade_rejected',
    title: 'Your upgrade request was not approved',
    body: rejectionReason.trim()
      ? `Your teacher upgrade request was not approved: ${rejectionReason.trim()}`
      : 'Your teacher upgrade request was not approved. Please contact support for details.',
    link: '/settings/subscriptions',
    actor_id: user.id,
  })

  // 6. Audit
  void logAuditEvent({
    category: 'admin',
    action: 'admin.user_role_changed',
    severity: 'warning',
    actor_id: user.id,
    actor_role: 'admin',
    target_type: 'USER',
    target_id: request.user_id,
    description: `Rejected teacher upgrade for user ${request.user_id}`,
    metadata: { rejection_reason: rejectionReason.trim(), upgrade_request_id: requestId },
  })

  // 7. Revalidate
  revalidatePath('/admin/inbox')

  return { success: true }
}

export async function approveCreditEntry(
  entryId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseServerActionClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const serviceClient = getSupabaseService()
  const { data: adminProfile } = await serviceClient
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (
    !adminProfile ||
    !isAdminOrMod(adminProfile.role)
  ) {
    return { success: false, error: 'Unauthorized' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (serviceClient as any)
    .from('credit_entries')
    .update({ status: 'approved' })
    .eq('id', entryId)

  if (error) {
    return { success: false, error: error.message }
  }

  void logAuditEvent({
    category: 'admin',
    action: 'admin.credit_approved',
    actor_id: user.id,
    actor_role: adminProfile.role,
    target_type: 'CREDIT',
    target_id: entryId,
    description: `Approved credit entry ${entryId}`,
  })

  revalidatePath('/admin/inbox')
  return { success: true }
}

export async function rejectCreditEntry(
  entryId: string,
  reason: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseServerActionClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const serviceClient = getSupabaseService()
  const { data: adminProfile } = await serviceClient
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (
    !adminProfile ||
    !isAdminOrMod(adminProfile.role)
  ) {
    return { success: false, error: 'Unauthorized' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (serviceClient as any)
    .from('credit_entries')
    .update({
      status: 'rejected',
      rejection_reason: reason.trim() || null,
    })
    .eq('id', entryId)

  if (error) {
    return { success: false, error: error.message }
  }

  void logAuditEvent({
    category: 'admin',
    action: 'admin.credit_rejected',
    severity: 'warning',
    actor_id: user.id,
    actor_role: adminProfile.role,
    target_type: 'CREDIT',
    target_id: entryId,
    description: `Rejected credit entry ${entryId}`,
    metadata: { rejection_reason: reason.trim() },
  })

  revalidatePath('/admin/inbox')
  return { success: true }
}

// --- Phase 15 additions: Support Tickets ---

/**
 * List all support tickets with optional status filter, joined with user profiles.
 */
export async function listSupportTickets(
  statusFilter?: TicketStatus | 'all',
): Promise<{ success: true; tickets: SupportTicket[] } | { success: false; error: string }> {
  try {
    const supabase = getSupabaseService() as any // eslint-disable-line @typescript-eslint/no-explicit-any

    let query = supabase
      .from('support_tickets')
      .select('id, session_id, user_id, anonymous_id, question_summary, status, created_at, resolved_at, resolved_by')
      .order('created_at', { ascending: false })

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    const { data: rows, error } = await query

    if (error) {
      return { success: false, error: error.message }
    }

    if (!rows || rows.length === 0) {
      return { success: true, tickets: [] }
    }

    // Batch-fetch profiles for user tickets
    const userIds = [...new Set((rows as any[]).filter((r) => r.user_id).map((r) => r.user_id as string))]
    const profileMap: Record<string, { full_name: string | null; email: string | null }> = {}

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds)

      for (const p of profiles ?? []) {
        profileMap[p.id] = { full_name: p.full_name, email: p.email }
      }
    }

    const tickets: SupportTicket[] = (rows as any[]).map((r) => {
      const profile = r.user_id ? (profileMap[r.user_id] ?? null) : null
      return {
        id: r.id,
        session_id: r.session_id,
        user_id: r.user_id,
        anonymous_id: r.anonymous_id,
        question_summary: r.question_summary,
        status: r.status as TicketStatus,
        ticket_type: (r.ticket_type ?? 'human_escalation') as 'human_escalation' | 'unanswered_question',
        rejection_reason: r.rejection_reason ?? null,
        created_at: r.created_at,
        resolved_at: r.resolved_at,
        resolved_by: r.resolved_by,
        user_name: profile?.full_name ?? null,
        user_email: profile?.email ?? null,
      }
    })

    return { success: true, tickets }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Update the status of a support ticket. Sets resolved_at/resolved_by if resolved.
 */
export async function updateTicketStatus(
  ticketId: string,
  status: TicketStatus,
  adminUserId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    if (!UUID_REGEX.test(ticketId)) {
      return { success: false, error: 'Invalid ticket ID format' }
    }

    const updatePayload: Record<string, unknown> = { status }

    if (status === 'resolved') {
      updatePayload.resolved_at = new Date().toISOString()
      updatePayload.resolved_by = adminUserId
    } else {
      updatePayload.resolved_at = null
      updatePayload.resolved_by = null
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (getSupabaseService() as any)
      .from('support_tickets')
      .update(updatePayload)
      .eq('id', ticketId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/inbox')
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Reply to a support ticket by inserting an assistant message and updating ticket/session state.
 */
export async function replyToTicket(
  ticketId: string,
  sessionId: string,
  replyContent: string,
  adminUserId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    if (!UUID_REGEX.test(ticketId)) {
      return { success: false, error: 'Invalid ticket ID format' }
    }
    if (!UUID_REGEX.test(sessionId)) {
      return { success: false, error: 'Invalid session ID format' }
    }
    if (!replyContent || !replyContent.trim()) {
      return { success: false, error: 'Reply content is required' }
    }

    void adminUserId // used for audit purposes — could attach to message metadata in future

    const supabase = getSupabaseService() as any // eslint-disable-line @typescript-eslint/no-explicit-any
    const now = new Date().toISOString()

    // Insert assistant message into chat_messages
    const { error: msgErr } = await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        role: 'assistant',
        content: replyContent.trim(),
        created_at: now,
      })

    if (msgErr) {
      return { success: false, error: msgErr.message }
    }

    // Update session last_message_at
    await supabase
      .from('chat_sessions')
      .update({ last_message_at: now })
      .eq('id', sessionId)

    // Update ticket status to 'in_progress' if currently 'open'
    await supabase
      .from('support_tickets')
      .update({ status: 'in_progress' })
      .eq('id', ticketId)
      .eq('status', 'open')

    revalidatePath('/admin/inbox')
    revalidatePath('/admin/chatbot')
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

// --- Phase 18 additions: Event Approve/Reject ---

/**
 * Approve a pending_review event — sets status to 'published' and writes audit log.
 */
export async function approveEvent(
  eventId: string,
): Promise<{ success: boolean; error?: string }> {
  // 1. Auth guard — require admin or moderator role
  const supabase = await createSupabaseServerActionClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const serviceClient = getSupabaseService()
  const { data: adminProfile } = await serviceClient
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (
    !adminProfile ||
    !isAdminOrMod(adminProfile.role)
  ) {
    return { success: false, error: 'Unauthorized' }
  }

  // 2. Load event to verify it exists and is pending_review
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: event } = await (serviceClient as any)
    .from('events')
    .select('id, status')
    .eq('id', eventId)
    .single()

  if (!event || event.status !== 'pending_review') {
    return { success: false, error: 'Event not found or already reviewed' }
  }

  // 3. Update status to published
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (serviceClient as any)
    .from('events')
    .update({ status: 'published' })
    .eq('id', eventId)

  if (error) {
    return { success: false, error: error.message }
  }

  // 4. Write event_audit_log entry
  await writeEventAuditLog({
    event_id: eventId,
    action: 'status_changed',
    performed_by: user.id,
    performed_by_role: adminProfile.role,
    changes: { old_status: 'pending_review', new_status: 'published' },
  })

  void logAuditEvent({
    category: 'admin',
    action: 'admin.event_status_changed',
    actor_id: user.id,
    actor_role: adminProfile.role,
    target_type: 'EVENT',
    target_id: eventId,
    description: `Approved event ${eventId} (pending_review → published)`,
    metadata: { old_status: 'pending_review', new_status: 'published' },
  })

  // 5. Revalidate
  revalidatePath('/admin/inbox')
  return { success: true }
}

/**
 * Reject a pending_review event — sets status to 'rejected', saves reason, writes audit log.
 */
export async function rejectEvent(
  eventId: string,
  reason: string,
): Promise<{ success: boolean; error?: string }> {
  // 1. Auth guard — require admin or moderator role
  const supabase = await createSupabaseServerActionClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const serviceClient = getSupabaseService()
  const { data: adminProfile } = await serviceClient
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (
    !adminProfile ||
    !isAdminOrMod(adminProfile.role)
  ) {
    return { success: false, error: 'Unauthorized' }
  }

  // 2. Validate reason
  if (!reason || reason.trim().length < 10) {
    return { success: false, error: 'Rejection reason must be at least 10 characters' }
  }

  // 3. Load event to verify it exists and is pending_review
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: event } = await (serviceClient as any)
    .from('events')
    .select('id, status')
    .eq('id', eventId)
    .single()

  if (!event || event.status !== 'pending_review') {
    return { success: false, error: 'Event not found or already reviewed' }
  }

  // 4. Update status to rejected with reason
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (serviceClient as any)
    .from('events')
    .update({
      status: 'rejected',
      rejection_reason: reason.trim(),
    })
    .eq('id', eventId)

  if (error) {
    return { success: false, error: error.message }
  }

  // 5. Write event_audit_log entry
  await writeEventAuditLog({
    event_id: eventId,
    action: 'status_changed',
    performed_by: user.id,
    performed_by_role: adminProfile.role,
    changes: { old_status: 'pending_review', new_status: 'rejected', rejection_reason: reason.trim() },
  })

  void logAuditEvent({
    category: 'admin',
    action: 'admin.event_status_changed',
    severity: 'warning',
    actor_id: user.id,
    actor_role: adminProfile.role,
    target_type: 'EVENT',
    target_id: eventId,
    description: `Rejected event ${eventId} (pending_review → rejected)`,
    metadata: { old_status: 'pending_review', new_status: 'rejected', rejection_reason: reason.trim() },
  })

  // 6. Revalidate
  revalidatePath('/admin/inbox')
  return { success: true }
}

// --- Phase 24 additions: Course Approve/Reject ---

/**
 * Approve a pending_review course — sets status to 'published' and writes audit log.
 */
export async function approveCourse(
  courseId: string,
): Promise<{ success: boolean; error?: string }> {
  // 1. Auth guard — require admin or moderator role
  const supabase = await createSupabaseServerActionClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const serviceClient = getSupabaseService()
  const { data: adminProfile } = await serviceClient
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (
    !adminProfile ||
    !isAdminOrMod(adminProfile.role)
  ) {
    return { success: false, error: 'Unauthorized' }
  }

  // 2. Load course to verify it exists and is pending_review
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: course } = await (serviceClient as any)
    .from('courses')
    .select('id, status')
    .eq('id', courseId)
    .single()

  if (!course || course.status !== 'pending_review') {
    return { success: false, error: 'Course not found or already reviewed' }
  }

  // 3. Update status to published
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (serviceClient as any)
    .from('courses')
    .update({ status: 'published' })
    .eq('id', courseId)

  if (error) {
    return { success: false, error: error.message }
  }

  // 4. Write course_audit_log entry
  await writeCourseAuditLog({
    course_id: courseId,
    action: 'status_changed',
    performed_by: user.id,
    performed_by_role: adminProfile.role,
    changes: { old_status: 'pending_review', new_status: 'published' },
  })

  void logAuditEvent({
    category: 'admin',
    action: 'admin.course_status_changed',
    actor_id: user.id,
    actor_role: adminProfile.role,
    target_type: 'COURSE',
    target_id: courseId,
    description: `Approved course ${courseId} (pending_review → published)`,
    metadata: { old_status: 'pending_review', new_status: 'published' },
  })

  // 5. Revalidate
  revalidatePath('/admin/inbox')
  return { success: true }
}

/**
 * Reject a pending_review course — sets status to 'rejected', saves reason, writes audit log.
 */
export async function rejectCourse(
  courseId: string,
  reason: string,
): Promise<{ success: boolean; error?: string }> {
  // 1. Auth guard — require admin or moderator role
  const supabase = await createSupabaseServerActionClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const serviceClient = getSupabaseService()
  const { data: adminProfile } = await serviceClient
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (
    !adminProfile ||
    !isAdminOrMod(adminProfile.role)
  ) {
    return { success: false, error: 'Unauthorized' }
  }

  // 2. Validate reason
  if (!reason || reason.trim().length < 10) {
    return { success: false, error: 'Rejection reason must be at least 10 characters' }
  }

  // 3. Load course to verify it exists and is pending_review
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: course } = await (serviceClient as any)
    .from('courses')
    .select('id, status')
    .eq('id', courseId)
    .single()

  if (!course || course.status !== 'pending_review') {
    return { success: false, error: 'Course not found or already reviewed' }
  }

  // 4. Update status to rejected with reason
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (serviceClient as any)
    .from('courses')
    .update({
      status: 'rejected',
      rejection_reason: reason.trim(),
    })
    .eq('id', courseId)

  if (error) {
    return { success: false, error: error.message }
  }

  // 5. Write course_audit_log entry
  await writeCourseAuditLog({
    course_id: courseId,
    action: 'status_changed',
    performed_by: user.id,
    performed_by_role: adminProfile.role,
    changes: { old_status: 'pending_review', new_status: 'rejected', rejection_reason: reason.trim() },
  })

  void logAuditEvent({
    category: 'admin',
    action: 'admin.course_status_changed',
    severity: 'warning',
    actor_id: user.id,
    actor_role: adminProfile.role,
    target_type: 'COURSE',
    target_id: courseId,
    description: `Rejected course ${courseId} (pending_review → rejected)`,
    metadata: { old_status: 'pending_review', new_status: 'rejected', rejection_reason: reason.trim() },
  })

  // 6. Revalidate
  revalidatePath('/admin/inbox')
  return { success: true }
}
