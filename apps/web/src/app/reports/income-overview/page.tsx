"use client";

import { useMemo } from "react";
import { Nav } from "@/components/nav";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useDatabase } from "@/hooks/use-database";
import { IncomeOverviewClient } from "./income-overview-client";
import * as TransactionService from "@/services/transactions";
import { getCurrentMonth, getPreviousMonth } from "@/lib/utils";

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
  const { db } = useDatabase();
  
  const currentMonth = useMemo(() => getCurrentMonth(), []);
  const lastMonth = useMemo(() => getPreviousMonth(currentMonth), [currentMonth]);
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  const data = useMemo(() => {
    if (!db) return null;

    return {
      currentTotal: TransactionService.getTotalIncome(db, currentMonth),
      lastTotal: TransactionService.getTotalIncome(db, lastMonth),
      currentCategoryIncome: TransactionService.getIncomeByCategory(db, currentMonth),
      lastCategoryIncome: TransactionService.getIncomeByCategory(db, lastMonth),
      yearTotal: TransactionService.getYearToDateIncome(db, currentYear),
      yearCategoryIncome: TransactionService.getYearToDateCategoryIncome(db, currentYear),
      yearMonthlyData: TransactionService.getMonthlyIncome(db, currentYear),
    };
  }, [db, currentMonth, lastMonth, currentYear]);

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
