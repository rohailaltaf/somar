import Papa from "papaparse";

export interface ColumnMapping {
  date: string | null;
  description: string | null;
  amount: string | null;
  // Optional debit/credit columns (some banks split these)
  debit?: string | null;
  credit?: string | null;
}

export interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  rawRow: Record<string, string>;
}

export interface CSVParseResult {
  headers: string[];
  rows: Record<string, string>[];
  inferredMapping: ColumnMapping;
  preview: Record<string, string>[];
}

/**
 * Parse CSV file and infer column mappings
 */
export function parseCSV(csvContent: string): CSVParseResult {
  const result = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  const headers = result.meta.fields || [];
  const rows = result.data;
  const preview = rows.slice(0, 5);

  // Infer column mappings
  const inferredMapping = inferColumnMapping(headers, preview);

  return {
    headers,
    rows,
    inferredMapping,
    preview,
  };
}

/**
 * Infer column mappings based on column names and data patterns
 */
function inferColumnMapping(
  headers: string[],
  sampleRows: Record<string, string>[]
): ColumnMapping {
  const mapping: ColumnMapping = {
    date: null,
    description: null,
    amount: null,
    debit: null,
    credit: null,
  };

  const lowerHeaders = headers.map((h) => h.toLowerCase());

  // Find date column
  mapping.date = findDateColumn(headers, lowerHeaders, sampleRows);

  // Find description column
  mapping.description = findDescriptionColumn(headers, lowerHeaders, sampleRows);

  // Find amount column(s)
  const amountColumns = findAmountColumns(headers, lowerHeaders, sampleRows);
  mapping.amount = amountColumns.amount;
  mapping.debit = amountColumns.debit;
  mapping.credit = amountColumns.credit;

  return mapping;
}

/**
 * Find the date column
 */
function findDateColumn(
  headers: string[],
  lowerHeaders: string[],
  sampleRows: Record<string, string>[]
): string | null {
  // First try by name
  const dateKeywords = [
    "date",
    "transaction date",
    "trans date",
    "post date",
    "posting date",
    "posted",
  ];

  for (const keyword of dateKeywords) {
    const index = lowerHeaders.findIndex(
      (h) => h === keyword || h.includes(keyword)
    );
    if (index !== -1) {
      return headers[index];
    }
  }

  // Try by pattern matching
  for (const header of headers) {
    const values = sampleRows.map((row) => row[header]).filter(Boolean);
    if (values.length > 0 && values.every(isDateLike)) {
      return header;
    }
  }

  return null;
}

/**
 * Find the description column
 */
function findDescriptionColumn(
  headers: string[],
  lowerHeaders: string[],
  sampleRows: Record<string, string>[]
): string | null {
  // First try by name
  const descKeywords = [
    "description",
    "memo",
    "payee",
    "merchant",
    "name",
    "transaction",
    "details",
    "narrative",
  ];

  for (const keyword of descKeywords) {
    const index = lowerHeaders.findIndex(
      (h) => h === keyword || h.includes(keyword)
    );
    if (index !== -1) {
      return headers[index];
    }
  }

  // Find the column with the longest average text (likely description)
  let longestAvgColumn: string | null = null;
  let maxAvgLength = 0;

  for (const header of headers) {
    const values = sampleRows.map((row) => row[header] || "");
    const avgLength =
      values.reduce((sum, v) => sum + v.length, 0) / values.length;

    // Description should be text, not numbers
    const hasLetters = values.some((v) => /[a-zA-Z]/.test(v));

    if (hasLetters && avgLength > maxAvgLength) {
      maxAvgLength = avgLength;
      longestAvgColumn = header;
    }
  }

  return longestAvgColumn;
}

/**
 * Find amount column(s)
 */
function findAmountColumns(
  headers: string[],
  lowerHeaders: string[],
  sampleRows: Record<string, string>[]
): { amount: string | null; debit: string | null; credit: string | null } {
  const result = { amount: null as string | null, debit: null as string | null, credit: null as string | null };

  // Check for single amount column
  const amountKeywords = ["amount", "total", "sum", "value"];
  for (const keyword of amountKeywords) {
    const index = lowerHeaders.findIndex(
      (h) => h === keyword || h.includes(keyword)
    );
    if (index !== -1) {
      result.amount = headers[index];
      break;
    }
  }

  // Check for debit/credit columns
  const debitKeywords = ["debit", "withdrawal", "charge", "expense"];
  const creditKeywords = ["credit", "deposit", "payment", "income"];

  for (const keyword of debitKeywords) {
    const index = lowerHeaders.findIndex(
      (h) => h === keyword || h.includes(keyword)
    );
    if (index !== -1) {
      result.debit = headers[index];
      break;
    }
  }

  for (const keyword of creditKeywords) {
    const index = lowerHeaders.findIndex(
      (h) => h === keyword || h.includes(keyword)
    );
    if (index !== -1) {
      result.credit = headers[index];
      break;
    }
  }

  // If no amount column found by name, find by pattern
  if (!result.amount && !result.debit && !result.credit) {
    for (const header of headers) {
      const values = sampleRows.map((row) => row[header]).filter(Boolean);
      if (values.length > 0 && values.every(isAmountLike)) {
        result.amount = header;
        break;
      }
    }
  }

  return result;
}

/**
 * Check if a string looks like a date
 */
function isDateLike(value: string): boolean {
  if (!value) return false;

  const datePatterns = [
    /^\d{1,2}\/\d{1,2}\/\d{2,4}$/, // MM/DD/YYYY or M/D/YY
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    /^\d{1,2}-\d{1,2}-\d{2,4}$/, // MM-DD-YYYY
    /^[A-Za-z]{3}\s+\d{1,2},?\s+\d{4}$/, // Jan 15, 2024
    /^\d{1,2}\s+[A-Za-z]{3}\s+\d{4}$/, // 15 Jan 2024
  ];

  return datePatterns.some((pattern) => pattern.test(value.trim()));
}

/**
 * Check if a string looks like a currency amount
 */
function isAmountLike(value: string): boolean {
  if (!value) return false;

  // Remove currency symbols and whitespace
  const cleaned = value.replace(/[$€£¥,\s]/g, "").trim();

  // Check if it's a number (possibly negative, possibly with parentheses for negative)
  return /^-?\d+\.?\d*$/.test(cleaned) || /^\(\d+\.?\d*\)$/.test(cleaned);
}

/**
 * Parse a date string into YYYY-MM-DD format
 */
export function parseDate(dateStr: string): string {
  const cleaned = dateStr.trim();

  // Try various date formats
  const formats = [
    // MM/DD/YYYY
    {
      pattern: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
      parse: (m: RegExpMatchArray) =>
        `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`,
    },
    // M/D/YY
    {
      pattern: /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/,
      parse: (m: RegExpMatchArray) => {
        const year = parseInt(m[3]) > 50 ? `19${m[3]}` : `20${m[3]}`;
        return `${year}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
      },
    },
    // YYYY-MM-DD
    {
      pattern: /^(\d{4})-(\d{2})-(\d{2})$/,
      parse: (m: RegExpMatchArray) => `${m[1]}-${m[2]}-${m[3]}`,
    },
    // MM-DD-YYYY
    {
      pattern: /^(\d{2})-(\d{2})-(\d{4})$/,
      parse: (m: RegExpMatchArray) => `${m[3]}-${m[1]}-${m[2]}`,
    },
  ];

  for (const { pattern, parse } of formats) {
    const match = cleaned.match(pattern);
    if (match) {
      return parse(match);
    }
  }

  // Fallback: try native Date parsing (with UTC approach)
  const date = new Date(cleaned + "T12:00:00Z"); // Add noon UTC time
  if (!isNaN(date.getTime())) {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // Return as-is if we can't parse
  return cleaned;
}

/**
 * Parse an amount string into a number
 * Preserves the sign from the original value
 */
export function parseAmount(amountStr: string): number {
  if (!amountStr) return 0;

  let cleaned = amountStr.trim();

  // Check for parentheses (negative in accounting format)
  const isNegative =
    (cleaned.startsWith("(") && cleaned.endsWith(")")) || cleaned.startsWith("-");

  // Remove currency symbols, commas, parentheses
  cleaned = cleaned.replace(/[$€£¥,()]/g, "").trim();

  // Remove leading minus if present
  cleaned = cleaned.replace(/^-/, "");

  const value = parseFloat(cleaned) || 0;

  // Preserve the original sign
  return isNegative ? -value : value;
}

/**
 * Transform parsed rows into transactions using column mapping
 */
export function transformToTransactions(
  rows: Record<string, string>[],
  mapping: ColumnMapping
): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];

  for (const row of rows) {
    // Skip if essential columns are missing
    if (!mapping.date || !mapping.description) {
      continue;
    }

    const dateValue = row[mapping.date];
    const descValue = row[mapping.description];

    if (!dateValue || !descValue) {
      continue;
    }

    // Calculate amount
    let amount = 0;

    if (mapping.amount) {
      // Single amount column - preserve the sign as-is
      const amountValue = row[mapping.amount];
      amount = parseAmount(amountValue);
    } else if (mapping.debit || mapping.credit) {
      // Separate debit/credit columns
      const debitValue = mapping.debit ? row[mapping.debit] : "";
      const creditValue = mapping.credit ? row[mapping.credit] : "";

      if (debitValue && parseFloat(debitValue.replace(/[$,]/g, ""))) {
        // Debits are expenses (positive)
        amount = Math.abs(parseAmount(debitValue));
      } else if (creditValue && parseFloat(creditValue.replace(/[$,]/g, ""))) {
        // Credits are income/refunds (negative)
        amount = -Math.abs(parseAmount(creditValue));
      }
    }

    transactions.push({
      date: parseDate(dateValue),
      description: descValue.trim(),
      amount,
      rawRow: row,
    });
  }

  return transactions;
}

/**
 * Check for duplicate transactions
 */
export function isDuplicate(
  transaction: ParsedTransaction,
  existingTransactions: { date: string; description: string; amount: number }[]
): boolean {
  return existingTransactions.some(
    (existing) =>
      existing.date === transaction.date &&
      existing.description === transaction.description &&
      Math.abs(existing.amount - transaction.amount) < 0.01
  );
}

