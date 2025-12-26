import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

// Initialize Plaid client configuration
const configuration = new Configuration({
  basePath:
    PlaidEnvironments[
      (process.env.PLAID_ENV as keyof typeof PlaidEnvironments) || "sandbox"
    ],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID || "",
      "PLAID-SECRET": process.env.PLAID_SECRET || "",
    },
  },
});

// Export the Plaid client instance
export const plaidClient = new PlaidApi(configuration);

// Plaid product types we're requesting
export const PLAID_PRODUCTS = ["transactions"] as const;

// Countries we support
export const PLAID_COUNTRY_CODES = ["US"] as const;

// Helper to check if Plaid is configured
export function isPlaidConfigured(): boolean {
  return !!(process.env.PLAID_CLIENT_ID && process.env.PLAID_SECRET);
}





