import * as React from 'react'
import { Text, Button, Section } from '@react-email/components'
import { BaseLayout } from './layouts/BaseLayout'

interface Props {
  firstName: string
  memberType: 'student' | 'teacher' | 'wellness_practitioner'
}

export function OnboardingCompleteEmail({ firstName, memberType }: Props) {
  const isStudent = memberType === 'student'

  const subject = isStudent
    ? 'Your GOYA profile is live!'
    : 'Your registration is under review'

  const heading = isStudent
    ? `You're a GOYA Member, ${firstName}! 🎉`
    : `We've received your registration, ${firstName}`

  const body = isStudent
    ? `You are now a GOYA Student Member. Your profile is live in our directory and you have full access to the GOYA community, Academy courses, and events.`
    : memberType === 'teacher'
    ? `Thank you for registering as a Certified Yoga Teacher with GOYA. Our verification team will review your credentials and certificate within 3–5 business days. You'll receive an email notification once the review is complete.`
    : `Thank you for registering as a Wellness Practitioner with GOYA. Our verification team will review your credentials within 3–5 business days. You'll receive an email notification once the review is complete.`

  const ctaLabel = isStudent ? 'Go to Dashboard →' : 'View Your Profile →'
  const ctaHref = isStudent
    ? 'https://globalonlineyogaassociation.org/dashboard'
    : 'https://globalonlineyogaassociation.org/profile'

  return (
    <BaseLayout previewText={subject}>
      <Text style={{ fontSize: '22px', fontWeight: 'bold', color: '#0f2044', margin: '0 0 16px' }}>
        {heading}
      </Text>
      <Text style={{ color: '#374151', fontSize: '15px', lineHeight: '1.7', margin: '0 0 24px' }}>
        {body}
      </Text>

      {!isStudent && (
        <Section style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '16px 20px', margin: '24px 0' }}>
          <Text style={{ color: '#92400e', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
            ⏳ <strong>Verification in progress.</strong> You can still explore GOYA while your credentials are being reviewed.
          </Text>
        </Section>
      )}

      <Section style={{ textAlign: 'center', margin: '32px 0' }}>
        <Button
          href={ctaHref}
          style={{ backgroundColor: '#4E87A0', color: 'white', padding: '14px 32px', borderRadius: '8px', fontWeight: 'bold', fontSize: '15px', textDecoration: 'none', display: 'inline-block' }}
        >
          {ctaLabel}
        </Button>
      </Section>

      <Text style={{ color: '#94a3b8', fontSize: '13px', margin: '32px 0 0', borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
        Questions? Simply reply to this email — we're here to help.
      </Text>
    </BaseLayout>
  )
}

export default OnboardingCompleteEmail
