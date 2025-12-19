"use client";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface BudgetProgressProps {
  spent: number;
  budget: number | null;
  categoryName: string;
  categoryColor?: string;
  showDetails?: boolean;
}

export function BudgetProgress({
  spent,
  budget,
  categoryName,
  categoryColor,
  showDetails = true,
}: BudgetProgressProps) {
  const percentage = budget ? Math.min((spent / budget) * 100, 100) : 0;
  const isOverBudget = budget ? spent > budget : false;
  const isNearBudget = budget ? spent > budget * 0.8 : false;

  const getProgressColor = () => {
    if (isOverBudget) return "bg-red-500";
    if (isNearBudget) return "bg-amber-500";
    return "bg-emerald-500";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {categoryColor && (
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: categoryColor }}
            />
          )}
          <span className="font-medium capitalize">{categoryName}</span>
        </div>
        {showDetails && (
          <span className={cn("text-sm", isOverBudget && "text-red-500 font-medium")}>
            {formatCurrency(spent)}
            {budget && (
              <span className="text-muted-foreground">
                {" "}
                / {formatCurrency(budget)}
              </span>
            )}
          </span>
        )}
      </div>
      {budget && (
        <div className="relative">
          <Progress value={percentage} className="h-2" />
          <div
            className={cn(
              "absolute inset-0 h-2 rounded-full transition-all",
              getProgressColor()
            )}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      )}
      {!budget && (
        <p className="text-xs text-muted-foreground">No budget set</p>
      )}
    </div>
  );
}






