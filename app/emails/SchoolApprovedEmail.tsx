import * as React from 'react'
import { Text, Button, Section } from '@react-email/components'
import { BaseLayout } from './layouts/BaseLayout'

interface Props {
  firstName: string
  schoolName: string
}

export function SchoolApprovedEmail({ firstName, schoolName }: Props) {
  return (
    <BaseLayout previewText={`${schoolName} is now live on GOYA!`}>
      <Section style={{ textAlign: 'center', margin: '0 0 32px' }}>
        <Text style={{ fontSize: '48px', margin: '0 0 8px' }}>🏫</Text>
        <Text style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f2044', margin: 0 }}>
          Your School is Live!
        </Text>
      </Section>

      <Text style={{ color: '#374151', fontSize: '15px', lineHeight: '1.7', margin: '0 0 16px' }}>
        Great news, {firstName}! <strong>{schoolName}</strong> has been approved and is now visible in the GOYA school directory.
      </Text>

      <Text style={{ color: '#374151', fontSize: '15px', lineHeight: '1.7', margin: '0 0 24px' }}>
        Students and practitioners around the world can now find and connect with your school.
      </Text>

      <Section style={{ textAlign: 'center', margin: '32px 0' }}>
        <Button
          href="https://globalonlineyogaassociation.org/dashboard"
          style={{ backgroundColor: '#4E87A0', color: 'white', padding: '14px 32px', borderRadius: '8px', fontWeight: 'bold', fontSize: '15px', textDecoration: 'none', display: 'inline-block' }}
        >
          View Your School →
        </Button>
      </Section>

      <Text style={{ color: '#94a3b8', fontSize: '13px', margin: '32px 0 0', borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
        Questions? Simply reply to this email — we're here to help.
      </Text>
    </BaseLayout>
  )
}

export default SchoolApprovedEmail
