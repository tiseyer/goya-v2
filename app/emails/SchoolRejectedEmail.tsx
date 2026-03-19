import * as React from 'react'
import { Text, Button, Section } from '@react-email/components'
import { BaseLayout } from './layouts/BaseLayout'

interface Props {
  firstName: string
  schoolName: string
  reason?: string
}

export function SchoolRejectedEmail({ firstName, schoolName, reason }: Props) {
  return (
    <BaseLayout previewText="Update required on your GOYA school registration">
      <Text style={{ fontSize: '22px', fontWeight: 'bold', color: '#0f2044', margin: '0 0 16px' }}>
        Update Required — {schoolName}
      </Text>

      <Text style={{ color: '#374151', fontSize: '15px', lineHeight: '1.7', margin: '0 0 24px' }}>
        Hi {firstName}, thank you for submitting <strong>{schoolName}</strong> for inclusion in the GOYA directory. After review, we were unable to approve the registration at this time.
      </Text>

      {reason && (
        <Section style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '16px 20px', margin: '24px 0' }}>
          <Text style={{ color: '#991b1b', fontSize: '13px', margin: '0 0 4px', fontWeight: 'bold' }}>
            Reason
          </Text>
          <Text style={{ color: '#7f1d1d', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
            {reason}
          </Text>
        </Section>
      )}

      <Text style={{ color: '#374151', fontSize: '15px', lineHeight: '1.7', margin: '24px 0' }}>
        Please reply to this email to discuss next steps — we're happy to help you get your school listed.
      </Text>

      <Text style={{ color: '#94a3b8', fontSize: '13px', margin: '32px 0 0', borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
        Questions? Simply reply to this email — we're here to help.
      </Text>
    </BaseLayout>
  )
}

export default SchoolRejectedEmail
