import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://somar.app";

export async function sendOTPEmail(email: string, otp: string) {
  const fromEmail =
    process.env.RESEND_FROM_EMAIL || "Somar <noreply@somar.com>";

  try {
    const result = await resend.emails.send({
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

    if (result.error) {
      console.error("Failed to send OTP email:", result.error);
      throw new Error(result.error.message || "Failed to send verification email");
    }
  } catch (err) {
    console.error("Error sending OTP email:", err);
    throw err;
  }
}

export async function sendApprovalEmail(email: string) {
  const fromEmail =
    process.env.RESEND_FROM_EMAIL || "Somar <noreply@somar.com>";

  try {
    const result = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: "You're in! Welcome to Somar",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="font-size: 24px; font-weight: 600; color: #1a1a1a; margin-bottom: 24px;">Welcome to Somar!</h1>
          <p style="font-size: 16px; color: #4a4a4a; margin-bottom: 24px;">Great news - your account has been approved. You now have full access to Somar.</p>
          <div style="margin-bottom: 24px;">
            <a href="${APP_URL}/login" style="display: inline-block; background: #1a1a1a; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">Log in to Somar</a>
          </div>
          <p style="font-size: 14px; color: #6a6a6a;">If you have any questions, just reply to this email.</p>
        </div>
      `,
    });

    if (result.error) {
      console.error("Failed to send approval email:", result.error);
      throw new Error(result.error.message || "Failed to send approval email");
    }
  } catch (err) {
    console.error("Error sending approval email:", err);
    throw err;
  }
}
