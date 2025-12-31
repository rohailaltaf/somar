import { PrismaClient } from ".prisma/central-client";

// Create Prisma client for the central database (auth, users, Plaid connections)
// This is a singleton to avoid creating multiple connections in development

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
