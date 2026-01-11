"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/providers";
import { OtpInput } from "@/components/ui/otp-input";
import { authFormStyles, getButtonClass } from "@somar/shared/styles";
import {
  registerEmailSchema,
  otpSchema,
  type RegisterEmailFormData,
  type OtpFormData,
} from "@somar/shared/validation";

type Step = "info" | "otp";

export default function RegisterPage() {
  const { sendOtp, verifyOtp, loginWithGoogle } = useAuth();
  const [step, setStep] = useState<Step>("info");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isResending, setIsResending] = useState(false);

  // Info form (name + email)
  const infoForm = useForm<RegisterEmailFormData>({
    resolver: zodResolver(registerEmailSchema),
    defaultValues: { name: "", email: "" },
  });

  // OTP form
  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: { email: "", otp: "" },
  });

  async function handleInfoSubmit(data: RegisterEmailFormData) {
    try {
      await sendOtp(data.email);
      setEmail(data.email);
      setName(data.name);
      otpForm.setValue("email", data.email);
      setStep("otp");
    } catch (err) {
      infoForm.setError("root", {
        message: err instanceof Error ? err.message : "Failed to send code",
      });
    }
  }

  async function handleOtpSubmit(data: OtpFormData) {
    try {
      await verifyOtp(data.email, data.otp, name);
    } catch (err) {
      otpForm.setError("root", {
        message: err instanceof Error ? err.message : "Invalid code",
      });
    }
  }

  async function handleResendCode() {
    setIsResending(true);
    try {
      await sendOtp(email);
    } catch (err) {
      otpForm.setError("root", {
        message: err instanceof Error ? err.message : "Failed to resend code",
      });
    } finally {
      setIsResending(false);
    }
  }

  async function handleGoogleRegister() {
    try {
      await loginWithGoogle();
    } catch (err) {
      infoForm.setError("root", {
        message: err instanceof Error ? err.message : "Failed to sign up with Google",
      });
    }
  }

  function handleBack() {
    setStep("info");
    otpForm.reset();
  }

  const isInfoSubmitting = infoForm.formState.isSubmitting;
  const isOtpSubmitting = otpForm.formState.isSubmitting;

  // Loading state
  if (isOtpSubmitting) {
    return (
      <div className={authFormStyles.loading.container}>
        <div className={authFormStyles.loading.spinner} />
        <p className={authFormStyles.loading.text}>Creating your account...</p>
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
            <span className={authFormStyles.button.primaryText}>Create account</span>
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

  // Info step
  return (
    <div className={authFormStyles.card}>
      <div className={authFormStyles.header.container}>
        <h1 className={authFormStyles.header.title}>Create an account</h1>
        <p className={authFormStyles.header.subtitle}>Start tracking your finances securely</p>
      </div>

      <button
        type="button"
        onClick={handleGoogleRegister}
        disabled={isInfoSubmitting}
        className={authFormStyles.button.oauth}
      >
        <span className={authFormStyles.button.oauthText}>Continue with Google</span>
      </button>

      <div className={authFormStyles.divider.container}>
        <div className={authFormStyles.divider.line} />
        <span className={authFormStyles.divider.text}>Or continue with</span>
        <div className={authFormStyles.divider.line} />
      </div>

      {infoForm.formState.errors.root && (
        <div className={authFormStyles.error.container}>
          <p className={authFormStyles.error.text}>
            {infoForm.formState.errors.root.message}
          </p>
        </div>
      )}

      <form onSubmit={infoForm.handleSubmit(handleInfoSubmit)}>
        <div className={authFormStyles.field.container}>
          <label htmlFor="name" className={authFormStyles.field.label}>
            Name
          </label>
          <input
            id="name"
            type="text"
            placeholder="John Doe"
            {...infoForm.register("name")}
            className={`${authFormStyles.field.input} w-full px-4 py-3`}
          />
          {infoForm.formState.errors.name && (
            <p className={authFormStyles.field.error}>
              {infoForm.formState.errors.name.message}
            </p>
          )}
        </div>

        <div className={authFormStyles.field.container}>
          <label htmlFor="email" className={authFormStyles.field.label}>
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            {...infoForm.register("email")}
            className={`${authFormStyles.field.input} w-full px-4 py-3`}
          />
          {infoForm.formState.errors.email && (
            <p className={authFormStyles.field.error}>
              {infoForm.formState.errors.email.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isInfoSubmitting}
          className={getButtonClass(isInfoSubmitting)}
        >
          <span className={authFormStyles.button.primaryText}>
            {isInfoSubmitting ? "Sending code..." : "Continue"}
          </span>
        </button>
      </form>

      <div className={authFormStyles.footer.container}>
        <span className={authFormStyles.footer.text}>Already have an account?</span>
        <Link href="/login" className={authFormStyles.footer.link}>
          Sign in
        </Link>
      </div>
    </div>
  );
}
