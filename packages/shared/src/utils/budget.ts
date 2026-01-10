/**
 * Calculate budget progress as a ratio (0-1).
 * @param spending - Absolute spending amount (positive number)
 * @param budget - Total budget amount
 * @returns Progress ratio between 0 and 1, or 0 if no budget
 */
export function getBudgetProgress(spending: number, budget: number): number {
  if (budget <= 0) return 0;
  return Math.abs(spending) / budget;
}

/**
 * Calculate remaining budget (never negative).
 * @param spending - Absolute spending amount (positive number)
 * @param budget - Total budget amount
 * @returns Remaining budget, minimum 0
 */
export function getBudgetRemaining(spending: number, budget: number): number {
  return Math.max(0, budget - Math.abs(spending));
}
