import * as React from 'react'
import { Text, Button, Section } from '@react-email/components'
import { BaseLayout } from './layouts/BaseLayout'

interface Props {
  firstName: string
  reason?: string
}

export function VerificationRejectedEmail({ firstName, reason }: Props) {
  return (
    <BaseLayout previewText="Update required on your GOYA registration">
      <Text style={{ fontSize: '22px', fontWeight: 'bold', color: '#0f2044', margin: '0 0 16px' }}>
        Update Required, {firstName}
      </Text>

      <Text style={{ color: '#374151', fontSize: '15px', lineHeight: '1.7', margin: '0 0 24px' }}>
        Thank you for submitting your GOYA registration. After reviewing your application, our team was unable to approve it at this time.
      </Text>

      {reason && (
        <Section style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '16px 20px', margin: '24px 0' }}>
          <Text style={{ color: '#991b1b', fontSize: '13px', margin: '0 0 4px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Reason
          </Text>
          <Text style={{ color: '#7f1d1d', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
            {reason}
          </Text>
        </Section>
      )}

      <Text style={{ color: '#374151', fontSize: '15px', lineHeight: '1.7', margin: '24px 0' }}>
        If you believe this is an error, or you have additional documentation to provide, please reply to this email and our team will be happy to assist you.
      </Text>

      <Section style={{ textAlign: 'center', margin: '32px 0' }}>
        <Button
          href="mailto:member@globalonlineyogaassociation.org"
          style={{ backgroundColor: '#374151', color: 'white', padding: '14px 32px', borderRadius: '8px', fontWeight: 'bold', fontSize: '15px', textDecoration: 'none', display: 'inline-block' }}
        >
          Contact Support
        </Button>
      </Section>

      <Text style={{ color: '#94a3b8', fontSize: '13px', margin: '32px 0 0', borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
        Please reply to this email if you have any questions. We're here to help.
      </Text>
    </BaseLayout>
  )
}

export default VerificationRejectedEmail
