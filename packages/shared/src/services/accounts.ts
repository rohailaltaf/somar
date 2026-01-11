/**
 * Account service - API client for account operations.
 */

import { apiGet, apiPost, apiPatch, apiDelete, type ApiResponse } from "../api-client";
import type { Account, AccountType, CreateAccountInput } from "../types";

// ============ Queries ============

export async function getAllAccounts(): Promise<Account[]> {
  const response = await apiGet<ApiResponse<Account[]>>("/api/finance-accounts");
  return response.data ?? [];
}

// ============ Mutations ============

export async function createAccount(input: CreateAccountInput): Promise<string> {
  const response = await apiPost<ApiResponse<{ id: string }>>("/api/finance-accounts", input);
  return response.data!.id;
}

export async function updateAccount(
  id: string,
  name: string,
  type: AccountType,
  plaidAccountId?: string | null
): Promise<void> {
  await apiPatch<ApiResponse<Account>>(`/api/finance-accounts/${id}`, {
    name,
    type,
    ...(plaidAccountId !== undefined && { plaidAccountId }),
  });
}

export async function deleteAccount(id: string): Promise<void> {
  await apiDelete<ApiResponse<void>>(`/api/finance-accounts/${id}`);
}
