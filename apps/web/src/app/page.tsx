"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSpendingByCategory, useTotalSpending, useUnconfirmedCount } from "@/hooks";
import { Nav } from "@/components/nav";
import { PageHeader } from "@/components/page-header";
import { BudgetProgress } from "@/components/budget-progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { getCurrentMonth, formatMonth, formatCurrency } from "@/lib/utils";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="Dashboard"
          description="Overview of your spending and budgets"
        />
        <div className="mt-8">
          <DashboardContent />
        </div>
      </main>
    </div>
  );
}

function DashboardContent() {
  const currentMonth = useMemo(() => getCurrentMonth(), []);

  const { data: categorySpending = [], isLoading: loadingSpending } = useSpendingByCategory(currentMonth);
  const { data: totalSpending = 0, isLoading: loadingTotal } = useTotalSpending(currentMonth);
  const { data: unconfirmedCount = 0, isLoading: loadingUnconfirmed } = useUnconfirmedCount();

  const isLoading = loadingSpending || loadingTotal || loadingUnconfirmed;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const totalBudget = categorySpending.reduce(
    (sum, cat) => sum + (cat.budget || 0),
    0
  );
  const overBudgetCategories = categorySpending.filter(
    (cat) => cat.budget && cat.spent > cat.budget
  );
  const nearBudgetCategories = categorySpending.filter(
    (cat) => cat.budget && cat.spent > cat.budget * 0.8 && cat.spent <= cat.budget
  );

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spending</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSpending)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatMonth(currentMonth)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalBudget > 0 ? formatCurrency(totalBudget) : "Not set"}
            </div>
            {totalBudget > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(Math.max(0, totalBudget - totalSpending))} remaining
              </p>
            )}
          </CardContent>
        </Card>

        <Card className={unconfirmedCount > 0 ? "border-amber-500/50" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Unconfirmed Transactions
            </CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unconfirmedCount}</div>
            {unconfirmedCount > 0 && (
              <Link href="/tagger">
                <Button variant="link" className="p-0 h-auto text-xs mt-1">
                  Review now
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {(overBudgetCategories.length > 0 || nearBudgetCategories.length > 0) && (
        <Card className="border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Budget Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {overBudgetCategories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="text-xs">
                      Over budget
                    </Badge>
                    <span className="capitalize font-medium">{cat.name}</span>
                  </div>
                  <span className="text-red-600 font-medium">
                    {formatCurrency(cat.spent - (cat.budget || 0))} over
                  </span>
                </div>
              ))}
              {nearBudgetCategories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs text-amber-600 border-amber-600">
                      Near limit
                    </Badge>
                    <span className="capitalize font-medium">{cat.name}</span>
                  </div>
                  <span className="text-amber-600 font-medium">
                    {formatCurrency((cat.budget || 0) - cat.spent)} remaining
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Spending by Category</CardTitle>
          <CardDescription>
            Your spending breakdown for {formatMonth(currentMonth)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CategoryBreakdown categorySpending={categorySpending} />
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/upload">
          <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="p-3 rounded-lg bg-primary/10">
                <TrendingDown className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Upload Transactions</h3>
                <p className="text-sm text-muted-foreground">
                  Import from CSV
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/tagger">
          <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="p-3 rounded-lg bg-primary/10">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Categorize Transactions</h3>
                <p className="text-sm text-muted-foreground">
                  Quick swipe to tag
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/categories">
          <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="p-3 rounded-lg bg-primary/10">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Manage Budgets</h3>
                <p className="text-sm text-muted-foreground">
                  Set spending limits
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}

function CategoryBreakdown({ categorySpending }: { categorySpending: Array<{ id: string; name: string; color: string; spent: number; budget: number | null }> }) {
  if (categorySpending.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No categories found.</p>
        <Link href="/categories">
          <Button variant="link" className="mt-2">
            Set up categories
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
    );
  }

  const visibleCategories = categorySpending.filter((cat) => cat.spent > 0 || cat.budget);
  
  if (visibleCategories.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No spending data yet this month.</p>
        <Link href="/upload">
          <Button variant="link" className="mt-2">
            Upload transactions
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {visibleCategories
        .sort((a, b) => b.spent - a.spent)
        .map((category) => (
          <BudgetProgress
            key={category.id}
            spent={category.spent}
            budget={category.budget}
            categoryName={category.name}
            categoryColor={category.color}
          />
        ))}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-32 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <div className="h-6 w-48 bg-muted rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
