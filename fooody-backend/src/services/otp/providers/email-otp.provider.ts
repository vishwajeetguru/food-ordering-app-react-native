import { BaseOTPProvider } from './otp.provider';
import { logger } from '../../../utils/logger';
import { env, isProduction, isTest } from '../../../config/env';
import { emailService } from '../../../services/email.service';

export class EmailOTPProvider extends BaseOTPProvider {
  readonly channel = 'email';

  async send(email: string, otp: string): Promise<void> {
    const minutes = env.OTP_EXPIRATION_MINUTES;
    const subject = 'Your Foody OTP code';
    const text = `Your Foody verification code is ${otp}. It expires in ${minutes} minutes. If you did not request this, please ignore this email.`;
    const html = `<div style="font-family:sans-serif;max-width:420px;margin:0 auto">
      <h2>Foody</h2>
      <p>Your verification code is:</p>
      <p style="font-size:28px;font-weight:bold;letter-spacing:6px">${otp}</p>
      <p style="color:#666">Valid for ${minutes} minutes. Do not share this code with anyone.</p>
    </div>`;

    if (isProduction) {
      const sent = await emailService.send(email, subject, text, html);
      if (!sent) throw new Error('Failed to send OTP email via SMTP');
      return;
    }

    if (isTest) {
      // Jest: never send real emails
      logger.info(`[TEST] Email OTP for ${email}: ${otp}`);
      return;
    }

    // Dev: send via SMTP if configured, always log for convenience
    const sent = await emailService.send(email, subject, text, html);
    logger.info(`[DEV] Email OTP for ${email}: ${otp} (valid for ${minutes} min, sent=${sent})`);
  }
}
