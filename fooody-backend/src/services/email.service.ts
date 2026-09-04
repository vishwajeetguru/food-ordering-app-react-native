import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../utils/logger';

let transporter: nodemailer.Transporter | null = null;

export function isEmailConfigured(): boolean {
  return !!(env.SMTP_HOST && env.SMTP_USER);
}

function getTransporter(): nodemailer.Transporter | null {
  if (!isEmailConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: false, // 587 uses STARTTLS (TLS upgrade)
      requireTLS: true,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

export const emailService = {
  async send(to: string, subject: string, text: string, html?: string): Promise<boolean> {
    const t = getTransporter();
    if (!t) {
      logger.warn('Email not sent - SMTP not configured', { to, subject });
      return false;
    }
    try {
      const info = await t.sendMail({
        from: `"${env.SMTP_FROM_NAME}" <${env.SMTP_FROM || env.SMTP_USER}>`,
        to,
        subject,
        text,
        html: html || undefined,
      });
      logger.info('Email sent', { to, subject, messageId: info.messageId });
      return true;
    } catch (e: any) {
      logger.error('Email send failed', { error: e.message, to, subject });
      return false;
    }
  },
};
