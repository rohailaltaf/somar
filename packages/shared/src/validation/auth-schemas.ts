import { z } from "zod";

/**
 * Auth validation schemas.
 * Shared between web and mobile for consistent validation.
 */

// Email entry schema (step 1 of OTP flow)
export const emailSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
});

export type EmailFormData = z.infer<typeof emailSchema>;

// OTP verification schema (step 2 of OTP flow)
export const otpSchema = z.object({
  email: z.string().email(),
  otp: z
    .string()
    .length(6, "Code must be 6 digits")
    .regex(/^\d+$/, "Code must contain only numbers"),
});

export type OtpFormData = z.infer<typeof otpSchema>;

// Registration schema (name + email, then OTP)
export const registerEmailSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
});

export type RegisterEmailFormData = z.infer<typeof registerEmailSchema>;

// Legacy exports for backwards compatibility during migration
export const loginSchema = emailSchema;
export type LoginFormData = EmailFormData;
export const registerSchema = registerEmailSchema;
export type RegisterFormData = RegisterEmailFormData;
