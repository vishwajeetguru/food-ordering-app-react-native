export interface OTPProvider {
  readonly channel: string;
  send(destination: string, otp: string): Promise<void>;
}

export abstract class BaseOTPProvider implements OTPProvider {
  abstract readonly channel: string;
  abstract send(destination: string, otp: string): Promise<void>;
}
