"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/providers";
import { OtpInput } from "@/components/ui/otp-input";
import { authFormStyles, getButtonClass } from "@somar/shared/styles";
import {
  emailSchema,
  otpSchema,
  type EmailFormData,
  type OtpFormData,
} from "@somar/shared/validation";

export default function LoginPage() {
  const { sendOtp, verifyOtp, loginWithGoogle, otpState, setOtpState, resetOtpState } = useAuth();
  const [isResending, setIsResending] = useState(false);

  // Email form - use email from context if available
  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: otpState.email || "" },
  });

  // OTP form - use email from context
  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: { email: otpState.email || "", otp: "" },
  });

  async function handleEmailSubmit(data: EmailFormData) {
    try {
      await sendOtp(data.email);
      otpForm.setValue("email", data.email);
      setOtpState({ step: "otp", email: data.email });
    } catch (err) {
      emailForm.setError("root", {
        message: err instanceof Error ? err.message : "Failed to send code",
      });
    }
  }

  async function handleOtpSubmit(data: OtpFormData) {
    try {
      await verifyOtp(data.email, data.otp);
    } catch (err) {
      otpForm.setError("root", {
        message: err instanceof Error ? err.message : "Invalid code",
      });
    }
  }

  async function handleResendCode() {
    setIsResending(true);
    try {
      await sendOtp(otpForm.getValues("email"));
    } catch (err) {
      otpForm.setError("root", {
        message: err instanceof Error ? err.message : "Failed to resend code",
      });
    } finally {
      setIsResending(false);
    }
  }

  async function handleGoogleLogin() {
    try {
      await loginWithGoogle();
    } catch (err) {
      emailForm.setError("root", {
        message: err instanceof Error ? err.message : "Failed to sign in with Google",
      });
    }
  }

  function handleBack() {
    resetOtpState();
    otpForm.reset();
  }

  const isEmailSubmitting = emailForm.formState.isSubmitting;
  const isOtpSubmitting = otpForm.formState.isSubmitting;

  // Loading state - show while submitting OTP or after successful verification (before navigation)
  if (isOtpSubmitting || otpState.step === "verifying") {
    return (
      <div className={authFormStyles.loading.container}>
        <div className={authFormStyles.loading.spinner} />
        <p className={authFormStyles.loading.text}>Signing in...</p>
        <p className={authFormStyles.loading.subtext}>Please wait</p>
      </div>
    );
  }

  // OTP step
  if (otpState.step === "otp") {
    return (
      <div className={`${authFormStyles.cardWithBack} relative`}>
        <button
          type="button"
          onClick={handleBack}
          className={authFormStyles.backButton.container}
        >
          <span className={authFormStyles.backButton.text}>← Back</span>
        </button>

        <div className={authFormStyles.header.container}>
          <h1 className={authFormStyles.header.title}>Check your email</h1>
          <p className={authFormStyles.header.subtitle}>
            We sent a code to {otpForm.watch("email")}
          </p>
        </div>

        {otpForm.formState.errors.root && (
          <div className={authFormStyles.error.container}>
            <p className={authFormStyles.error.text}>
              {otpForm.formState.errors.root.message}
            </p>
          </div>
        )}

        <form onSubmit={otpForm.handleSubmit(handleOtpSubmit)}>
          <OtpInput
            value={otpForm.watch("otp")}
            onChange={(value) => otpForm.setValue("otp", value)}
            hasError={!!otpForm.formState.errors.otp}
          />

          <button
            type="submit"
            disabled={otpForm.watch("otp").length !== 6 || isOtpSubmitting}
            className={getButtonClass(otpForm.watch("otp").length !== 6 || isOtpSubmitting)}
          >
            <span className={authFormStyles.button.primaryText}>Continue</span>
          </button>
        </form>

        <button
          type="button"
          onClick={handleResendCode}
          disabled={isOtpSubmitting || isResending}
          className={authFormStyles.button.ghost}
        >
          <span className={authFormStyles.button.ghostText}>
            {isResending ? "Sending..." : "Resend code"}
          </span>
        </button>
      </div>
    );
  }

  // Email step
  return (
    <div className={authFormStyles.card}>
      <div className={authFormStyles.header.container}>
        <h1 className={authFormStyles.header.title}>Welcome back</h1>
        <p className={authFormStyles.header.subtitle}>Sign in to access your finances</p>
      </div>

      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={isEmailSubmitting}
        className={authFormStyles.button.oauth}
      >
        <span className={authFormStyles.button.oauthText}>Continue with Google</span>
      </button>

      <div className={authFormStyles.divider.container}>
        <div className={authFormStyles.divider.line} />
        <span className={authFormStyles.divider.text}>Or continue with</span>
        <div className={authFormStyles.divider.line} />
      </div>

      {emailForm.formState.errors.root && (
        <div className={authFormStyles.error.container}>
          <p className={authFormStyles.error.text}>
            {emailForm.formState.errors.root.message}
          </p>
        </div>
      )}

      <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)}>
        <div className={authFormStyles.field.container}>
          <label htmlFor="email" className={authFormStyles.field.label}>
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            {...emailForm.register("email")}
            className={`${authFormStyles.field.input} w-full px-4 py-3`}
          />
          {emailForm.formState.errors.email && (
            <p className={authFormStyles.field.error}>
              {emailForm.formState.errors.email.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isEmailSubmitting}
          className={getButtonClass(isEmailSubmitting)}
        >
          <span className={authFormStyles.button.primaryText}>
            {isEmailSubmitting ? "Sending code..." : "Continue with email"}
          </span>
        </button>
      </form>
    </div>
  );
}
