import * as React from 'react'
import { Text, Button, Section } from '@react-email/components'
import { BaseLayout } from './layouts/BaseLayout'

interface Props {
  recipientFirstName: string
  senderName: string
  messagePreview: string
}

export function NewMessageEmail({ recipientFirstName, senderName, messagePreview }: Props) {
  const preview = messagePreview.length > 150
    ? messagePreview.slice(0, 150) + '…'
    : messagePreview

  return (
    <BaseLayout previewText={`${senderName} sent you a message on GOYA`}>
      <Text style={{ fontSize: '22px', fontWeight: 'bold', color: '#0f2044', margin: '0 0 8px' }}>
        New Message, {recipientFirstName}
      </Text>
      <Text style={{ color: '#64748b', fontSize: '15px', margin: '0 0 24px' }}>
        <strong>{senderName}</strong> sent you a new message on GOYA.
      </Text>

      <Section style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px 20px', margin: '24px 0' }}>
        <Text style={{ color: '#374151', fontSize: '14px', lineHeight: '1.6', margin: 0, fontStyle: 'italic' }}>
          "{preview}"
        </Text>
      </Section>

      <Section style={{ textAlign: 'center', margin: '32px 0' }}>
        <Button
          href="https://globalonlineyogaassociation.org/messages"
          style={{ backgroundColor: '#4E87A0', color: 'white', padding: '14px 32px', borderRadius: '8px', fontWeight: 'bold', fontSize: '15px', textDecoration: 'none', display: 'inline-block' }}
        >
          Read Message →
        </Button>
      </Section>

      <Text style={{ color: '#94a3b8', fontSize: '13px', margin: '32px 0 0', borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
        Reply to this email to contact our support team.
      </Text>
    </BaseLayout>
  )
}

export default NewMessageEmail
