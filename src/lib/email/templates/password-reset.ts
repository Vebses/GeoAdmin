// Password Reset Email Template

export const passwordResetTemplate = {
  subject: 'პაროლის აღდგენა - GeoAdmin',
  
  html: (resetUrl: string) => `
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
                🔐 პაროლის აღდგენა
              </h2>
              
              <p style="margin: 0 0 16px; font-size: 14px; color: #4b5563; line-height: 1.6;">
                თქვენ (ან ვინმემ) მოითხოვა პაროლის შეცვლა ამ ელ-ფოსტის მისამართისთვის.
              </p>
              
              <p style="margin: 0 0 24px; font-size: 14px; color: #4b5563; line-height: 1.6;">
                თუ ეს თქვენ მოითხოვეთ, დააჭირეთ ქვემოთ მოცემულ ღილაკს:
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" style="display: inline-block; padding: 12px 32px; background: linear-gradient(135deg, #3b82f6, #2563eb); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 8px; box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);">
                      პაროლის შეცვლა
                    </a>
                  </td>
                </tr>
              </table>
              
              <div style="margin-top: 24px; padding: 12px 16px; background-color: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <p style="margin: 0; font-size: 12px; color: #92400e;">
                  ⏰ ბმული მოქმედებს 1 საათის განმავლობაში
                </p>
              </div>
              
              <p style="margin: 24px 0 0; font-size: 12px; color: #9ca3af; text-align: center;">
                თუ თქვენ არ მოგითხოვიათ პაროლის შეცვლა, უგულებელყოთ ეს შეტყობინება.
              </p>
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
`,

  text: (resetUrl: string) => `
პაროლის აღდგენა - GeoAdmin

თქვენ (ან ვინმემ) მოითხოვა პაროლის შეცვლა ამ ელ-ფოსტის მისამართისთვის.

თუ ეს თქვენ მოითხოვეთ, გადახვიდეთ შემდეგ ბმულზე:
${resetUrl}

ბმული მოქმედებს 1 საათის განმავლობაში.

თუ თქვენ არ მოგითხოვიათ პაროლის შეცვლა, უგულებელყოთ ეს შეტყობინება.

© ${new Date().getFullYear()} GeoAdmin
`,
};
