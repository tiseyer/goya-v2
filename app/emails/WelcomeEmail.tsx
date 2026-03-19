import * as React from 'react'
import { Text, Button, Section } from '@react-email/components'
import { BaseLayout } from './layouts/BaseLayout'

interface Props {
  firstName: string
  mrn: string
}

export function WelcomeEmail({ firstName, mrn }: Props) {
  return (
    <BaseLayout previewText={`Welcome to GOYA, ${firstName}!`}>
      <Text style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f2044', margin: '0 0 16px' }}>
        Welcome, {firstName}! 🙏
      </Text>
      <Text style={{ color: '#374151', fontSize: '16px', lineHeight: '1.6', margin: '0 0 24px' }}>
        Your GOYA account has been created successfully. We're thrilled to have you as part of the Global Online Yoga Association community.
      </Text>

      {/* MRN */}
      <Section style={{ backgroundColor: '#f0f7ff', borderRadius: '8px', padding: '20px', margin: '24px 0', textAlign: 'center' }}>
        <Text style={{ color: '#64748b', fontSize: '12px', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Your Member Registration Number
        </Text>
        <Text style={{ color: '#0f2044', fontSize: '28px', fontWeight: 'bold', letterSpacing: '4px', margin: 0 }}>
          {mrn}
        </Text>
        <Text style={{ color: '#64748b', fontSize: '12px', margin: '4px 0 0' }}>
          Keep this safe — you may need it to access member benefits
        </Text>
      </Section>

      <Text style={{ color: '#374151', fontSize: '15px', lineHeight: '1.6', margin: '24px 0' }}>
        To complete your membership and appear in our global directory, please take a few minutes to set up your profile:
      </Text>

      <Section style={{ textAlign: 'center', margin: '32px 0' }}>
        <Button
          href="https://globalonlineyogaassociation.org/onboarding"
          style={{ backgroundColor: '#4E87A0', color: 'white', padding: '14px 32px', borderRadius: '8px', fontWeight: 'bold', fontSize: '15px', textDecoration: 'none', display: 'inline-block' }}
        >
          Complete Your Profile →
        </Button>
      </Section>

      <Text style={{ color: '#374151', fontSize: '14px', lineHeight: '1.6', margin: '24px 0' }}>
        With your GOYA membership you can:
      </Text>
      <Text style={{ color: '#374151', fontSize: '14px', lineHeight: '1.8', margin: '0 0 24px', paddingLeft: '16px' }}>
        • Connect with yoga teachers and practitioners worldwide{'\n'}
        • Access exclusive courses in the GOYA Academy{'\n'}
        • Attend events and workshops from the global community{'\n'}
        • Build your professional profile and grow your practice
      </Text>

      <Text style={{ color: '#94a3b8', fontSize: '13px', margin: '32px 0 0', borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
        Questions? Simply reply to this email — we're here to help.
      </Text>
    </BaseLayout>
  )
}

export default WelcomeEmail
