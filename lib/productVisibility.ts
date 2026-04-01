export interface ProductVisibilityInput {
  requires_any_of: string[]
  hidden_if_has_any: string[]
  category: string
}

export interface UserVisibilityContext {
  role: string
  designations: string[]
  isSchoolOwner: boolean
}

export function isProductVisible(
  product: ProductVisibilityInput,
  user: UserVisibilityContext
): boolean {
  // Rule 1: hidden_if_has_any wins always
  if (product.hidden_if_has_any.some(d => user.designations.includes(d))) return false

  // Rule 2: school_designation only for school owners
  if (product.category === 'school_designation' && !user.isSchoolOwner) return false

  // Rule 3: no requirements = show to everyone
  if (product.requires_any_of.length === 0) return true

  // Rule 4: check role-based and designation-based requirements
  return product.requires_any_of.some(req => {
    if (req === 'teacher') return user.role === 'teacher'
    if (req === 'school_owner' || req === 'principal_trainer') return user.isSchoolOwner
    if (req === 'student') return user.role === 'student'
    if (req === 'wellness') return user.role === 'wellness_practitioner'
    return user.designations.includes(req)
  })
}
