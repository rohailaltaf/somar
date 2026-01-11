/**
 * Validation schemas - shared between web and mobile.
 *
 * Usage:
 * ```typescript
 * import { emailSchema, otpSchema, type EmailFormData, type OtpFormData } from "@somar/shared/validation";
 * ```
 */

export {
  // OTP flow schemas
  emailSchema,
  otpSchema,
  registerEmailSchema,
  type EmailFormData,
  type OtpFormData,
  type RegisterEmailFormData,
  // Legacy exports for backwards compatibility
  loginSchema,
  registerSchema,
  type LoginFormData,
  type RegisterFormData,
} from "./auth-schemas";
