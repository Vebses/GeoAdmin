// User Invitation Email Template
import { sanitizeDisplayName } from '../sanitize';

export interface InvitationTemplateParams {
  inviteUrl: string;
  email: string;
  role: string;
  inviterName: string;
}

const roleLabels: Record<string, string> = {
  super_admin: 'სუპერ ადმინი',
  manager: 'მენეჯერი',
  assistant: 'ასისტენტი',
  accountant: 'ბუღალტერი',
};

export const invitationTemplate = {
  subject: 'მოწვევა GeoAdmin სისტემაში',

  html: (params: InvitationTemplateParams) => {
    // Escape all user-controlled strings for safe HTML interpolation
    const inviteUrl = params.inviteUrl; // URL — used in href, must not be HTML-escaped
    const email = sanitizeDisplayName(params.email, 254);
    const role = sanitizeDisplayName(params.role, 32);
    const inviterName = sanitizeDisplayName(params.inviterName, 100);
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #e5e7eb;">
              <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #3b82f6, #2563eb); border-radius: 12px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-size: 24px; font-weight: bold; line-height: 48px;">G</span>
              </div>
              <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #111827;">GeoAdmin</h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: #111827; text-align: center;">
                🎉 მოწვევა GeoAdmin-ში!
              </h2>
              
              <p style="margin: 0 0 20px; font-size: 14px; color: #4b5563; line-height: 1.6;">
                გამარჯობა! თქვენ მოწვეული ხართ GeoAdmin სისტემაში.
              </p>
              
              <!-- Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 4px 0; font-size: 13px;">
                          <span style="color: #6b7280;">👤 როლი:</span>
                          <span style="color: #111827; font-weight: 600; margin-left: 8px;">${roleLabels[role] || role}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; font-size: 13px;">
                          <span style="color: #6b7280;">📧 ელ-ფოსტა:</span>
                          <span style="color: #111827; font-weight: 500; margin-left: 8px;">${email}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; font-size: 13px;">
                          <span style="color: #6b7280;">👨‍💼 მოწვეული:</span>
                          <span style="color: #111827; font-weight: 500; margin-left: 8px;">${inviterName}-ის მიერ</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 24px; font-size: 14px; color: #4b5563; line-height: 1.6;">
                ანგარიშის გასააქტიურებლად დააჭირეთ ქვემოთ მოცემულ ღილაკს:
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${inviteUrl}" style="display: inline-block; padding: 12px 32px; background: linear-gradient(135deg, #22c55e, #16a34a); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 8px; box-shadow: 0 2px 4px rgba(34, 197, 94, 0.3);">
                      ანგარიშის გააქტიურება
                    </a>
                  </td>
                </tr>
              </table>
              
              <div style="margin-top: 24px; padding: 12px 16px; background-color: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <p style="margin: 0; font-size: 12px; color: #92400e;">
                  ⏰ ბმული მოქმედებს 48 საათის განმავლობაში
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                © ${new Date().getFullYear()} GeoAdmin • geoadmin.ge
              </p>
              <p style="margin: 8px 0 0; font-size: 11px; color: #d1d5db;">
                ეს არის ავტომატური შეტყობინება
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
  },

  text: (params: InvitationTemplateParams) => {
    const inviteUrl = params.inviteUrl;
    // For plain-text we only need to strip newlines (no HTML escape)
    const email = (params.email || '').replace(/[\r\n]/g, ' ').substring(0, 254);
    const role = (params.role || '').replace(/[\r\n]/g, ' ').substring(0, 32);
    const inviterName = (params.inviterName || '').replace(/[\r\n]/g, ' ').substring(0, 100);
    return `
მოწვევა GeoAdmin სისტემაში

გამარჯობა!

თქვენ მოწვეული ხართ GeoAdmin სისტემაში.

როლი: ${roleLabels[role] || role}
ელ-ფოსტა: ${email}
მოწვეული: ${inviterName}-ის მიერ

ანგარიშის გასააქტიურებლად გადახვიდეთ შემდეგ ბმულზე:
${inviteUrl}

ბმული მოქმედებს 48 საათის განმავლობაში.

© ${new Date().getFullYear()} GeoAdmin
`;
  },
};
