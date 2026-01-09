/**
 * Validation schemas - shared between web and mobile.
 *
 * Usage:
 * ```typescript
 * import { loginSchema, registerSchema, type LoginFormData } from "@somar/shared/validation";
 * ```
 */

export {
  loginSchema,
  registerSchema,
  unlockSchema,
  type LoginFormData,
  type RegisterFormData,
  type UnlockFormData,
} from "./auth-schemas";
