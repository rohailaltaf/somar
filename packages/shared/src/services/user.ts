/**
 * User service - API client for user operations.
 */

import { apiGet, type ApiResponse } from "../api-client";

export interface MeResponse {
  id: string;
  email: string;
  name: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  approvedAt: string | null;
}

/**
 * Get the current user's info including approval status.
 */
export async function getMe(): Promise<MeResponse> {
  const response = await apiGet<ApiResponse<MeResponse>>("/api/me");
  return response.data!;
}
