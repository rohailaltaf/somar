"use server";

import { db } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";

export type AccountType = "checking" | "credit_card" | "investment" | "loan";

export async function getAccounts() {
  return db.account.findMany({
    orderBy: { name: "asc" },
  });
}

// Get accounts with Plaid connection information
export async function getAccountsWithPlaidInfo() {
  return db.account.findMany({
    include: {
      plaidItem: {
        select: {
          institutionName: true,
          lastSyncedAt: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function getAccount(id: string) {
  return db.account.findUnique({
    where: { id },
  });
}

export async function createAccount(name: string, type: AccountType) {
  const id = uuidv4();
  await db.account.create({
    data: {
      id,
      name,
      type,
      createdAt: new Date().toISOString(),
    },
  });
  revalidatePath("/accounts");
  revalidatePath("/upload");
  return { id, name, type };
}

export async function updateAccount(id: string, name: string, type: AccountType) {
  await db.account.update({
    where: { id },
    data: { name, type },
  });
  revalidatePath("/accounts");
  revalidatePath("/upload");
}

export async function deleteAccount(id: string) {
  await db.account.delete({
    where: { id },
  });
  revalidatePath("/accounts");
  revalidatePath("/upload");
  revalidatePath("/transactions");
}

