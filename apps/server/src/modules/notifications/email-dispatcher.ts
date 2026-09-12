import nodemailer from "nodemailer";

// Create Nodemailer SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "localhost",
  port: Number(process.env.SMTP_PORT || 1025),
  secure: false,
  ignoreTLS: true,
});

export interface NotificationEmailOptions {
  to: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

export function sendNotificationEmail(options: NotificationEmailOptions): void {
  const { to, title, body, data } = options;

  transporter
    .sendMail({
      from: `"Enterprise Meet" <${process.env.SMTP_FROM || "noreply@meet.io"}>`,
      to,
      subject: title,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
            <span style="font-size: 20px; font-weight: bold; color: #4f46e5;">Enterprise Meet</span>
          </div>
          <h2 style="color: #0f172a; margin-bottom: 12px; font-size: 18px;">${title}</h2>
          <p style="color: #334155; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">${body}</p>
          ${
            data?.downloadUrl
              ? `<a href="${data.downloadUrl}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">Download MP4</a>`
              : data?.meetingUrl
              ? `<a href="${data.meetingUrl}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">Join Meeting</a>`
              : ""
          }
          <hr style="border: none; border-top: 1px solid #f1f5f9; margin-top: 28px; margin-bottom: 16px;" />
          <p style="color: #94a3b8; font-size: 11px;">You received this automated event notification because of your account settings on Enterprise Meet.</p>
        </div>
      `,
    })
    .catch((err: any) => {
      console.warn("[NotificationEmail] Email send notice:", err.message || err);
    });
}
