/** Map user roles to the doc audiences they can access */
export function getAudiencesForRole(role: string | null): string[] {
  const map: Record<string, string[]> = {
    student: ['student'],
    teacher: ['teacher', 'student'],
    wellness_practitioner: ['teacher', 'student'],
    school: ['teacher', 'student'],
    moderator: ['moderator', 'teacher', 'student'],
    admin: ['admin', 'moderator', 'teacher', 'student', 'developer'],
  }
  return map[role ?? 'student'] ?? map.student
}
