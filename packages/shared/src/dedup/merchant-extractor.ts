/**
 * Merchant Name Extractor
 *
 * Extracts the core merchant name from messy transaction descriptions.
 * Handles various formats from different banks, payment processors, and Plaid.
 *
 * Note: We intentionally do NOT normalize acronyms (e.g., AWS -> Amazon Web Services)
 * because the LLM in Tier 3 handles this correctly. Maintaining an acronym list is
 * not scalable and the LLM has common sense about brand names and abbreviations.
 */

// Common prefixes added by payment processors and banks
const PREFIXES = [
  // Apple Pay variants
  "APLPAY",
  "APPLE PAY",
  "APL*PAY",
  "APPLEPAY",
  // Square
  "SQ *",
  "SQ*",
  "SQUARE *",
  "GOSQ.COM",
  // Toast (restaurants)
  "TST*",
  "TST *",
  "TOAST*",
  // Stripe/Shopify
  "SP ",
  "SP*",
  "STRIPE*",
  "SHOPIFY*",
  // PayPal/Venmo
  "PAYPAL *",
  "PAYPAL*",
  "PP*",
  "VENMO *",
  "VENMO*",
  // Generic payment types
  "PURCHASE",
  "POS",
  "POS PURCHASE",
  "POS DEBIT",
  "DEBIT",
  "DEBIT CARD",
  "CHECKCARD",
  "CHECK CARD",
  "ACH",
  "ACH DEBIT",
  "ACH CREDIT",
  "ELECTRONIC",
  "RECURRING",
  "AUTOPAY",
  "AUTO PAY",
  "BILL PAY",
  "ONLINE",
  "INTERNET",
  "MOBILE",
  "CONTACTLESS",
  // Credit card payment prefixes
  "MOBILE PAYMENT",
  "AUTOPAY PAYMENT",
  "PAYMENT",
  // Amazon
  "AMZ*",
  "AMZN*",
  "AMAZON*",
  // Google
  "GOOGLE*",
  "GOOGLE *",
  "GOOG*",
  // Uber/Lyft
  "UBER *",
  "UBER*",
  "LYFT *",
  "LYFT*",
  // DoorDash/Grubhub
  "DD *",
  "DOORDASH*",
  "GRUBHUB*",
  "GH*",
  // Instacart
  "INSTACART*",
  // Misc processors
  "CKE*",
  "CHK*",
  "WWW.",
  "HTTP://",
  "HTTPS://",
  "BT*",
  "FH*",
  "CL*",
  "CS *",
  "DNH*",
  "WWP*",
  // International
  "INTL",
  "FOREIGN",
  // Rewards/Credits
  "AMEX RESY CREDIT",
  "AMEX DINING CREDIT",
  "MEM RWDS",
  "GLOBALREWARDS",
];

// Common suffixes that should be removed
const SUFFIXES = [
  // Location patterns (will be handled by regex)
  // Payment confirmations
  "THANK YOU",
  "- THANK YOU",
  "PAYMENT RECEIVED",
  "APPROVED",
  // Transaction types
  "PAYROLL",
  "DIR DEP",
  "DIRECT DEP",
  "DIRECT DEPOSIT",
  "PPD",
  "WEB",
  "TEL",
  "CCD",
  // Card info
  "VISA",
  "MASTERCARD",
  "MC",
  "AMEX",
  "DISCOVER",
  // Misc
  "INC",
  "INC.",
  "LLC",
  "LLC.",
  "CORP",
  "CORP.",
  "CO",
  "CO.",
  "LTD",
  "LTD.",
];

// US State abbreviations for location removal
const US_STATES = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
  "DC",
];

/**
 * Extract the core merchant name from a transaction description.
 *
 * Examples:
 * - "AplPay CHIPOTLE 1249GAINESVILLE VA" -> "CHIPOTLE"
 * - "TST* ROCKWOOD - GAINGAINESVILLE VA" -> "ROCKWOOD"
 * - "Chipotle Mexican Grill" -> "CHIPOTLE MEXICAN GRILL"
 * - "RAISING CANES 0724 MANASSAS VA" -> "RAISING CANES"
 */
export function extractMerchantName(description: string): string {
  if (!description) return "";

  let clean = description.toUpperCase().trim();

  // Step 1: Remove known prefixes
  for (const prefix of PREFIXES) {
    const prefixUpper = prefix.toUpperCase();
    if (clean.startsWith(prefixUpper)) {
      clean = clean.slice(prefixUpper.length).trim();
    }
    // Also try with space after
    if (clean.startsWith(prefixUpper + " ")) {
      clean = clean.slice(prefixUpper.length + 1).trim();
    }
  }

  // Step 2: Remove trailing suffixes
  for (const suffix of SUFFIXES) {
    const suffixUpper = suffix.toUpperCase();
    if (clean.endsWith(suffixUpper)) {
      clean = clean.slice(0, -suffixUpper.length).trim();
    }
    if (clean.endsWith(" " + suffixUpper)) {
      clean = clean.slice(0, -(suffixUpper.length + 1)).trim();
    }
  }

  // Step 3: Remove state abbreviations at the end (with possible city before)
  // Pattern: "CITY STATE" or just "STATE" at end
  const statePattern = new RegExp(
    `\\s+(?:[A-Z]+\\s+)?(${US_STATES.join("|")})\\s*$`,
    "i"
  );
  clean = clean.replace(statePattern, "");

  // Step 4: Remove trailing numbers (store numbers, reference IDs)
  // But keep numbers that are part of merchant name (e.g., "7-ELEVEN")
  clean = clean.replace(/\s+\d{3,}.*$/, ""); // Remove 3+ digit numbers at end
  clean = clean.replace(/\s+#?\d+\s*$/, ""); // Remove short numbers at end
  clean = clean.replace(/\s+\d{4,}$/, ""); // Remove long number sequences

  // Step 5: Remove common location/reference patterns
  clean = clean.replace(/\s+\d{5}(-\d{4})?\s*$/, ""); // ZIP codes
  clean = clean.replace(/\s+\(\d{3}\)\s*\d{3}-\d{4}\s*$/, ""); // Phone numbers
  clean = clean.replace(/\s+\d{3}-\d{3}-\d{4}\s*$/, ""); // Phone numbers
  clean = clean.replace(/\s+[A-Z]{2,3}\d{5,}\s*$/, ""); // Reference IDs like "ID: 12345"
  clean = clean.replace(/\s+ID:\s*\S+\s*$/i, ""); // ID: patterns

  // Step 6: Remove website domains
  clean = clean.replace(/\s+\S+\.(COM|NET|ORG|IO|CO)\S*\s*$/i, "");

  // Step 7: Remove account numbers (like -03007)
  clean = clean.replace(/\s+-\d+\s*$/, "");

  // Step 8: Normalize slashes and special characters
  // "CVS/PHARMACY" -> "CVS PHARMACY"
  clean = clean.replace(/[*#/]+/g, " ");
  clean = clean.replace(/\s+/g, " ");
  clean = clean.trim();

  // Step 9: If still too long, try to extract first meaningful words
  // Many merchants are identifiable by first 2-3 words
  const words = clean.split(/\s+/);
  if (words.length > 4) {
    // Keep first 3-4 words if they seem like a merchant name
    clean = words.slice(0, 4).join(" ");
  }

  // Step 10: Remove trailing punctuation
  clean = clean.replace(/[-,.:;]+$/, "").trim();

  return clean;
}

/**
 * Extract key tokens from a merchant name for token-based matching.
 * Returns significant words that identify the merchant.
 * (Internal helper - used by hasSignificantTokenOverlap)
 */
function extractMerchantTokens(description: string): string[] {
  const extracted = extractMerchantName(description);
  const normalized = extracted.toLowerCase();

  // Split into words and filter out common/short words
  const stopWords = new Set([
    "the",
    "a",
    "an",
    "of",
    "and",
    "or",
    "in",
    "at",
    "to",
    "for",
    "on",
    "by",
  ]);

  const tokens = normalized
    .split(/\s+/)
    .filter((word) => word.length >= 3 && !stopWords.has(word))
    .map((word) => word.replace(/[^a-z0-9]/g, ""))
    .filter((word) => word.length >= 3);

  return tokens;
}

/**
 * Check if two descriptions likely refer to the same merchant
 * using token overlap analysis.
 */
export function hasSignificantTokenOverlap(
  desc1: string,
  desc2: string
): boolean {
  const tokens1 = extractMerchantTokens(desc1);
  const tokens2 = extractMerchantTokens(desc2);

  if (tokens1.length === 0 || tokens2.length === 0) {
    return false;
  }

  // Check if any significant token from one is in the other
  const set1 = new Set(tokens1);
  const set2 = new Set(tokens2);

  // Count overlapping tokens
  let overlap = 0;
  for (const token of set1) {
    if (set2.has(token)) {
      overlap++;
    }
  }

  // Also check for partial matches (one token contains another)
  for (const t1 of tokens1) {
    for (const t2 of tokens2) {
      if (t1.length >= 4 && t2.length >= 4) {
        if (t1.includes(t2) || t2.includes(t1)) {
          overlap++;
        }
      }
    }
  }

  // Consider it a match if there's significant overlap
  const minTokens = Math.min(tokens1.length, tokens2.length);
  return overlap >= 1 && (overlap >= minTokens * 0.5 || overlap >= 2);
}
