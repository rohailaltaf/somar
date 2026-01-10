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
  type LoginFormData,
  type RegisterFormData,
} from "./auth-schemas";
