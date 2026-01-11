/**
 * Date conversion helpers for API-level Date <-> string conversions.
 * Used to bridge Prisma's DateTime @db.Date fields with our YYYY-MM-DD string API contract.
 *
 * PostgreSQL DATE fields are returned by Prisma as JavaScript Date objects at midnight UTC.
 * These helpers ensure correct conversion without timezone shifts.
 */

/**
 * Convert YYYY-MM-DD string to Date object for Prisma DATE field.
 * Creates a Date at midnight UTC to match PostgreSQL DATE semantics.
 */
export function toDateField(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

/**
 * Convert Prisma DATE field (Date at midnight UTC) back to YYYY-MM-DD string.
 * Uses UTC methods since PostgreSQL DATE is stored/returned as UTC.
 */
export function fromDateField(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Serialize a transaction for API response - converts Date field to YYYY-MM-DD string.
 */
export function serializeTransaction<T extends { date: Date }>(
  transaction: T
): Omit<T, "date"> & { date: string } {
  return {
    ...transaction,
    date: fromDateField(transaction.date),
  };
}

/**
 * Serialize multiple transactions for API response.
 */
export function serializeTransactions<T extends { date: Date }>(
  transactions: T[]
): (Omit<T, "date"> & { date: string })[] {
  return transactions.map(serializeTransaction);
}
