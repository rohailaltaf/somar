/**
 * API Client for making authenticated requests to the backend.
 * Works on both web and mobile with platform-specific configuration.
 */

export interface ApiClientConfig {
  baseUrl: string;
  getAuthHeaders: () => Promise<Record<string, string>> | Record<string, string>;
}

let config: ApiClientConfig | null = null;

/**
 * Configure the API client. Must be called before making any requests.
 * Call this in your app's initialization (e.g., in a provider).
 */
export function configureApiClient(c: ApiClientConfig) {
  config = c;
}

/**
 * Get the current API client config.
 */
export function getApiClientConfig(): ApiClientConfig | null {
  return config;
}

/**
 * API error with status code and error details.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Standard API response wrapper.
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

/**
 * Make an authenticated API request.
 *
 * @param path - API path (e.g., "/api/transactions")
 * @param options - Fetch options
 * @returns Parsed JSON response
 * @throws ApiError on failure
 */
export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  if (!config) {
    throw new Error(
      "API client not configured. Call configureApiClient() first."
    );
  }

  const authHeaders = await config.getAuthHeaders();

  const response = await fetch(`${config.baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...options.headers,
    },
  });

  // Handle empty responses (204 No Content)
  if (response.status === 204) {
    return { success: true } as T;
  }

  const json = await response.json().catch(() => ({
    success: false,
    error: { code: "PARSE_ERROR", message: "Failed to parse response" },
  }));

  if (!response.ok) {
    throw new ApiError(
      json.error?.message || `Request failed with status ${response.status}`,
      response.status,
      json.error?.code
    );
  }

  return json;
}

/**
 * Make a GET request.
 */
export function apiGet<T>(path: string): Promise<T> {
  return apiRequest<T>(path, { method: "GET" });
}

/**
 * Make a POST request.
 */
export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return apiRequest<T>(path, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Make a PATCH request.
 */
export function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  return apiRequest<T>(path, {
    method: "PATCH",
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Make a DELETE request.
 */
export function apiDelete<T>(path: string): Promise<T> {
  return apiRequest<T>(path, { method: "DELETE" });
}
