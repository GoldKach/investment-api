// utils/mailer.ts
import ResetPasswordEmail from "@/emails/reset-password-email";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);
const FROM = process.env.MAIL_FROM || "Your App <no-reply@yourdomain.com>";

export async function sendResetEmailResend(args: {
  to: string;
  name?: string;
  resetUrl: string;
}) {
  const { to, name, resetUrl } = args;
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: "Reset your password",
    react: ResetPasswordEmail({ name, resetUrl }),
    // tip: avoid click/open tracking for security emails
  });
  if (error) throw error;
}
