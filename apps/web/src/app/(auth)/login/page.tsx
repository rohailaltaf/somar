"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/providers";
import { OtpInput } from "@/components/ui/otp-input";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { authFormStyles, getButtonClass } from "@somar/shared/styles";
import { OTP_COOLDOWN_SECONDS } from "@somar/shared/components";
import {
  emailSchema,
  otpSchema,
  type EmailFormData,
  type OtpFormData,
} from "@somar/shared/validation";

export default function LoginPage() {
  const router = useRouter();
  const { sendOtp, verifyOtp, loginWithGoogleIdToken, otpState, setOtpState, resetOtpState, session, isLoading } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && session) {
      router.replace("/");
    }
  }, [isLoading, session, router]);

  // Cooldown timer effect
  useEffect(() => {
    if (!otpState.lastOtpSentAt) {
      setCooldownRemaining(0);
      return;
    }

    const calculateRemaining = () => {
      const elapsed = Math.floor((Date.now() - otpState.lastOtpSentAt!) / 1000);
      return Math.max(0, OTP_COOLDOWN_SECONDS - elapsed);
    };

    setCooldownRemaining(calculateRemaining());

    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setCooldownRemaining(remaining);
      if (remaining === 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [otpState.lastOtpSentAt]);

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
      setOtpState({ step: "otp", email: data.email, lastOtpSentAt: Date.now() });
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
    if (cooldownRemaining > 0) return;
    setIsResending(true);
    try {
      await sendOtp(otpForm.getValues("email"));
      setOtpState({ ...otpState, lastOtpSentAt: Date.now() });
    } catch (err) {
      otpForm.setError("root", {
        message: err instanceof Error ? err.message : "Failed to resend code",
      });
    } finally {
      setIsResending(false);
    }
  }

  async function handleGoogleSuccess(idToken: string) {
    setIsGoogleLoading(true);
    try {
      await loginWithGoogleIdToken(idToken);
    } catch (err) {
      emailForm.setError("root", {
        message: err instanceof Error ? err.message : "Failed to sign in with Google",
      });
      setIsGoogleLoading(false);
    }
  }

  function handleGoogleError(error: Error) {
    emailForm.setError("root", {
      message: error.message || "Failed to sign in with Google",
    });
  }

  function handleBack() {
    resetOtpState();
    otpForm.reset();
  }

  const isEmailSubmitting = emailForm.formState.isSubmitting;
  const isOtpSubmitting = otpForm.formState.isSubmitting;

  // Loading state - show while checking session, submitting OTP, Google sign-in, or after successful verification
  if (isLoading || session || isOtpSubmitting || isGoogleLoading || otpState.step === "verifying") {
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
            onComplete={(value) => handleOtpSubmit({ email: otpForm.getValues("email"), otp: value })}
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
          disabled={isOtpSubmitting || isResending || cooldownRemaining > 0}
          className={authFormStyles.button.ghost}
        >
          <span className={authFormStyles.button.ghostText}>
            {isResending
              ? "Sending..."
              : cooldownRemaining > 0
                ? `Resend code (${cooldownRemaining}s)`
                : "Resend code"}
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

      <GoogleSignInButton
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
        disabled={isEmailSubmitting || isGoogleLoading}
      />

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
