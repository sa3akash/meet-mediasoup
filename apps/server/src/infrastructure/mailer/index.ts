import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST || "localhost";
const smtpPort = Number(process.env.SMTP_PORT || 1025);
const smtpUser = process.env.SMTP_USER || "";
const smtpPass = process.env.SMTP_PASS || "";
const smtpFrom = process.env.SMTP_FROM || "Meet <noreply@meet.enterprise.internal>";

export const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: smtpUser ? { user: smtpUser, pass: smtpPass } : undefined,
});

export async function sendVerificationEmail(email: string, name: string, token: string) {
  const verifyUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/verify?token=${token}`;
  
  await transporter.sendMail({
    from: smtpFrom,
    to: email,
    subject: "Verify your Meet account",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #0a0a0a; color: #ffffff; border-radius: 16px;">
        <h1 style="color: #6366f1; margin-bottom: 24px; font-size: 28px;">Welcome to Meet, ${name}!</h1>
        <p style="color: #a1a1aa; font-size: 16px; line-height: 1.6;">Please verify your email address to activate your account and start hosting ultra-low latency video conferences.</p>
        <div style="margin: 36px 0;">
          <a href="${verifyUrl}" style="background: #6366f1; color: #ffffff; padding: 14px 28px; border-radius: 30px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">Verify Email Address</a>
        </div>
        <p style="color: #71717a; font-size: 13px;">If you did not create an account, you can safely ignore this email.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, name: string, token: string) {
  const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${token}`;
  
  await transporter.sendMail({
    from: smtpFrom,
    to: email,
    subject: "Reset your Meet account password",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #0a0a0a; color: #ffffff; border-radius: 16px;">
        <h1 style="color: #6366f1; margin-bottom: 24px; font-size: 28px;">Password Reset Request</h1>
        <p style="color: #a1a1aa; font-size: 16px; line-height: 1.6;">Hello ${name}, we received a request to reset your password. Click the button below to choose a new password:</p>
        <div style="margin: 36px 0;">
          <a href="${resetUrl}" style="background: #ef4444; color: #ffffff; padding: 14px 28px; border-radius: 30px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">Reset Password</a>
        </div>
        <p style="color: #71717a; font-size: 13px;">This link will expire in 1 hour. If you did not request a password reset, please contact security immediately.</p>
      </div>
    `,
  });
}
