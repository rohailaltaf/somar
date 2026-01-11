"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/providers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { emailSchema, type EmailFormData } from "@somar/shared/validation";

type Step = "email" | "otp";

export default function LoginPage() {
  const { sendOtp, verifyOtp, loginWithGoogle } = useAuth();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: "",
    },
  });

  async function handleEmailSubmit(data: EmailFormData) {
    setIsSubmitting(true);
    setError(null);
    try {
      await sendOtp(data.email);
      setEmail(data.email);
      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send code");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleOtpSubmit() {
    if (otp.length !== 6) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await verifyOtp(email, otp);
      setIsRedirecting(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code");
      setIsSubmitting(false);
    }
  }

  async function handleResendCode() {
    setIsSubmitting(true);
    setError(null);
    try {
      await sendOtp(email);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend code");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleLogin() {
    setIsSubmitting(true);
    setError(null);
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to sign in with Google"
      );
      setIsSubmitting(false);
    }
  }

  // Show fullscreen loading when redirecting
  if (isRedirecting) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-surface-deep">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="text-xl font-semibold text-foreground">
            Signing in...
          </h2>
          <p className="text-muted-foreground">Please wait</p>
        </div>
      </div>
    );
  }

  // OTP verification step
  if (step === "otp") {
    return (
      <Card className="border-border bg-surface relative">
        <Button
          variant="ghost"
          size="sm"
          className="absolute left-4 top-4"
          onClick={() => {
            setStep("email");
            setOtp("");
            setError(null);
          }}
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <CardHeader className="text-center pt-12">
          <CardTitle className="text-2xl font-bold text-foreground">
            Check your email
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            We sent a code to {email}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert
              variant="destructive"
              className="border-red-500/50 bg-red-950/20"
            >
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription className="text-red-200">
                {error}
              </AlertDescription>
            </Alert>
          )}
          <div className="flex justify-center">
            <InputOTP maxLength={6} value={otp} onChange={setOtp}>
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot key={i} index={i} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
          <Button
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={handleOtpSubmit}
            disabled={otp.length !== 6 || isSubmitting}
          >
            {isSubmitting ? "Verifying..." : "Continue"}
          </Button>
          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={handleResendCode}
            disabled={isSubmitting}
          >
            Resend code
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Email entry step
  return (
    <Card className="border-border bg-surface">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-foreground">
          Welcome back
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Sign in to access your finances
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          variant="outline"
          className="w-full bg-white dark:bg-white text-slate-900 dark:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-100 border-slate-300"
          onClick={handleGoogleLogin}
          disabled={isSubmitting}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-surface px-2 text-muted-foreground">
              Or continue with email
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit(handleEmailSubmit)} className="space-y-4">
          {error && (
            <Alert
              variant="destructive"
              className="border-red-500/50 bg-red-950/20"
            >
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Sign in failed</AlertTitle>
              <AlertDescription className="text-red-200">
                {error}
              </AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground-secondary">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...register("email")}
              className="border-border bg-surface-elevated text-foreground placeholder:text-foreground-dim"
            />
            {errors.email && (
              <p className="text-destructive text-xs">{errors.email.message}</p>
            )}
          </div>
          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Sending code..." : "Continue with email"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
