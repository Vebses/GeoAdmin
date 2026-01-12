import { Resend } from 'resend';
import { passwordResetTemplate } from './templates/password-reset';
import { invitationTemplate, type InvitationTemplateParams } from './templates/invitation';

// Initialize Resend client
let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string
): Promise<SendEmailResult> {
  try {
    const resend = getResendClient();
    
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@geoadmin.ge';
    const fromName = process.env.RESEND_FROM_NAME || 'GeoAdmin';
    
    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: email,
      subject: passwordResetTemplate.subject,
      html: passwordResetTemplate.html(resetUrl),
      text: passwordResetTemplate.text(resetUrl),
    });
    
    if (error) {
      console.error('Resend error (password reset):', error);
      return {
        success: false,
        error: error.message || 'Failed to send email',
      };
    }
    
    return {
      success: true,
      messageId: data?.id,
    };
  } catch (error) {
    console.error('Send password reset email error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send user invitation email
 */
export async function sendInvitationEmail(
  params: InvitationTemplateParams
): Promise<SendEmailResult> {
  try {
    const resend = getResendClient();
    
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@geoadmin.ge';
    const fromName = process.env.RESEND_FROM_NAME || 'GeoAdmin';
    
    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: params.email,
      subject: invitationTemplate.subject,
      html: invitationTemplate.html(params),
      text: invitationTemplate.text(params),
    });
    
    if (error) {
      console.error('Resend error (invitation):', error);
      return {
        success: false,
        error: error.message || 'Failed to send email',
      };
    }
    
    return {
      success: true,
      messageId: data?.id,
    };
  } catch (error) {
    console.error('Send invitation email error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
