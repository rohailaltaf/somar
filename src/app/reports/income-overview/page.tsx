import { Suspense } from "react";
import { Nav } from "@/components/nav";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getTotalIncome,
  getIncomeByCategory,
  getYearToDateIncome,
  getYearToDateCategoryIncome,
  getMonthlyIncome,
} from "@/actions/transactions";
import { IncomeOverviewClient } from "./income-overview-client";

async function IncomeOverviewContent() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  
  // Get previous month
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;

  const [
    currentTotal,
    lastTotal,
    currentCategoryIncome,
    lastCategoryIncome,
    yearTotal,
    yearCategoryIncome,
    yearMonthlyData,
  ] = await Promise.all([
    getTotalIncome(currentMonth),
    getTotalIncome(lastMonth),
    getIncomeByCategory(currentMonth),
    getIncomeByCategory(lastMonth),
    getYearToDateIncome(currentYear),
    getYearToDateCategoryIncome(currentYear),
    getMonthlyIncome(currentYear),
  ]);

  return (
    <IncomeOverviewClient
      currentMonth={currentMonth}
      lastMonth={lastMonth}
      currentYear={currentYear}
      currentTotal={currentTotal}
      lastTotal={lastTotal}
      yearTotal={yearTotal}
      currentCategoryIncome={currentCategoryIncome}
      lastCategoryIncome={lastCategoryIncome}
      yearCategoryIncome={yearCategoryIncome}
      yearMonthlyData={yearMonthlyData}
    />
  );
}

function IncomeOverviewSkeleton() {
  return (
    <div className="space-y-8">
      {/* Total income skeleton */}
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

export default function IncomeOverviewPage() {
  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="Income Overview"
          description="Track your income by period and category"
        />
        <div className="mt-8">
          <Suspense fallback={<IncomeOverviewSkeleton />}>
            <IncomeOverviewContent />
          </Suspense>
        </div>
      </main>
    </div>
  );
}






