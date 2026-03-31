export const DEFAULT_TEMPLATES: Record<string, { subject: string; content: string }> = {
  welcome: {
    subject: 'Welcome to GOYA, {{firstName}}!',
    content: `<h1 style="color:#0f2044;margin:0 0 16px;">Welcome, {{firstName}}! 🎉</h1>
<p>Your GOYA account has been created successfully.</p>
<p>Your Member Number (MRN) is: <strong>{{mrn}}</strong></p>
<p>GOYA connects yoga teachers, students, schools, and wellness practitioners from around the world. We're thrilled to have you as part of our community.</p>
<p style="text-align:center;margin-top:32px;">
  <a href="{{loginUrl}}" style="display:inline-block;background-color:#14b8a6;color:white;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:bold;">Complete Your Profile →</a>
</p>`,
  },
  onboarding_complete: {
    subject: 'Your GOYA profile is live!',
    content: `<h1 style="color:#0f2044;margin:0 0 16px;">You're all set, {{firstName}}!</h1>
<p>Your GOYA profile has been created. You are now a <strong>{{memberType}}</strong>.</p>
<p>Explore the Academy, connect with other members, and track your credits and hours — all in one place.</p>
<p style="text-align:center;margin-top:32px;">
  <a href="{{dashboardUrl}}" style="display:inline-block;background-color:#14b8a6;color:white;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:bold;">Go to Dashboard →</a>
</p>`,
  },
  verification_approved: {
    subject: '🎉 Your GOYA status has been verified!',
    content: `<h1 style="color:#0f2044;margin:0 0 16px;">Congratulations, {{firstName}}! 🎉</h1>
<p>Your GOYA registration has been reviewed and <strong>approved</strong>.</p>
<p>Your designation: <strong>{{designation}}</strong></p>
<p>You are now a verified GOYA member. Your profile is live and visible in the member directory.</p>
<p style="text-align:center;margin-top:32px;">
  <a href="{{profileUrl}}" style="display:inline-block;background-color:#14b8a6;color:white;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:bold;">View Your Profile →</a>
</p>`,
  },
  verification_rejected: {
    subject: 'Update required on your GOYA registration',
    content: `<h1 style="color:#0f2044;margin:0 0 16px;">Action Required, {{firstName}}</h1>
<p>Thank you for submitting your GOYA registration. After careful review, we were unable to approve your registration at this time.</p>
<p><strong>Reason:</strong> {{reason}}</p>
<p>Please don't hesitate to reach out — we're happy to help you resolve any issues.</p>
<p style="text-align:center;margin-top:32px;">
  <a href="{{contactUrl}}" style="display:inline-block;background-color:#14b8a6;color:white;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:bold;">Contact Us →</a>
</p>`,
  },
  credits_expiring: {
    subject: '⚠️ Your GOYA credits are expiring soon',
    content: `<h1 style="color:#0f2044;margin:0 0 16px;">Your Credits Are Expiring, {{firstName}}</h1>
<p>This is a reminder that you have <strong>{{amount}} {{creditType}}</strong> expiring on <strong>{{expiryDate}}</strong>.</p>
<p>To maintain your membership status, please ensure you submit the required credits before they expire.</p>
<p style="text-align:center;margin-top:32px;">
  <a href="{{submitUrl}}" style="display:inline-block;background-color:#14b8a6;color:white;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:bold;">Submit New Credits →</a>
</p>`,
  },
  new_message: {
    subject: '{{senderName}} sent you a message on GOYA',
    content: `<h1 style="color:#0f2044;margin:0 0 16px;">You have a new message, {{firstName}}</h1>
<p><strong>{{senderName}}</strong> sent you a message:</p>
<blockquote style="border-left:4px solid #14b8a6;padding:12px 16px;margin:16px 0;background:#f8fafc;border-radius:0 6px 6px 0;color:#475569;">{{messagePreview}}</blockquote>
<p style="text-align:center;margin-top:32px;">
  <a href="{{messagesUrl}}" style="display:inline-block;background-color:#14b8a6;color:white;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:bold;">Read Message →</a>
</p>`,
  },
  school_approved: {
    subject: '🏫 Your school is now live on GOYA!',
    content: `<h1 style="color:#0f2044;margin:0 0 16px;">Your school is live, {{firstName}}! 🏫</h1>
<p><strong>{{schoolName}}</strong> has been approved and is now visible in the GOYA school directory.</p>
<p>Students and teachers from around the world can now discover your school and connect with your teachers.</p>
<p style="text-align:center;margin-top:32px;">
  <a href="{{schoolUrl}}" style="display:inline-block;background-color:#14b8a6;color:white;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:bold;">View Your School →</a>
</p>`,
  },
  school_rejected: {
    subject: 'Update required on your school registration',
    content: `<h1 style="color:#0f2044;margin:0 0 16px;">Action Required, {{firstName}}</h1>
<p>Thank you for submitting <strong>{{schoolName}}</strong> to the GOYA directory. After review, we were unable to approve the registration at this time.</p>
<p><strong>Reason:</strong> {{reason}}</p>
<p>Please reply to this email if you have any questions or would like to appeal this decision.</p>`,
  },
  admin_digest: {
    subject: 'GOYA Admin: {{count}} items need your attention',
    content: `<h1 style="color:#0f2044;margin:0 0 16px;">Weekly Admin Summary</h1>
<p>Here's what's waiting for your review in the GOYA admin inbox:</p>
<table style="width:100%;border-collapse:collapse;margin:16px 0;">
  <tr style="background:#f8fafc;">
    <td style="padding:12px 16px;border:1px solid #e2e8f0;">📋 Pending Verifications</td>
    <td style="padding:12px 16px;border:1px solid #e2e8f0;font-weight:bold;text-align:right;">{{pendingVerifications}}</td>
  </tr>
  <tr>
    <td style="padding:12px 16px;border:1px solid #e2e8f0;">🏅 Pending Credit Submissions</td>
    <td style="padding:12px 16px;border:1px solid #e2e8f0;font-weight:bold;text-align:right;">{{pendingCredits}}</td>
  </tr>
  <tr style="background:#f8fafc;">
    <td style="padding:12px 16px;border:1px solid #e2e8f0;">🏫 Pending School Registrations</td>
    <td style="padding:12px 16px;border:1px solid #e2e8f0;font-weight:bold;text-align:right;">{{pendingSchools}}</td>
  </tr>
  <tr>
    <td style="padding:12px 16px;border:1px solid #e2e8f0;">✉️ New Contact Messages</td>
    <td style="padding:12px 16px;border:1px solid #e2e8f0;font-weight:bold;text-align:right;">{{pendingContacts}}</td>
  </tr>
</table>
<p style="text-align:center;margin-top:32px;">
  <a href="{{inboxUrl}}" style="display:inline-block;background-color:#14b8a6;color:white;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:bold;">Go to Inbox →</a>
</p>`,
  },
  password_reset: {
    subject: 'Reset your GOYA password',
    content: `<h1 style="color:#0f2044;margin:0 0 16px;">Password Reset Request</h1>
<p>Hi {{firstName}},</p>
<p>We received a request to reset your GOYA password. Click the button below to create a new password. This link expires in <strong>{{expiryMinutes}} minutes</strong>.</p>
<p style="text-align:center;margin-top:32px;">
  <a href="{{resetUrl}}" style="display:inline-block;background-color:#14b8a6;color:white;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:bold;">Reset Password →</a>
</p>
<p style="color:#94a3b8;font-size:13px;margin-top:24px;">If you didn't request a password reset, you can safely ignore this email.</p>`,
  },
  faculty_invite: {
    subject: `You've been invited to join {{schoolName}} on GOYA`,
    content: `<h1 style="color:#0f2044;margin:0 0 16px;">You've been invited to join {{schoolName}}!</h1>
<p>You've been added as <strong>{{position}}</strong> at <strong>{{schoolName}}</strong> on GOYA — the global online yoga association.</p>
<p>Create your free GOYA account to accept the invitation and join the school's faculty team.</p>
<p style="text-align:center;margin-top:32px;">
  <a href="{{registerUrl}}" style="display:inline-block;background-color:#14b8a6;color:white;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:bold;">Create Your Account →</a>
</p>
<p style="color:#94a3b8;font-size:13px;margin-top:24px;">If you weren't expecting this invitation, you can safely ignore this email.</p>`,
  },
}
