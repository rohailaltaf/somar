/**
 * Script to approve a user and send them an approval email.
 *
 * Usage:
 *   pnpm --filter web approve-user <email>        # Approve a single user
 *   pnpm --filter web approve-user --list        # List all PENDING users
 *   pnpm --filter web approve-user --all         # Approve all PENDING users
 */

import { PrismaClient } from "@prisma/client";
import { Resend } from "resend";

const db = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://somar.app";
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Somar <noreply@somar.com>";

async function sendApprovalEmail(email: string) {
  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "You're in! Welcome to Somar",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="font-size: 24px; font-weight: 600; color: #1a1a1a; margin-bottom: 24px;">Welcome to Somar!</h1>
          <p style="font-size: 16px; color: #4a4a4a; margin-bottom: 24px;">Great news - your account has been APPROVED. You now have full access to Somar.</p>
          <div style="margin-bottom: 24px;">
            <a href="${APP_URL}/login" style="display: inline-block; background: #1a1a1a; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">Log in to Somar</a>
          </div>
          <p style="font-size: 14px; color: #6a6a6a;">If you have any questions, just reply to this email.</p>
        </div>
      `,
    });

    if (result.error) {
      console.error(`  Failed to send email to ${email}:`, result.error.message);
      return false;
    }
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
      APPROVEDAt: new Date(),
    },
  });

  console.log(`Approved: ${email}`);

  const emailSent = await sendApprovalEmail(email);
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
