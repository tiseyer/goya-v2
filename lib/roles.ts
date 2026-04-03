/**
 * Role hierarchy helpers — single source of truth for all role checks.
 *
 * Role hierarchy: admin > moderator > teacher/student/wellness_practitioner
 *
 * Superuser is NOT a role — it's a boolean flag (is_superuser) on the profile.
 * Superusers have role='admin' and is_superuser=true. The flag only grants
 * extra permissions (e.g. deleting admin accounts). All UI treats them as admin.
 */

/** True for admin role */
export function isAdminOrAbove(role: string | undefined | null): boolean {
  return role === 'admin';
}

/** True for admin or moderator */
export function isAdminOrMod(role: string | undefined | null): boolean {
  return role === 'admin' || role === 'moderator';
}

/** Display role for UI */
export function displayRole(role: string | undefined | null): string {
  return role ?? 'student';
}

/**
 * Whether currentUser can delete targetUser.
 * - Superusers (is_superuser=true) are NEVER deletable by anyone
 * - Admins are only deletable by superusers
 * - Cannot delete yourself
 */
export function canDeleteUser(
  callerIsSuperuser: boolean,
  currentUserId: string,
  targetRole: string,
  targetIsSuperuser: boolean,
  targetId: string
): { allowed: boolean; reason?: string } {
  if (currentUserId === targetId) return { allowed: false, reason: 'Cannot delete yourself' };
  if (targetIsSuperuser) return { allowed: false, reason: 'Cannot be deleted' };
  if (targetRole === 'admin' && !callerIsSuperuser) {
    return { allowed: false, reason: 'Only superusers can delete admins' };
  }
  return { allowed: true };
}
