"use client";

import { useMemo } from "react";
import { Nav } from "@/components/nav";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useDatabase } from "@/hooks/use-database";
import { SpendingOverviewClient } from "./spending-overview-client";
import * as TransactionService from "@/services/transactions";
import { getCurrentMonth, getPreviousMonth } from "@/lib/utils";

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
          <SpendingOverviewContent />
        </div>
      </main>
    </div>
  );
}

function SpendingOverviewContent() {
  const { db } = useDatabase();
  
  const currentMonth = useMemo(() => getCurrentMonth(), []);
  const lastMonth = useMemo(() => getPreviousMonth(currentMonth), [currentMonth]);
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  const data = useMemo(() => {
    if (!db) return null;

    return {
      currentTotal: TransactionService.getTotalSpending(db, currentMonth),
      lastTotal: TransactionService.getTotalSpending(db, lastMonth),
      currentCategorySpending: TransactionService.getSpendingByCategory(db, currentMonth),
      lastCategorySpending: TransactionService.getSpendingByCategory(db, lastMonth),
      currentDailyData: TransactionService.getDailyCumulativeSpending(db, currentMonth),
      lastDailyData: TransactionService.getDailyCumulativeSpending(db, lastMonth),
      yearTotal: TransactionService.getYearToDateSpending(db, currentYear),
      yearCategorySpending: TransactionService.getYearToDateCategorySpending(db, currentYear),
      yearMonthlyData: TransactionService.getMonthlyCumulativeSpending(db, currentYear),
      currentTransactions: TransactionService.getSpendingTransactions(db, currentMonth),
      lastTransactions: TransactionService.getSpendingTransactions(db, lastMonth),
      yearTransactions: TransactionService.getYearSpendingTransactions(db, currentYear),
    };
  }, [db, currentMonth, lastMonth, currentYear]);

  if (!data) {
    return <SpendingOverviewSkeleton />;
  }

  return (
    <SpendingOverviewClient
      currentMonth={currentMonth}
      lastMonth={lastMonth}
      currentYear={currentYear}
      currentTotal={data.currentTotal}
      lastTotal={data.lastTotal}
      yearTotal={data.yearTotal}
      currentCategorySpending={data.currentCategorySpending}
      lastCategorySpending={data.lastCategorySpending}
      yearCategorySpending={data.yearCategorySpending}
      currentDailyData={data.currentDailyData}
      lastDailyData={data.lastDailyData}
      yearMonthlyData={data.yearMonthlyData}
      currentTransactions={data.currentTransactions}
      lastTransactions={data.lastTransactions}
      yearTransactions={data.yearTransactions}
    />
  );
}

function SpendingOverviewSkeleton() {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <div className="h-6 w-48 bg-muted rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="h-12 w-64 bg-muted rounded animate-pulse" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="h-6 w-48 bg-muted rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-muted rounded animate-pulse" />
        </CardContent>
      </Card>

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
