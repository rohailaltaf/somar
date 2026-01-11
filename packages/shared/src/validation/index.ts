/**
 * Validation schemas - shared between web and mobile.
 *
 * Usage:
 * ```typescript
 * import { emailSchema, otpSchema, type EmailFormData, type OtpFormData } from "@somar/shared/validation";
 * ```
 */

export {
  emailSchema,
  otpSchema,
  type EmailFormData,
  type OtpFormData,
} from "./auth-schemas";
