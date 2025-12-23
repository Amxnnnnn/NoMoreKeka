/**
 * Email Templates
 * 
 * These are HTML templates for different email types
 * We use them as functions so we can inject dynamic data (like OTP, username, etc.)
 */

// OTP email template for signup
export const otpEmailTemplate = (otp: string, userName?: string): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Email Verification</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f6f8; font-family: Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 0;">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:8px; box-shadow:0 6px 20px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="padding:24px 32px; border-bottom:1px solid #eaeaea;">
              <h2 style="margin:0; color:#1f2937;">NoMoreKeka</h2>
              <p style="margin:4px 0 0; color:#6b7280; font-size:13px;">
                Powered by Signity Solutions
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:32px;">
              <p style="font-size:15px; color:#111827;">
                Hello ${userName || 'there'},
              </p>

              <p style="font-size:14px; color:#374151; line-height:1.6;">
                We received a request to verify your email address for your
                <strong>NoMoreKeka</strong> account.
              </p>

              <!-- OTP Box -->
              <div style="margin:28px 0; padding:20px; background:#f9fafb; border:1px solid #e5e7eb; border-radius:6px; text-align:center;">
                <p style="margin:0; font-size:13px; color:#6b7280;">
                  Your One-Time Password (OTP)
                </p>
                <p style="margin:12px 0 0; font-size:34px; letter-spacing:6px; font-weight:bold; color:#2563eb;">
                  ${otp}
                </p>
              </div>

              <p style="font-size:14px; color:#374151;">
                This OTP is valid for <strong>10 minutes</strong>.
              </p>

              <p style="font-size:14px; color:#374151;">
                If you did not request this, you can safely ignore this email.
              </p>

              <p style="margin-top:24px; font-size:13px; color:#dc2626;">
                ⚠️ For security reasons, never share this OTP with anyone.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px; border-top:1px solid #eaeaea; font-size:12px; color:#9ca3af; text-align:center;">
              © ${new Date().getFullYear()} NoMoreKeka · Signity Solutions<br/>
              This is an automated email. Please do not reply.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
};


// OTP email template for login
export const loginOtpEmailTemplate = (otp: string): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Login Verification</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f6f8; font-family: Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 0;">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:8px; box-shadow:0 6px 20px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="padding:24px 32px; border-bottom:1px solid #eaeaea;">
              <h2 style="margin:0; color:#1f2937;">NoMoreKeka</h2>
              <p style="margin:4px 0 0; color:#6b7280; font-size:13px;">
                Secure Login Verification
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:32px;">
              <p style="font-size:14px; color:#374151;">
                You are attempting to log in to your NoMoreKeka account.
              </p>

              <div style="margin:28px 0; padding:20px; background:#f9fafb; border:1px solid #e5e7eb; border-radius:6px; text-align:center;">
                <p style="margin:0; font-size:13px; color:#6b7280;">
                  Login OTP
                </p>
                <p style="margin:12px 0 0; font-size:34px; letter-spacing:6px; font-weight:bold; color:#2563eb;">
                  ${otp}
                </p>
              </div>

              <p style="font-size:14px; color:#374151;">
                This OTP will expire in <strong>10 minutes</strong>.
              </p>

              <p style="font-size:14px; color:#374151;">
                If this login attempt was not made by you, please ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px; border-top:1px solid #eaeaea; font-size:12px; color:#9ca3af; text-align:center;">
              © ${new Date().getFullYear()} NoMoreKeka · Signity Solutions
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
};


// Welcome email template
export const welcomeEmailTemplate = (userName: string): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Welcome to NoMoreKeka</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f6f8; font-family: Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 0;">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:8px; box-shadow:0 6px 20px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="padding:28px 32px; border-bottom:1px solid #eaeaea;">
              <h2 style="margin:0; color:#1f2937;">Welcome to NoMoreKeka 🎉</h2>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:32px;">
              <p style="font-size:15px; color:#111827;">
                Hello ${userName},
              </p>

              <p style="font-size:14px; color:#374151; line-height:1.6;">
                Welcome to <strong>NoMoreKeka</strong>, your centralized HR
                management platform built to simplify workforce operations.
              </p>

              <p style="font-size:14px; color:#374151; line-height:1.6;">
                Your administrator account for <strong>Signity Solutions</strong>
                has been successfully created. You now have full access to manage
                employees, roles, and organizational workflows.
              </p>

              <div style="margin:24px 0; padding:16px; background:#f9fafb; border-left:4px solid #2563eb;">
                <p style="margin:0; font-size:14px; color:#374151;">
                   <strong>What you can do next:</strong><br/>
                  • Invite HR & employees<br/>
                  • Configure departments & roles<br/>
                  • Manage company-wide policies
                </p>
              </div>

              <p style="font-size:14px; color:#374151;">
                If you need any assistance, our support team is always here to help.
              </p>

              <p style="margin-top:24px; font-size:14px; color:#374151;">
                Wishing you a productive journey,<br/>
                <strong>Team Signity Solutions</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px; border-top:1px solid #eaeaea; font-size:12px; color:#9ca3af; text-align:center;">
              © ${new Date().getFullYear()} NoMoreKeka · Built by Signity Solutions
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
};

// Invitation email template
export const invitationEmailTemplate = (
  inviteeName: string,
  companyName: string,
  invitationLink: string,
  inviterName: string,
  role: string
): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>You're Invited to Join ${companyName}</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f6f8; font-family: Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 0;">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:8px; box-shadow:0 6px 20px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="padding:28px 32px; border-bottom:1px solid #eaeaea;">
              <h2 style="margin:0; color:#1f2937;">You're Invited! 🎉</h2>
              <p style="margin:4px 0 0; color:#6b7280; font-size:13px;">
                NoMoreKeka · ${companyName}
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:32px;">
              <p style="font-size:15px; color:#111827;">
                Hello ${inviteeName},
              </p>

              <p style="font-size:14px; color:#374151; line-height:1.6;">
                <strong>${inviterName}</strong> has invited you to join 
                <strong>${companyName}</strong> on <strong>NoMoreKeka</strong> 
                as a <strong>${role}</strong>.
              </p>

              <p style="font-size:14px; color:#374151; line-height:1.6;">
                NoMoreKeka is a comprehensive HR management platform that helps 
                organizations streamline their workforce operations, manage employee 
                data, and enhance team collaboration.
              </p>

              <!-- CTA Button -->
              <div style="margin:32px 0; text-align:center;">
                <a href="${invitationLink}" 
                   style="display:inline-block; background:#2563eb; color:white; padding:14px 32px; 
                          text-decoration:none; border-radius:6px; font-weight:600; font-size:14px;">
                  Accept Invitation
                </a>
              </div>

              <div style="margin:24px 0; padding:16px; background:#f9fafb; border-left:4px solid #10b981;">
                <p style="margin:0; font-size:14px; color:#374151;">
                   <strong>What you'll get access to:</strong><br/>
                  • Company dashboard and analytics<br/>
                  • Team member directory<br/>
                  • Role-based permissions<br/>
                  • Secure document management
                </p>
              </div>

              <p style="font-size:13px; color:#6b7280; line-height:1.5;">
                This invitation will expire in <strong>7 days</strong>. 
                If you have any questions, please contact ${inviterName} or 
                your system administrator.
              </p>

              <p style="margin-top:24px; font-size:14px; color:#374151;">
                Welcome to the team!<br/>
                <strong>NoMoreKeka Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px; border-top:1px solid #eaeaea; font-size:12px; color:#9ca3af; text-align:center;">
              © ${new Date().getFullYear()} NoMoreKeka · Built by Signity Solutions<br/>
              If you didn't expect this invitation, you can safely ignore this email.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
};
