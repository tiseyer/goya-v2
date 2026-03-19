import * as React from 'react'
import { Text, Button, Section } from '@react-email/components'
import { BaseLayout } from './layouts/BaseLayout'

interface Props {
  firstName: string
  designation: string
}

export function VerificationApprovedEmail({ firstName, designation }: Props) {
  return (
    <BaseLayout previewText={`Congratulations ${firstName} — your GOYA status has been verified!`}>
      <Section style={{ textAlign: 'center', margin: '0 0 32px' }}>
        <Text style={{ fontSize: '48px', margin: '0 0 8px' }}>🎉</Text>
        <Text style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f2044', margin: 0 }}>
          You're Verified, {firstName}!
        </Text>
      </Section>

      <Text style={{ color: '#374151', fontSize: '15px', lineHeight: '1.7', margin: '0 0 16px' }}>
        Congratulations! Your GOYA teacher registration has been reviewed and approved. You are now a verified GOYA member.
      </Text>

      <Section style={{ backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', padding: '20px', margin: '24px 0', textAlign: 'center' }}>
        <Text style={{ color: '#166534', fontSize: '13px', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Your Verified Designation
        </Text>
        <Text style={{ color: '#166534', fontSize: '22px', fontWeight: 'bold', margin: 0 }}>
          {designation}
        </Text>
      </Section>

      <Text style={{ color: '#374151', fontSize: '15px', lineHeight: '1.7', margin: '16px 0 24px' }}>
        Your verified status is now visible on your public profile. You can also register a School, add additional teaching designations, and upgrade to Experienced Teacher status from your dashboard.
      </Text>

      <Section style={{ textAlign: 'center', margin: '32px 0' }}>
        <Button
          href="https://globalonlineyogaassociation.org/dashboard"
          style={{ backgroundColor: '#4E87A0', color: 'white', padding: '14px 32px', borderRadius: '8px', fontWeight: 'bold', fontSize: '15px', textDecoration: 'none', display: 'inline-block' }}
        >
          View Your Profile →
        </Button>
      </Section>

      <Text style={{ color: '#94a3b8', fontSize: '13px', margin: '32px 0 0', borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
        Questions? Simply reply to this email — we're here to help.
      </Text>
    </BaseLayout>
  )
}

export default VerificationApprovedEmail
