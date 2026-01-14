import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { expo } from "@better-auth/expo";
import { emailOTP } from "better-auth/plugins";
import { db } from "./db";
import { sendOTPEmail } from "./email";

const DEFAULT_CATEGORIES = [
  { name: "personal", type: "spending", color: "oklch(0.65 0.15 280)" },
  { name: "restaurant", type: "spending", color: "oklch(0.65 0.2 30)" },
  { name: "grocery", type: "spending", color: "oklch(0.65 0.18 140)" },
  { name: "shopping", type: "spending", color: "oklch(0.65 0.18 350)" },
  { name: "entertainment", type: "spending", color: "oklch(0.65 0.2 330)" },
  { name: "subscriptions", type: "spending", color: "oklch(0.6 0.15 300)" },
  { name: "travel", type: "spending", color: "oklch(0.6 0.18 200)" },
  { name: "car", type: "spending", color: "oklch(0.5 0.12 240)" },
  { name: "house", type: "spending", color: "oklch(0.6 0.12 80)" },
  { name: "work", type: "spending", color: "oklch(0.55 0.15 250)" },
  { name: "job income", type: "income", color: "oklch(0.7 0.2 140)" },
  { name: "transfers", type: "transfer", color: "oklch(0.5 0.08 220)" },
  { name: "credit card payments", type: "transfer", color: "oklch(0.5 0.08 200)" },
  { name: "reimbursed", type: "transfer", color: "oklch(0.7 0.15 150)" },
];

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),

  // Rate limiting for OTP endpoints to prevent abuse
  rateLimit: {
    enabled: true,
    window: 60, // 1 minute window
    max: 100, // Default max requests per window
    customRules: {
      "/email-otp/send-verification-otp": { window: 30, max: 1 }, // 1 OTP request per 30 seconds
    },
  },

  plugins: [
    expo(),
    emailOTP({
      sendVerificationOTP: async ({ email, otp }) => {
        await sendOTPEmail(email, otp);
      },
      otpLength: 6,
      expiresIn: 600, // 10 minutes
    }),
  ],

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await db.category.createMany({
            data: DEFAULT_CATEGORIES.map((cat) => ({
              userId: user.id,
              name: cat.name,
              type: cat.type,
              color: cat.color,
            })),
          });
        },
      },
    },
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session daily
    cookieCache: {
      enabled: false,
    },
  },

  // Trust proxy headers for production (behind reverse proxy)
  trustedOrigins: [process.env.BETTER_AUTH_URL, "somar://"].filter(
    (origin): origin is string => Boolean(origin)
  ),
});

// Export types for use in API routes and middleware
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;

