import * as React from 'react'
import { Text, Button, Section } from '@react-email/components'
import { BaseLayout } from './layouts/BaseLayout'

interface Props {
  pendingVerifications: number
  pendingCreditSubmissions: number
  pendingSchools: number
  contactFormSubmissions: number
}

export function AdminInboxDigestEmail({
  pendingVerifications,
  pendingCreditSubmissions,
  pendingSchools,
  contactFormSubmissions,
}: Props) {
  const total = pendingVerifications + pendingCreditSubmissions + pendingSchools + contactFormSubmissions

  const items = [
    { label: 'Pending Verifications', count: pendingVerifications, color: '#f59e0b' },
    { label: 'Pending Credit Submissions', count: pendingCreditSubmissions, color: '#3b82f6' },
    { label: 'Pending School Registrations', count: pendingSchools, color: '#8b5cf6' },
    { label: 'Contact Form Submissions', count: contactFormSubmissions, color: '#10b981' },
  ]

  return (
    <BaseLayout previewText={`GOYA Admin: ${total} items need your attention`}>
      <Text style={{ fontSize: '22px', fontWeight: 'bold', color: '#0f2044', margin: '0 0 8px' }}>
        Weekly Admin Digest
      </Text>
      <Text style={{ color: '#64748b', fontSize: '15px', margin: '0 0 24px' }}>
        Here's a summary of items that need your attention this week.
      </Text>

      <Section style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '20px', margin: '24px 0' }}>
        {items.map(item => (
          <Section key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
            <Text style={{ color: '#374151', fontSize: '14px', margin: 0, display: 'inline' }}>
              {item.label}
            </Text>
            <Text style={{ color: item.count > 0 ? item.color : '#94a3b8', fontSize: '14px', fontWeight: 'bold', margin: 0, display: 'inline' }}>
              {item.count}
            </Text>
          </Section>
        ))}
      </Section>

      <Section style={{ textAlign: 'center', margin: '32px 0' }}>
        <Button
          href="https://globalonlineyogaassociation.org/admin"
          style={{ backgroundColor: '#0f2044', color: 'white', padding: '14px 32px', borderRadius: '8px', fontWeight: 'bold', fontSize: '15px', textDecoration: 'none', display: 'inline-block' }}
        >
          Go to Admin Dashboard →
        </Button>
      </Section>
    </BaseLayout>
  )
}

export default AdminInboxDigestEmail
