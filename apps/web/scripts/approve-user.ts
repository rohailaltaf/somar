/**
 * Script to approve a user and send them an approval email.
 *
 * Usage:
 *   pnpm --filter web approve-user <email>        # Approve a single user
 *   pnpm --filter web approve-user --list        # List all PENDING users
 *   pnpm --filter web approve-user --all         # Approve all PENDING users
 */

import { PrismaClient } from ".prisma/central-client";
import { sendApprovalEmail } from "../src/lib/email";

const db = new PrismaClient();

async function trySendApprovalEmail(email: string): Promise<boolean> {
  try {
    await sendApprovalEmail(email);
    return true;
  } catch (err) {
    console.error(`  Failed to send email to ${email}:`, err);
    return false;
  }
}

async function listPendingUsers() {
  const users = await db.user.findMany({
    where: { status: "PENDING" },
    select: { id: true, email: true, name: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  if (users.length === 0) {
    console.log("No PENDING users.");
    return;
  }

  console.log(`\nPending users (${users.length}):\n`);
  for (const user of users) {
    console.log(`  ${user.email}`);
    console.log(`    Name: ${user.name}`);
    console.log(`    Joined: ${user.createdAt.toISOString()}`);
    console.log();
  }
}

async function approveUser(email: string) {
  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, email: true, status: true },
  });

  if (!user) {
    console.error(`User not found: ${email}`);
    return false;
  }

  if (user.status === "APPROVED") {
    console.log(`User already APPROVED: ${email}`);
    return true;
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      status: "APPROVED",
      approvedAt: new Date(),
    },
  });

  // Delete all sessions to force re-login with fresh status
  await db.session.deleteMany({
    where: { userId: user.id },
  });

  console.log(`Approved: ${email}`);

  const emailSent = await trySendApprovalEmail(email);
  if (emailSent) {
    console.log(`  Email sent successfully`);
  }

  return true;
}

async function approveAllPendingUsers() {
  const users = await db.user.findMany({
    where: { status: "PENDING" },
    select: { email: true },
  });

  if (users.length === 0) {
    console.log("No PENDING users to approve.");
    return;
  }

  console.log(`Approving ${users.length} users...\n`);

  for (const user of users) {
    await approveUser(user.email);
  }

  console.log(`\nDone. Approved ${users.length} users.`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("Usage:");
    console.log("  pnpm --filter web approve-user <email>  # Approve a single user");
    console.log("  pnpm --filter web approve-user --list   # List all PENDING users");
    console.log("  pnpm --filter web approve-user --all    # Approve all PENDING users");
    process.exit(1);
  }

  const arg = args[0];

  if (arg === "--list") {
    await listPendingUsers();
  } else if (arg === "--all") {
    await approveAllPendingUsers();
  } else {
    // Treat as email
    await approveUser(arg);
  }

  await db.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
