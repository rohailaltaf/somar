import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOTPEmail(email: string, otp: string) {
  const fromEmail =
    process.env.RESEND_FROM_EMAIL || "Somar <noreply@somar.com>";

  await resend.emails.send({
    from: fromEmail,
    to: email,
    subject: "Your Somar login code",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="font-size: 24px; font-weight: 600; color: #1a1a1a; margin-bottom: 24px;">Your login code</h1>
        <p style="font-size: 16px; color: #4a4a4a; margin-bottom: 24px;">Enter this code to sign in to Somar:</p>
        <div style="background: #f5f5f5; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1a1a1a;">${otp}</span>
        </div>
        <p style="font-size: 14px; color: #6a6a6a; margin-bottom: 8px;">This code expires in 10 minutes.</p>
        <p style="font-size: 14px; color: #6a6a6a;">If you didn't request this code, you can safely ignore this email.</p>
      </div>
    `,
  });
}
