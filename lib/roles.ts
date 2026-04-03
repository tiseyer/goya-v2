/**
 * Role hierarchy helpers — single source of truth for all role checks.
 *
 * Role hierarchy: superuser > admin > moderator > teacher/student/wellness_practitioner
 *
 * IMPORTANT: superuser is invisible in the UI. It always displays as "Admin".
 * Never expose the "superuser" string to users — use displayRole() for all UI output.
 */

/** True for admin AND superuser roles */
export function isAdminOrAbove(role: string | undefined | null): boolean {
  return role === 'admin' || role === 'superuser';
}

/** True for admin, superuser, AND moderator */
export function isAdminOrMod(role: string | undefined | null): boolean {
  return role === 'admin' || role === 'superuser' || role === 'moderator';
}

/** True only for superuser */
export function isSuperuser(role: string | undefined | null): boolean {
  return role === 'superuser';
}

/**
 * Display role for UI — superuser always shows as 'admin'.
 * This ensures superuser is invisible to all users in the UI.
 */
export function displayRole(role: string | undefined | null): string {
  if (role === 'superuser') return 'admin';
  return role ?? 'student';
}

/**
 * Whether currentUser can delete targetUser.
 * - Superusers are NEVER deletable by anyone
 * - Admins are only deletable by superusers
 * - Cannot delete yourself
 */
export function canDeleteUser(
  currentUserRole: string | undefined,
  currentUserId: string,
  targetRole: string,
  targetId: string
): { allowed: boolean; reason?: string } {
  if (currentUserId === targetId) return { allowed: false, reason: 'Cannot delete yourself' };
  if (targetRole === 'superuser') return { allowed: false, reason: 'Cannot be deleted' };
  if (targetRole === 'admin' && !isSuperuser(currentUserRole)) {
    return { allowed: false, reason: 'Only superusers can delete admins' };
  }
  return { allowed: true };
}
