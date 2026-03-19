import {
  Html, Head, Body, Container, Section,
  Text, Hr, Link,
} from '@react-email/components'
import * as React from 'react'

export function BaseLayout({
  children,
  previewText,
}: {
  children: React.ReactNode
  previewText?: string
}) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#f6f9fc', fontFamily: 'Arial, sans-serif', margin: 0, padding: 0 }}>
        {previewText && (
          <Text style={{ display: 'none', maxHeight: 0, overflow: 'hidden', opacity: 0 }}>
            {previewText}
          </Text>
        )}

        {/* Header */}
        <Section style={{ backgroundColor: '#0f2044', padding: '24px' }}>
          <Text style={{ color: 'white', fontSize: '28px', fontWeight: 'bold', textAlign: 'center', margin: 0, letterSpacing: '2px' }}>
            GOYA
          </Text>
          <Text style={{ color: '#94a3b8', fontSize: '12px', textAlign: 'center', margin: '4px 0 0' }}>
            Global Online Yoga Association
          </Text>
        </Section>

        {/* Content */}
        <Container style={{ backgroundColor: 'white', maxWidth: '600px', margin: '0 auto', padding: '40px 32px', borderRadius: '0 0 8px 8px' }}>
          {children}
        </Container>

        {/* Footer */}
        <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 32px' }}>
          <Hr style={{ borderColor: '#e2e8f0' }} />
          <Text style={{ color: '#94a3b8', fontSize: '12px', textAlign: 'center', margin: '16px 0 8px' }}>
            © {new Date().getFullYear()} Global Online Yoga Association. All rights reserved.
          </Text>
          <Text style={{ color: '#94a3b8', fontSize: '12px', textAlign: 'center', margin: '4px 0' }}>
            Questions? Reply to this email or contact us at{' '}
            <Link href="mailto:member@globalonlineyogaassociation.org" style={{ color: '#94a3b8' }}>
              member@globalonlineyogaassociation.org
            </Link>
          </Text>
          <Text style={{ color: '#94a3b8', fontSize: '12px', textAlign: 'center', margin: '8px 0 4px' }}>
            <Link href="https://globalonlineyogaassociation.org/privacy" style={{ color: '#94a3b8' }}>Privacy Policy</Link>
            {' · '}
            <Link href="https://globalonlineyogaassociation.org/terms" style={{ color: '#94a3b8' }}>Terms of Use</Link>
            {' · '}
            <Link href="https://globalonlineyogaassociation.org/unsubscribe" style={{ color: '#94a3b8' }}>Unsubscribe</Link>
          </Text>
          <Text style={{ color: '#94a3b8', fontSize: '11px', textAlign: 'center', margin: '4px 0 0' }}>
            GOYA · Canada · Sent in accordance with Canadian anti-spam legislation (CASL).
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
