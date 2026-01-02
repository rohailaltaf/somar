"use client";

import { useMemo } from "react";
import { Nav } from "@/components/nav";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useDatabaseAdapter } from "@somar/shared/hooks";
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
  const { adapter } = useDatabaseAdapter();

  const currentMonth = useMemo(() => getCurrentMonth(), []);
  const lastMonth = useMemo(() => getPreviousMonth(currentMonth), [currentMonth]);
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  const data = useMemo(() => {
    if (!adapter) return null;

    return {
      currentTotal: TransactionService.getTotalIncome(adapter, currentMonth),
      lastTotal: TransactionService.getTotalIncome(adapter, lastMonth),
      currentCategoryIncome: TransactionService.getIncomeByCategory(adapter, currentMonth),
      lastCategoryIncome: TransactionService.getIncomeByCategory(adapter, lastMonth),
      yearTotal: TransactionService.getYearToDateIncome(adapter, currentYear),
      yearCategoryIncome: TransactionService.getYearToDateCategoryIncome(adapter, currentYear),
      yearMonthlyData: TransactionService.getMonthlyIncome(adapter, currentYear),
    };
  }, [adapter, currentMonth, lastMonth, currentYear]);

  if (!data) {
    return <IncomeOverviewSkeleton />;
  }

  return (
    <IncomeOverviewClient
      currentMonth={currentMonth}
      lastMonth={lastMonth}
      currentYear={currentYear}
      currentTotal={data.currentTotal}
      lastTotal={data.lastTotal}
      yearTotal={data.yearTotal}
      currentCategoryIncome={data.currentCategoryIncome}
      lastCategoryIncome={data.lastCategoryIncome}
      yearCategoryIncome={data.yearCategoryIncome}
      yearMonthlyData={data.yearMonthlyData}
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
