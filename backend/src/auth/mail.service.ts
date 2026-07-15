import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  private createTransport() {
    return nodemailer.createTransport({
      host: process.env['SMTP_HOST'] ?? 'smtp.gmail.com',
      port: Number(process.env['SMTP_PORT'] ?? 587),
      secure: process.env['SMTP_SECURE'] === 'true',
      auth: {
        user: process.env['SMTP_USER'],
        pass: process.env['SMTP_PASS'],
      },
    });
  }

  async sendOtp(to: string, otp: string): Promise<void> {
    const transporter = this.createTransport();

    try {
      await transporter.sendMail({
        from: `"Vaprise Railway" <${process.env['SMTP_USER'] ?? 'noreply@vaprise.com'}>`,
        to,
        subject: 'Your password reset code',
        text: `Your verification code is: ${otp}\n\nThis code expires in 10 minutes. Do not share it with anyone.`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#f8fafc;border-radius:12px">
            <h2 style="color:#1e293b;margin-bottom:8px">Password Reset</h2>
            <p style="color:#475569;margin-bottom:24px">Use the code below to reset your password. It expires in <strong>10 minutes</strong>.</p>
            <div style="background:#fff;border:2px solid #e2e8f0;border-radius:10px;padding:20px 0;text-align:center;margin-bottom:24px">
              <span style="font-size:36px;font-weight:700;letter-spacing:12px;color:#2563eb">${otp}</span>
            </div>
            <p style="color:#94a3b8;font-size:13px">If you did not request a password reset, ignore this email.</p>
          </div>
        `,
      });
      this.logger.log(`OTP sent to ${to}`);
    } catch (err: unknown) {
      this.logger.error('Failed to send OTP email', err instanceof Error ? err.stack : err);
      throw new InternalServerErrorException('Failed to send verification email');
    }
  }
}
