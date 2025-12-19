import { Suspense } from "react";
import { Nav } from "@/components/nav";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getTotalSpending,
  getSpendingByCategory,
  getDailyCumulativeSpending,
  getYearToDateSpending,
  getYearToDateCategorySpending,
  getMonthlyCumulativeSpending,
  getSpendingTransactions,
  getYearSpendingTransactions,
} from "@/actions/transactions";
import { SpendingOverviewClient } from "./spending-overview-client";

async function SpendingOverviewContent() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  
  // Get previous month
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;

  const [
    currentTotal,
    lastTotal,
    currentCategorySpending,
    lastCategorySpending,
    currentDailyData,
    lastDailyData,
    yearTotal,
    yearCategorySpending,
    yearMonthlyData,
    currentTransactions,
    lastTransactions,
    yearTransactions,
  ] = await Promise.all([
    getTotalSpending(currentMonth),
    getTotalSpending(lastMonth),
    getSpendingByCategory(currentMonth),
    getSpendingByCategory(lastMonth),
    getDailyCumulativeSpending(currentMonth),
    getDailyCumulativeSpending(lastMonth),
    getYearToDateSpending(currentYear),
    getYearToDateCategorySpending(currentYear),
    getMonthlyCumulativeSpending(currentYear),
    getSpendingTransactions(currentMonth),
    getSpendingTransactions(lastMonth),
    getYearSpendingTransactions(currentYear),
  ]);

  return (
    <SpendingOverviewClient
      currentMonth={currentMonth}
      lastMonth={lastMonth}
      currentYear={currentYear}
      currentTotal={currentTotal}
      lastTotal={lastTotal}
      yearTotal={yearTotal}
      currentCategorySpending={currentCategorySpending}
      lastCategorySpending={lastCategorySpending}
      yearCategorySpending={yearCategorySpending}
      currentDailyData={currentDailyData}
      lastDailyData={lastDailyData}
      yearMonthlyData={yearMonthlyData}
      currentTransactions={currentTransactions}
      lastTransactions={lastTransactions}
      yearTransactions={yearTransactions}
    />
  );
}

function SpendingOverviewSkeleton() {
  return (
    <div className="space-y-8">
      {/* Total spending skeleton */}
      <Card>
        <CardHeader>
          <div className="h-6 w-48 bg-muted rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="h-12 w-64 bg-muted rounded animate-pulse" />
        </CardContent>
      </Card>

      {/* Chart skeleton */}
      <Card>
        <CardHeader>
          <div className="h-6 w-48 bg-muted rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-muted rounded animate-pulse" />
        </CardContent>
      </Card>

      {/* Categories skeleton */}
      <Card>
        <CardHeader>
          <div className="h-6 w-48 bg-muted rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SpendingOverviewPage() {
  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="Spending Overview"
          description="Monthly spending comparison and category breakdown"
        />
        <div className="mt-8">
          <Suspense fallback={<SpendingOverviewSkeleton />}>
            <SpendingOverviewContent />
          </Suspense>
        </div>
      </main>
    </div>
  );
}

