export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'
export type AuthType = 'none' | 'read' | 'write' | 'admin'
export type EndpointCategory =
  | 'Health'
  | 'Users'
  | 'Events'
  | 'Courses'
  | 'Credits'
  | 'Verifications'
  | 'Analytics'
  | 'Add-ons'
  | 'Admin'
  | 'Webhooks'

export interface Endpoint {
  method: HttpMethod
  path: string
  auth: AuthType
  description: string
  category: EndpointCategory
}

export const ENDPOINT_CATEGORIES: EndpointCategory[] = [
  'Health',
  'Users',
  'Events',
  'Courses',
  'Credits',
  'Verifications',
  'Analytics',
  'Add-ons',
  'Admin',
  'Webhooks',
]

export const ENDPOINT_REGISTRY: Endpoint[] = [
  // Health (1)
  { method: 'GET', path: '/api/v1/health', auth: 'none', description: 'Check API availability', category: 'Health' },

  // Users (6)
  { method: 'GET', path: '/api/v1/users', auth: 'read', description: 'List users with filtering and pagination', category: 'Users' },
  { method: 'GET', path: '/api/v1/users/:id', auth: 'read', description: 'Fetch a single user by UUID', category: 'Users' },
  { method: 'PATCH', path: '/api/v1/users/:id', auth: 'write', description: 'Update user role, subscription status, or member type', category: 'Users' },
  { method: 'GET', path: '/api/v1/users/:id/credits', auth: 'read', description: 'List credit entries for a user', category: 'Users' },
  { method: 'GET', path: '/api/v1/users/:id/certifications', auth: 'read', description: 'List certifications for a user', category: 'Users' },
  { method: 'GET', path: '/api/v1/users/:id/verifications', auth: 'read', description: 'Get verification record for a user', category: 'Users' },

  // Events (7)
  { method: 'GET', path: '/api/v1/events', auth: 'read', description: 'List events with filtering and pagination', category: 'Events' },
  { method: 'GET', path: '/api/v1/events/:id', auth: 'read', description: 'Fetch a single event by UUID', category: 'Events' },
  { method: 'POST', path: '/api/v1/events', auth: 'write', description: 'Create an event', category: 'Events' },
  { method: 'PATCH', path: '/api/v1/events/:id', auth: 'write', description: 'Update an event', category: 'Events' },
  { method: 'DELETE', path: '/api/v1/events/:id', auth: 'write', description: 'Soft-delete an event', category: 'Events' },
  { method: 'POST', path: '/api/v1/events/:id/registrations', auth: 'write', description: 'Register a user for an event', category: 'Events' },
  { method: 'DELETE', path: '/api/v1/events/:id/registrations/:userId', auth: 'write', description: 'Remove event registration', category: 'Events' },

  // Courses (8)
  { method: 'GET', path: '/api/v1/courses', auth: 'read', description: 'List courses with filtering and pagination', category: 'Courses' },
  { method: 'GET', path: '/api/v1/courses/:id', auth: 'read', description: 'Fetch a single course by UUID', category: 'Courses' },
  { method: 'POST', path: '/api/v1/courses', auth: 'write', description: 'Create a course', category: 'Courses' },
  { method: 'PATCH', path: '/api/v1/courses/:id', auth: 'write', description: 'Update a course', category: 'Courses' },
  { method: 'DELETE', path: '/api/v1/courses/:id', auth: 'write', description: 'Soft-delete a course', category: 'Courses' },
  { method: 'GET', path: '/api/v1/courses/:id/enrollments', auth: 'read', description: 'List enrollments for a course', category: 'Courses' },
  { method: 'POST', path: '/api/v1/courses/:id/enrollments', auth: 'write', description: 'Enroll a user in a course', category: 'Courses' },
  { method: 'PATCH', path: '/api/v1/courses/:id/enrollments/:userId', auth: 'write', description: 'Update enrollment progress', category: 'Courses' },

  // Credits (5)
  { method: 'GET', path: '/api/v1/credits', auth: 'read', description: 'List credit entries with filtering', category: 'Credits' },
  { method: 'GET', path: '/api/v1/credits/:id', auth: 'read', description: 'Fetch a single credit entry by UUID', category: 'Credits' },
  { method: 'POST', path: '/api/v1/credits', auth: 'write', description: 'Create a credit entry', category: 'Credits' },
  { method: 'PATCH', path: '/api/v1/credits/:id', auth: 'write', description: 'Update credit status or rejection reason', category: 'Credits' },
  { method: 'GET', path: '/api/v1/credits/summary/:userId', auth: 'read', description: 'Get credit summary totals by type for a user', category: 'Credits' },

  // Verifications (5)
  { method: 'GET', path: '/api/v1/verifications', auth: 'read', description: 'List verification records', category: 'Verifications' },
  { method: 'GET', path: '/api/v1/verifications/:id', auth: 'read', description: 'Fetch a single verification record', category: 'Verifications' },
  { method: 'POST', path: '/api/v1/verifications', auth: 'write', description: 'Initiate a verification for a user', category: 'Verifications' },
  { method: 'PATCH', path: '/api/v1/verifications/:id', auth: 'write', description: 'Update a verification record', category: 'Verifications' },
  { method: 'DELETE', path: '/api/v1/verifications/:id', auth: 'write', description: 'Reset a verification record', category: 'Verifications' },

  // Analytics (5)
  { method: 'GET', path: '/api/v1/analytics/overview', auth: 'read', description: 'Get high-level platform metrics', category: 'Analytics' },
  { method: 'GET', path: '/api/v1/analytics/memberships', auth: 'read', description: 'Get membership growth and breakdown statistics', category: 'Analytics' },
  { method: 'GET', path: '/api/v1/analytics/revenue', auth: 'read', description: 'Get revenue metrics', category: 'Analytics' },
  { method: 'GET', path: '/api/v1/analytics/engagement', auth: 'read', description: 'Get engagement metrics', category: 'Analytics' },
  { method: 'GET', path: '/api/v1/analytics/credits', auth: 'read', description: 'Get CPD credit statistics', category: 'Analytics' },

  // Add-ons (8)
  { method: 'GET', path: '/api/v1/addons', auth: 'read', description: 'List add-on products', category: 'Add-ons' },
  { method: 'GET', path: '/api/v1/addons/:id', auth: 'read', description: 'Fetch a single add-on by UUID', category: 'Add-ons' },
  { method: 'POST', path: '/api/v1/addons', auth: 'write', description: 'Create an add-on product', category: 'Add-ons' },
  { method: 'PATCH', path: '/api/v1/addons/:id', auth: 'write', description: 'Update an add-on product', category: 'Add-ons' },
  { method: 'DELETE', path: '/api/v1/addons/:id', auth: 'write', description: 'Soft-delete an add-on (deactivate)', category: 'Add-ons' },
  { method: 'GET', path: '/api/v1/addons/users/:userId', auth: 'read', description: 'Get all add-ons assigned to a user', category: 'Add-ons' },
  { method: 'POST', path: '/api/v1/addons/users/:userId', auth: 'write', description: 'Assign an add-on to a user', category: 'Add-ons' },
  { method: 'DELETE', path: '/api/v1/addons/users/:userId/:addonId', auth: 'write', description: 'Remove an add-on assignment from a user', category: 'Add-ons' },

  // Admin (4)
  { method: 'GET', path: '/api/v1/admin/settings', auth: 'admin', description: 'Retrieve all site settings', category: 'Admin' },
  { method: 'PATCH', path: '/api/v1/admin/settings', auth: 'admin', description: 'Bulk update multiple settings', category: 'Admin' },
  { method: 'GET', path: '/api/v1/admin/settings/:key', auth: 'admin', description: 'Get a single setting by key', category: 'Admin' },
  { method: 'PATCH', path: '/api/v1/admin/settings/:key', auth: 'admin', description: 'Update a single setting value', category: 'Admin' },

  // Webhooks (3)
  { method: 'POST', path: '/api/v1/webhooks/trigger', auth: 'write', description: 'Receive a generic event trigger', category: 'Webhooks' },
  { method: 'POST', path: '/api/v1/webhooks/payment', auth: 'write', description: 'Report a payment event', category: 'Webhooks' },
  { method: 'POST', path: '/api/v1/webhooks/notify', auth: 'write', description: 'Send notifications to users', category: 'Webhooks' },
]
