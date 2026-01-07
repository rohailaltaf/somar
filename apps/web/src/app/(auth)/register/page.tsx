"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/providers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function RegisterPage() {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEmailRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      await register(email, password, name);
      // register() handles navigation via window.location.href
      // Show redirecting state while browser navigates
      setIsRedirecting(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to create account");
      setIsLoading(false);
    }
  }

  // Show fullscreen loading when redirecting
  if (isRedirecting) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-surface-deep">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="text-xl font-semibold text-foreground">Creating your account...</h2>
          <p className="text-muted-foreground">Setting up your encrypted vault</p>
        </div>
      </div>
    );
  }

  async function handleGoogleRegister() {
    // Google OAuth doesn't give us the password, so we can't derive encryption key.
    setError(
      "Google login coming soon. For now, please use email/password to encrypt your data."
    );
  }

  return (
    <Card className="border-border bg-surface">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-foreground">
          Create an account
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Start tracking your finances securely
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          variant="outline"
          className="w-full bg-white text-slate-900 hover:bg-slate-100"
          onClick={handleGoogleRegister}
          disabled={isLoading}
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

        <form onSubmit={handleEmailRegister} className="space-y-4">
          {error && (
            <Alert variant="destructive" className="border-red-500/50 bg-red-950/20">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Registration failed</AlertTitle>
              <AlertDescription className="text-red-200">
                {error}
              </AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-foreground-secondary">
              Name
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null); // Clear error when user types
              }}
              required
              className="border-border bg-surface-elevated text-foreground placeholder:text-foreground-dim"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground-secondary">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null); // Clear error when user types
              }}
              required
              className="border-border bg-surface-elevated text-foreground placeholder:text-foreground-dim"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground-secondary">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null); // Clear error when user types
              }}
              required
              minLength={8}
              className="border-border bg-surface-elevated text-foreground placeholder:text-foreground-dim"
            />
            <p className="text-xs text-foreground-dim">
              This password encrypts your data. If you forget it, your data cannot be recovered.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-foreground-secondary">
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError(null); // Clear error when user types
              }}
              required
              className="border-border bg-surface-elevated text-foreground placeholder:text-foreground-dim"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={isLoading}
          >
            {isLoading ? "Creating account..." : "Create account"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
        <p className="text-xs text-foreground-dim text-center">
          Your data is end-to-end encrypted. We can never see it.
        </p>
      </CardFooter>
    </Card>
  );
}
