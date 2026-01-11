"use client";

import { useState } from "react";
import Link from "next/link";
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

type Step = "email" | "otp";

export default function LoginPage() {
  const { sendOtp, verifyOtp, loginWithGoogle } = useAuth();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");

  // Email form
  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  // OTP form
  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: { email: "", otp: "" },
  });

  async function handleEmailSubmit(data: EmailFormData) {
    try {
      await sendOtp(data.email);
      setEmail(data.email);
      otpForm.setValue("email", data.email);
      setStep("otp");
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
    try {
      await sendOtp(email);
    } catch (err) {
      otpForm.setError("root", {
        message: err instanceof Error ? err.message : "Failed to resend code",
      });
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
    setStep("email");
    otpForm.reset();
  }

  const isEmailSubmitting = emailForm.formState.isSubmitting;
  const isOtpSubmitting = otpForm.formState.isSubmitting;

  // Loading state
  if (isOtpSubmitting) {
    return (
      <div className={authFormStyles.loading.container}>
        <div className={authFormStyles.loading.spinner} />
        <p className={authFormStyles.loading.text}>Signing in...</p>
        <p className={authFormStyles.loading.subtext}>Please wait</p>
      </div>
    );
  }

  // OTP step
  if (step === "otp") {
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
          <p className={authFormStyles.header.subtitle}>We sent a code to {email}</p>
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
          disabled={isOtpSubmitting}
          className={authFormStyles.button.ghost}
        >
          <span className={authFormStyles.button.ghostText}>Resend code</span>
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

      <div className={authFormStyles.footer.container}>
        <span className={authFormStyles.footer.text}>Don't have an account?</span>
        <Link href="/register" className={authFormStyles.footer.link}>
          Sign up
        </Link>
      </div>
    </div>
  );
}
