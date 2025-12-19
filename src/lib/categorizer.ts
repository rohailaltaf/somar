import { db } from "./db";
import { v4 as uuidv4 } from "uuid";

export interface CategorizationResult {
  categoryId: string | null;
  confidence: "high" | "medium" | "low" | "none";
  matchedPattern?: string;
}

export interface CategorizationRule {
  id: string;
  pattern: string;
  categoryId: string;
  isPreset: boolean;
}

/**
 * Get all categorization rules (for batch processing)
 */
export async function getCategorizationRules(): Promise<CategorizationRule[]> {
  return db.categorizationRule.findMany({
    orderBy: { isPreset: "asc" },
  });
}

/**
 * Categorize a transaction using pre-fetched rules (fast - no DB query)
 * Use this when processing multiple transactions in a batch
 */
export function categorizeWithRules(
  description: string,
  rules: CategorizationRule[]
): CategorizationResult {
  const normalizedDescription = description.toUpperCase().trim();

  // First pass: exact match (highest confidence)
  for (const rule of rules) {
    if (normalizedDescription === rule.pattern.toUpperCase()) {
      return {
        categoryId: rule.categoryId,
        confidence: "high",
        matchedPattern: rule.pattern,
      };
    }
  }

  // Second pass: starts with pattern (high confidence)
  for (const rule of rules) {
    if (normalizedDescription.startsWith(rule.pattern.toUpperCase())) {
      return {
        categoryId: rule.categoryId,
        confidence: "high",
        matchedPattern: rule.pattern,
      };
    }
  }

  // Third pass: contains pattern (medium confidence)
  for (const rule of rules) {
    if (normalizedDescription.includes(rule.pattern.toUpperCase())) {
      return {
        categoryId: rule.categoryId,
        confidence: "medium",
        matchedPattern: rule.pattern,
      };
    }
  }

  // No match found
  return {
    categoryId: null,
    confidence: "none",
  };
}

/**
 * Auto-categorize a transaction based on its description
 * Uses both preset rules and learned patterns
 * Learned rules take priority over preset rules
 * 
 * NOTE: For batch processing, use getCategorizationRules() + categorizeWithRules()
 */
export async function categorizeTransaction(
  description: string
): Promise<CategorizationResult> {
  const rules = await getCategorizationRules();
  return categorizeWithRules(description, rules);
}

/**
 * Learn a new categorization pattern from user confirmation
 * Extracts a merchant name pattern from the description
 */
export async function learnCategorizationPattern(
  description: string,
  categoryId: string
): Promise<void> {
  // Validate inputs
  if (!description || typeof description !== 'string') {
    return;
  }
  if (!categoryId || typeof categoryId !== 'string') {
    return;
  }
  
  // Extract a meaningful pattern from the description
  const pattern = extractMerchantPattern(description);

  if (!pattern || pattern.length < 3) {
    return; // Pattern too short or couldn't be extracted
  }

  // Check if we already have this pattern
  const existingRule = await db.categorizationRule.findFirst({
    where: { pattern },
  });

  if (existingRule) {
    // Update existing rule if category changed
    if (existingRule.categoryId !== categoryId) {
      await db.categorizationRule.update({
        where: { id: existingRule.id },
        data: { categoryId },
      });
    }
    return;
  }

  // Create new learned rule
  await db.categorizationRule.create({
    data: {
      id: uuidv4(),
      pattern,
      categoryId,
      isPreset: false,
      createdAt: new Date().toISOString(),
    },
  });
}

/**
 * Extract a merchant pattern from a transaction description
 * Tries to identify the merchant name from common bank description formats
 * Goal: Extract just enough to identify the merchant, not the full description
 */
function extractMerchantPattern(description: string): string {
  let pattern = description.toUpperCase().trim();

  // Remove common prefixes
  const prefixesToRemove = [
    "PURCHASE ",
    "POS ",
    "DEBIT ",
    "CREDIT ",
    "CHECKCARD ",
    "VISA ",
    "MASTERCARD ",
    "AMEX ",
    "ACH ",
    "PAYMENT TO ",
    "PAYMENT ",
    "TRANSFER ",
    "RECURRING ",
    "AUTOPAY ",
    "SQ *",
    "TST* ",
    "PP*",
    "PAYPAL *",
  ];

  for (const prefix of prefixesToRemove) {
    if (pattern.startsWith(prefix)) {
      pattern = pattern.slice(prefix.length);
    }
  }

  // Remove common transaction type suffixes BEFORE other processing
  // These indicate transaction type, not merchant identity
  const suffixesToRemove = [
    " PAYROLL",
    " DIR DEP",
    " DIRECT DEP",
    " DIRECT DEPOSIT",
    " PPD ID:",
    " PPD",
    " CCD",
    " WEB ID:",
    " WEB",
    " TEL",
    " ACH",
  ];
  
  for (const suffix of suffixesToRemove) {
    const idx = pattern.indexOf(suffix);
    if (idx > 5) {
      pattern = pattern.slice(0, idx);
    }
  }

  // Remove date patterns (MM/DD, MM-DD, etc.)
  pattern = pattern.replace(/\d{2}\/\d{2}(\/\d{2,4})?/g, "");
  pattern = pattern.replace(/\d{2}-\d{2}(-\d{2,4})?/g, "");

  // Remove trailing transaction IDs, reference numbers
  pattern = pattern.replace(/\s+\d{4,}$/g, "");
  pattern = pattern.replace(/\s+#\d+$/g, "");
  pattern = pattern.replace(/\s+REF.*$/g, "");
  pattern = pattern.replace(/\s+ID:.*$/g, "");

  // Remove location suffixes (city, state codes at the end)
  pattern = pattern.replace(/\s+[A-Z]{2}\s*\d{5}(-\d{4})?$/g, ""); // ZIP codes
  pattern = pattern.replace(/\s+[A-Z]{2}$/g, ""); // State codes at end

  // Remove special characters at the end
  pattern = pattern.replace(/[*#\-_]+$/g, "");

  // Clean up multiple spaces
  pattern = pattern.replace(/\s+/g, " ").trim();

  // If the pattern is too long, try to find a natural break point
  if (pattern.length > 30) {
    // Look for common separators that might indicate end of merchant name
    const separators = [" - ", " / ", " @ ", " | "];
    for (const sep of separators) {
      const idx = pattern.indexOf(sep);
      if (idx > 5 && idx < 30) {
        pattern = pattern.slice(0, idx);
        break;
      }
    }
  }

  // If still too long, take first 3-4 words (merchant names are usually short)
  if (pattern.length > 25) {
    const words = pattern.split(/\s+/);
    pattern = words.slice(0, 3).join(" ");
  }

  return pattern.trim();
}

/**
 * Batch categorize multiple transactions
 */
export async function categorizeTransactions(
  descriptions: string[]
): Promise<Map<string, CategorizationResult>> {
  const results = new Map<string, CategorizationResult>();

  for (const description of descriptions) {
    const result = await categorizeTransaction(description);
    results.set(description, result);
  }

  return results;
}

