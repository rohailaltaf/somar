"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Nav } from "@/components/nav";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { IncomeOverviewClient } from "./income-overview-client";
import * as TransactionService from "@somar/shared/services";
import { getCurrentMonth, getPreviousMonth } from "@somar/shared";

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
          <IncomeOverviewContent />
        </div>
      </main>
    </div>
  );
}

function IncomeOverviewContent() {
  const currentMonth = useMemo(() => getCurrentMonth(), []);
  const lastMonth = useMemo(() => getPreviousMonth(currentMonth), [currentMonth]);
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  // Fetch all income data using React Query
  const { data: currentTotal = 0 } = useQuery({
    queryKey: ["income", "total", currentMonth],
    queryFn: () => TransactionService.getTotalIncome(currentMonth),
  });

  const { data: lastTotal = 0 } = useQuery({
    queryKey: ["income", "total", lastMonth],
    queryFn: () => TransactionService.getTotalIncome(lastMonth),
  });

  const { data: yearTotal = 0 } = useQuery({
    queryKey: ["income", "yearTotal", currentYear],
    queryFn: () => TransactionService.getYearToDateIncome(currentYear),
  });

  const { data: currentCategoryIncome = [] } = useQuery({
    queryKey: ["income", "byCategory", currentMonth],
    queryFn: () => TransactionService.getIncomeByCategory(currentMonth),
  });

  const { data: lastCategoryIncome = [] } = useQuery({
    queryKey: ["income", "byCategory", lastMonth],
    queryFn: () => TransactionService.getIncomeByCategory(lastMonth),
  });

  const { data: yearCategoryIncome = [] } = useQuery({
    queryKey: ["income", "yearByCategory", currentYear],
    queryFn: () => TransactionService.getYearToDateCategoryIncome(currentYear),
  });

  const { data: yearMonthlyData = [], isLoading } = useQuery({
    queryKey: ["income", "monthly", currentYear],
    queryFn: () => TransactionService.getMonthlyIncome(currentYear),
  });

  if (isLoading) {
    return <IncomeOverviewSkeleton />;
  }

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
