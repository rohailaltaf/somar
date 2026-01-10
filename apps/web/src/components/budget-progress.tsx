"use client";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@somar/shared";
import { useBudgetProgress } from "@somar/shared/ui-logic";
import type { BudgetRowProps } from "@somar/shared/components";

/**
 * Budget progress component.
 *
 * Displays spending progress against a budget with visual indicators.
 * Implements the BudgetRowProps contract from @somar/shared/components.
 *
 * @example
 * <BudgetProgress category={category} spent={-234} budget={400} />
 */
export function BudgetProgress({
  category,
  spent,
  budget,
  showDetails = true,
}: BudgetRowProps) {

  const {
    percentCapped,
    isOverBudget,
    hasBudget,
    colorToken,
  } = useBudgetProgress(spent, budget);

  // Map color token to Tailwind class
  const colorClassMap = {
    primary: "bg-emerald-500",
    warning: "bg-amber-500",
    destructive: "bg-red-500",
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {category.color && (
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: category.color }}
            />
          )}
          <span className="font-medium capitalize">{category.name}</span>
        </div>
        {showDetails && (
          <span className={cn("text-sm", isOverBudget && "text-destructive font-medium")}>
            {formatCurrency(Math.abs(spent))}
            {budget && (
              <span className="text-muted-foreground">
                {" "}
                / {formatCurrency(budget)}
              </span>
            )}
          </span>
        )}
      </div>
      {hasBudget && (
        <div className="relative">
          <Progress value={percentCapped} className="h-2" />
          <div
            className={cn(
              "absolute inset-0 h-2 rounded-full transition-all",
              colorClassMap[colorToken]
            )}
            style={{ width: `${percentCapped}%` }}
          />
        </div>
      )}
      {!hasBudget && (
        <p className="text-xs text-muted-foreground">No budget set</p>
      )}
    </div>
  );
}
