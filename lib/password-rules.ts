export interface PasswordRule {
  label: string
  test: (password: string) => boolean
}

export const PASSWORD_RULES: PasswordRule[] = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'One number', test: (p) => /[0-9]/.test(p) },
  { label: 'One special character (!@#$...)', test: (p) => /[!@#$%^&*()_+\-=\[\]{}|;':",.<>?/~`]/.test(p) },
]

export function isPasswordStrong(password: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(password))
}

export function validatePasswordServer(password: string): string | null {
  if (!password) return 'Password is required'
  for (const rule of PASSWORD_RULES) {
    if (!rule.test(password)) return `Password must have: ${rule.label.toLowerCase()}`
  }
  return null
}
