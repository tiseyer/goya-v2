export function wrapInEmailLayout(content: string): string {
  const year = new Date().getFullYear()
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background-color:#f6f9fc;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f2044;">
    <tr>
      <td style="padding:24px;text-align:center;">
        <div style="color:white;font-size:28px;font-weight:bold;letter-spacing:2px;">GOYA</div>
        <div style="color:#94a3b8;font-size:12px;margin-top:4px;">Global Online Yoga Association</div>
      </td>
    </tr>
  </table>

  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background:white;border-radius:8px;overflow:hidden;max-width:100%;">
          <tr>
            <td style="padding:40px 32px;color:#1e293b;font-size:15px;line-height:1.6;">
              ${content}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:24px;color:#94a3b8;font-size:12px;text-align:center;">
        <p style="margin:0 0 8px;">© ${year} Global Online Yoga Association. All rights reserved.</p>
        <p style="margin:0 0 8px;">Questions? Reply to this email or contact us at <a href="mailto:member@globalonlineyogaassociation.org" style="color:#94a3b8;">member@globalonlineyogaassociation.org</a></p>
        <p style="margin:0 0 8px;">
          <a href="https://globalonlineyogaassociation.org/privacy-policy" style="color:#94a3b8;">Privacy Policy</a> ·
          <a href="https://globalonlineyogaassociation.org/terms-of-use" style="color:#94a3b8;">Terms of Use</a> ·
          <a href="https://globalonlineyogaassociation.org/unsubscribe" style="color:#94a3b8;">Unsubscribe</a>
        </p>
        <p style="margin:0;font-size:11px;">GOYA · Canada · Sent in accordance with Canadian anti-spam legislation (CASL).</p>
      </td>
    </tr>
  </table>
</body>
</html>`
}
