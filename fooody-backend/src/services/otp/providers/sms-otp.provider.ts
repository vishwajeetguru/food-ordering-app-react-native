import { BaseOTPProvider } from './otp.provider';
import { logger } from '../../../utils/logger';

export class SmsOTPProvider extends BaseOTPProvider {
  readonly channel = 'sms';

  async send(phone: string, otp: string): Promise<void> {
    // Future: integrate with Twilio / Firebase etc.
    // Currently placeholder – demonstrates extensibility.
    logger.info(`[SMS-OTP] (future) Would send OTP to ${phone}`);
    // Do not log OTP in production; this is intentionally not logging otp detail in prod expectation.
    throw new Error('SMS OTP provider not implemented yet. Configure SMS service to enable.');
  }
}
