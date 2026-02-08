/**
 * Claude-style magic link email template.
 * Uses ✦ character for logo (no external images) - reliable across all email clients.
 */

const MAR_ICON_COLOR = "#b4531a"; // amber/orange

export function getMagicLinkEmailHtml(params: { signInUrl: string }): string {
    const { signInUrl } = params;
    const brandingBlock = `<span style="font-size:24px;color:${MAR_ICON_COLOR};line-height:1;">✦</span><span style="font-size:18px;font-weight:500;color:#333333;font-style:italic;font-family:'Times New Roman',Times,serif;">MAR Chat</span>`;
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#fcfaf7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#fcfaf7;">
    <tr>
      <td align="center" style="padding:48px 24px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:480px;background-color:#ffffff;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <tr>
            <td style="padding:48px 40px;">
              <!-- Branding: MAR Chat logo + MAR -->
              <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:32px;">
                ${brandingBlock}
              </div>
              <!-- Headline -->
              <h1 style="margin:0 0 12px;font-size:24px;font-weight:600;color:#333333;text-align:center;line-height:1.3;">
                Let's get you signed in
              </h1>
              <!-- Instructional text -->
              <p style="margin:0 0 28px;font-size:15px;color:#555555;text-align:center;line-height:1.5;">
                Sign in with the secure link below
              </p>
              <!-- CTA Button -->
              <div style="text-align:center;margin-bottom:32px;">
                <a href="${signInUrl}" style="display:inline-block;padding:14px 32px;background-color:#333333;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">
                  Sign in to MAR Chat
                </a>
              </div>
              <!-- Disclaimer -->
              <p style="margin:0;font-size:13px;color:#666666;text-align:center;line-height:1.6;">
                If you didn't request this email, you can safely ignore it.
              </p>
              <p style="margin:8px 0 0;font-size:13px;color:#666666;text-align:center;line-height:1.6;">
                If you're experiencing issues, please contact <a href="https://gomarai.com/contact" style="color:#007bff;text-decoration:underline;">Contact Support</a>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function getMagicLinkEmailText(params: { signInUrl: string }): string {
    const { signInUrl } = params;
    return `Let's get you signed in

Sign in with the secure link below:

${signInUrl}

If you didn't request this email, you can safely ignore it.
If you're experiencing issues, please contact MAR Support: https://gomarai.com/contact`;
}
