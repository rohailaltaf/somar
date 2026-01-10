"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Nav } from "@/components/nav";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SpendingOverviewClient } from "./spending-overview-client";
import * as TransactionService from "@somar/shared/services";
import { getCurrentMonth, getPreviousMonth, getMonthDateRange } from "@somar/shared";

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
  const currentMonth = useMemo(() => getCurrentMonth(), []);
  const lastMonth = useMemo(() => getPreviousMonth(currentMonth), [currentMonth]);
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  const currentRange = useMemo(() => getMonthDateRange(currentMonth), [currentMonth]);
  const lastRange = useMemo(() => getMonthDateRange(lastMonth), [lastMonth]);

  // Fetch all spending data using React Query
  const { data: currentTotal = 0 } = useQuery({
    queryKey: ["spending", "total", currentRange.startDate, currentRange.endDate],
    queryFn: () => TransactionService.getTotalSpending(currentRange.startDate, currentRange.endDate),
  });

  const { data: lastTotal = 0 } = useQuery({
    queryKey: ["spending", "total", lastRange.startDate, lastRange.endDate],
    queryFn: () => TransactionService.getTotalSpending(lastRange.startDate, lastRange.endDate),
  });

  const { data: yearTotal = 0 } = useQuery({
    queryKey: ["spending", "yearTotal", currentYear],
    queryFn: () => TransactionService.getYearToDateSpending(currentYear),
  });

  const { data: currentCategorySpending = [] } = useQuery({
    queryKey: ["spending", "byCategory", currentRange.startDate, currentRange.endDate],
    queryFn: () => TransactionService.getSpendingByCategory(currentRange.startDate, currentRange.endDate),
  });

  const { data: lastCategorySpending = [] } = useQuery({
    queryKey: ["spending", "byCategory", lastRange.startDate, lastRange.endDate],
    queryFn: () => TransactionService.getSpendingByCategory(lastRange.startDate, lastRange.endDate),
  });

  const { data: yearCategorySpending = [] } = useQuery({
    queryKey: ["spending", "yearByCategory", currentYear],
    queryFn: () => TransactionService.getYearToDateCategorySpending(currentYear),
  });

  const { data: currentDailyData = [] } = useQuery({
    queryKey: ["spending", "cumulative", currentRange.startDate, currentRange.endDate],
    queryFn: () => TransactionService.getDailyCumulativeSpending(currentRange.startDate, currentRange.endDate),
  });

  const { data: lastDailyData = [] } = useQuery({
    queryKey: ["spending", "cumulative", lastRange.startDate, lastRange.endDate],
    queryFn: () => TransactionService.getDailyCumulativeSpending(lastRange.startDate, lastRange.endDate),
  });

  const { data: yearMonthlyData = [] } = useQuery({
    queryKey: ["spending", "monthlyCumulative", currentYear],
    queryFn: () => TransactionService.getMonthlyCumulativeSpending(currentYear),
  });

  const { data: currentTransactions = [] } = useQuery({
    queryKey: ["spending", "transactions", currentRange.startDate, currentRange.endDate],
    queryFn: () => TransactionService.getSpendingTransactions(currentRange.startDate, currentRange.endDate),
  });

  const { data: lastTransactions = [] } = useQuery({
    queryKey: ["spending", "transactions", lastRange.startDate, lastRange.endDate],
    queryFn: () => TransactionService.getSpendingTransactions(lastRange.startDate, lastRange.endDate),
  });

  const { data: yearTransactions = [], isLoading } = useQuery({
    queryKey: ["spending", "yearTransactions", currentYear],
    queryFn: () => TransactionService.getYearSpendingTransactions(currentYear),
  });

  if (isLoading) {
    return <SpendingOverviewSkeleton />;
  }

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
