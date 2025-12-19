"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";

interface IncomeOverviewClientProps {
  currentMonth: string;
  lastMonth: string;
  currentYear: number;
  currentTotal: number;
  lastTotal: number;
  yearTotal: number;
  currentCategoryIncome: Array<{
    id: string;
    name: string;
    color: string;
    income: number;
  }>;
  lastCategoryIncome: Array<{
    id: string;
    name: string;
    color: string;
    income: number;
  }>;
  yearCategoryIncome: Array<{
    id: string;
    name: string;
    color: string;
    income: number;
  }>;
  yearMonthlyData: Array<{
    month: number;
    monthStr: string;
    amount: number;
  }>;
}

export function IncomeOverviewClient({
  currentMonth,
  lastMonth,
  currentYear,
  currentTotal,
  lastTotal,
  yearTotal,
  currentCategoryIncome,
  lastCategoryIncome,
  yearCategoryIncome,
  yearMonthlyData,
}: IncomeOverviewClientProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<"current" | "last" | "year">("current");
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatYAxis = (value: number) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}k`;
    }
    return `$${value}`;
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split("-");
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  const getMonthName = (monthNum: number) => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return monthNames[monthNum - 1];
  };

  // Determine which data to display based on selected period
  const displayMonth = selectedPeriod === "current" ? currentMonth : selectedPeriod === "last" ? lastMonth : `${currentYear}`;
  const displayTotal = selectedPeriod === "current" ? currentTotal : selectedPeriod === "last" ? lastTotal : yearTotal;
  const displayCategoryIncome = selectedPeriod === "current" ? currentCategoryIncome : selectedPeriod === "last" ? lastCategoryIncome : yearCategoryIncome;
  
  const displayLabel = selectedPeriod === "year" ? `${currentYear}` : formatMonth(displayMonth);

  const incomeChange = currentTotal - lastTotal;

  const renderChangeIndicator = () => {
    if (incomeChange === 0) {
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Minus className="w-5 h-5" />
          <span className="text-lg">No change from last month</span>
        </div>
      );
    }

    const isIncrease = incomeChange > 0;
    return (
      <div
        className={`flex items-center gap-2 ${
          isIncrease ? "text-green-600" : "text-red-600"
        }`}
      >
        {isIncrease ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
        <span className="text-lg font-medium">
          {isIncrease ? "+" : ""}
          {formatCurrency(incomeChange)} vs last month
        </span>
      </div>
    );
  };

  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-4">
          <p className="font-semibold text-sm mb-3 text-gray-900 dark:text-gray-100">
            {getMonthName(label)}
          </p>
          <div className="space-y-2">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.fill }}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Income
                  </span>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {formatCurrency(entry.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Total Income with Period Selector */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Total Income</CardTitle>
            <CardDescription className="mt-1.5">{displayLabel}</CardDescription>
          </div>
          <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">This Month</SelectItem>
              <SelectItem value="last">Last Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-green-600">{formatCurrency(displayTotal)}</div>
          {selectedPeriod === "current" && (
            <div className="mt-4">
              {renderChangeIndicator()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Bar Chart (only for "This Year") */}
      {selectedPeriod === "year" && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Income</CardTitle>
            <CardDescription>Income by month for {currentYear}</CardDescription>
          </CardHeader>
          <CardContent>
            {yearMonthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart 
                  data={yearMonthlyData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                  <XAxis
                    dataKey="month"
                    stroke="#64748b"
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickFormatter={getMonthName}
                  />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    tickFormatter={formatYAxis}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="amount" 
                    fill="#10b981"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-96 flex items-center justify-center text-muted-foreground">
                No income data available
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Income by Category */}
      <Card>
        <CardHeader>
          <CardTitle>Income by Category</CardTitle>
          <CardDescription>Breakdown for {displayLabel}</CardDescription>
        </CardHeader>
        <CardContent>
          {displayCategoryIncome.length > 0 ? (
            <div className="space-y-4">
              {displayCategoryIncome
                .sort((a, b) => b.income - a.income)
                .map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="font-medium capitalize">{category.name}</span>
                    </div>
                    <div className="text-lg font-bold text-green-600">
                      {formatCurrency(category.income)}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No income data for this period yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}






