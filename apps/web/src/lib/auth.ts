import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { expo } from "@better-auth/expo";
import { db } from "./db";



export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),

  plugins: [expo()],

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
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
  trustedOrigins: [process.env.BETTER_AUTH_URL || "", "somar://"],
});

// Export types for use in API routes and middleware
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;

