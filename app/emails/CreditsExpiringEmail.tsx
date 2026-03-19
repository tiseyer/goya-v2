import * as React from 'react'
import { Text, Button, Section } from '@react-email/components'
import { BaseLayout } from './layouts/BaseLayout'

interface Props {
  firstName: string
  amount: number
  creditType: string
  expiryDate: string
}

export function CreditsExpiringEmail({ firstName, amount, creditType, expiryDate }: Props) {
  return (
    <BaseLayout previewText={`Your GOYA ${creditType} credits expire on ${expiryDate}`}>
      <Text style={{ fontSize: '22px', fontWeight: 'bold', color: '#0f2044', margin: '0 0 16px' }}>
        ⚠️ Credits Expiring Soon, {firstName}
      </Text>

      <Text style={{ color: '#374151', fontSize: '15px', lineHeight: '1.7', margin: '0 0 24px' }}>
        This is a reminder that some of your GOYA credits are expiring soon.
      </Text>

      <Section style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '20px', margin: '24px 0', textAlign: 'center' }}>
        <Text style={{ color: '#92400e', fontSize: '13px', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Expiring Credits
        </Text>
        <Text style={{ color: '#92400e', fontSize: '28px', fontWeight: 'bold', margin: '4px 0' }}>
          {amount} {creditType}
        </Text>
        <Text style={{ color: '#92400e', fontSize: '14px', margin: '4px 0 0' }}>
          Expires: {expiryDate}
        </Text>
      </Section>

      <Text style={{ color: '#374151', fontSize: '15px', lineHeight: '1.7', margin: '24px 0' }}>
        Submit your credits before they expire to ensure they count toward your requirements.
      </Text>

      <Section style={{ textAlign: 'center', margin: '32px 0' }}>
        <Button
          href="https://globalonlineyogaassociation.org/dashboard"
          style={{ backgroundColor: '#4E87A0', color: 'white', padding: '14px 32px', borderRadius: '8px', fontWeight: 'bold', fontSize: '15px', textDecoration: 'none', display: 'inline-block' }}
        >
          Submit New Credits →
        </Button>
      </Section>

      <Text style={{ color: '#94a3b8', fontSize: '13px', margin: '32px 0 0', borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
        Questions? Simply reply to this email — we're here to help.
      </Text>
    </BaseLayout>
  )
}

export default CreditsExpiringEmail
