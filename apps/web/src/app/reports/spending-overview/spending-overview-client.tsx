"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BudgetProgress } from "@/components/budget-progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown, ChevronUp } from "lucide-react";
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { formatMonth, formatCurrency, formatDate } from "@somar/shared";

interface SpendingTransaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  categoryName: string | null;
  categoryColor: string | null;
  accountName: string | null;
}

interface SpendingOverviewClientProps {
  currentMonth: string;
  lastMonth: string;
  currentYear: number;
  currentTotal: number;
  lastTotal: number;
  yearTotal: number;
  currentCategorySpending: Array<{
    id: string;
    name: string;
    color: string;
    spent: number;
    budget: number | null;
  }>;
  lastCategorySpending: Array<{
    id: string;
    name: string;
    color: string;
    spent: number;
    budget: number | null;
  }>;
  yearCategorySpending: Array<{
    id: string;
    name: string;
    color: string;
    spent: number;
    budget: number | null;
  }>;
  currentDailyData: Array<{
    day: number;
    date: string;
    cumulative: number;
  }>;
  lastDailyData: Array<{
    day: number;
    date: string;
    cumulative: number;
  }>;
  yearMonthlyData: Array<{
    month: number;
    monthStr: string;
    cumulative: number;
  }>;
  currentTransactions: SpendingTransaction[];
  lastTransactions: SpendingTransaction[];
  yearTransactions: SpendingTransaction[];
}

// Utility functions defined at module level (not recreated on render)
const formatYAxis = (value: number) => {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}k`;
  }
  return `$${value}`;
};

// Custom tooltip component for the area chart
interface SpendingTooltipProps {
  active?: boolean;
  payload?: Array<{
    value?: number;
    color?: string;
    name?: string;
  }>;
  label?: number | string;
}

function SpendingTooltip({ active, payload, label }: SpendingTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-4">
      <p className="font-semibold text-sm mb-3 text-gray-900 dark:text-gray-100">
        Day {label}
      </p>
      <div className="space-y-2">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color || "#8b5cf6" }}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {entry.name || "Spending"}
              </span>
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {typeof entry.value === "number" ? formatCurrency(entry.value) : "$0"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ChartDataPoint {
  day?: number;
  month?: number;
  thisMonth?: number;
  lastMonth?: number;
}

export function SpendingOverviewClient({
  currentMonth,
  lastMonth,
  currentYear,
  currentTotal,
  lastTotal,
  yearTotal,
  currentCategorySpending,
  lastCategorySpending,
  yearCategorySpending,
  currentDailyData,
  lastDailyData,
  yearMonthlyData,
  currentTransactions,
  lastTransactions,
  yearTransactions,
}: SpendingOverviewClientProps) {
  const [selectedMonth, setSelectedMonth] = useState<"current" | "last" | "year">("current");
  const [isExpanded, setIsExpanded] = useState(false);

  // Determine which data to display based on selected period
  const displayMonth = selectedMonth === "current" ? currentMonth : selectedMonth === "last" ? lastMonth : `${currentYear}`;
  const displayTotal = selectedMonth === "current" ? currentTotal : selectedMonth === "last" ? lastTotal : yearTotal;
  const displayCategorySpending = selectedMonth === "current" ? currentCategorySpending : selectedMonth === "last" ? lastCategorySpending : yearCategorySpending;
  const displayTransactions = selectedMonth === "current" ? currentTransactions : selectedMonth === "last" ? lastTransactions : yearTransactions;
  
  const displayLabel = selectedMonth === "year" ? `${currentYear}` : formatMonth(displayMonth);

  // Prepare data for burn-up chart based on selected period
  const now = new Date();
  const [currentYearNum, currentMonthNum] = currentMonth.split("-").map(Number);
  const isCurrentMonth = now.getFullYear() === currentYearNum && (now.getMonth() + 1) === currentMonthNum;
  const currentDay = isCurrentMonth ? now.getDate() : currentDailyData.length;
  
  // Determine which data to show in chart based on selection
  const chartData: ChartDataPoint[] = [];
  const xAxisKey = selectedMonth === "year" ? "month" : "day";
  
  if (selectedMonth === "current") {
    // Show this month vs last month (daily)
    const maxDays = Math.max(lastDailyData.length, currentDay);
    
    for (let day = 1; day <= maxDays; day++) {
      const dataPoint: ChartDataPoint = { day };
      
      // Add this month's data only up to current day
      if (day <= currentDay && currentDailyData[day - 1]) {
        dataPoint.thisMonth = currentDailyData[day - 1].cumulative;
      }
      
      // Add last month's data for all its days
      if (lastDailyData[day - 1]) {
        dataPoint.lastMonth = lastDailyData[day - 1].cumulative;
      }
      
      chartData.push(dataPoint);
    }
  } else if (selectedMonth === "last") {
    // Show last month only (all days)
    for (let day = 1; day <= lastDailyData.length; day++) {
      const dataPoint: ChartDataPoint = { day };
      
      if (lastDailyData[day - 1]) {
        dataPoint.thisMonth = lastDailyData[day - 1].cumulative;
      }
      
      chartData.push(dataPoint);
    }
  } else {
    // Show year (monthly cumulative)
    yearMonthlyData.forEach((monthData) => {
      chartData.push({
        month: monthData.month,
        thisMonth: monthData.cumulative,
      });
    });
  }

  return (
    <div className="space-y-8">
      {/* Total Spending with Period Selector */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Total Spending</CardTitle>
            <CardDescription className="mt-1.5">{displayLabel}</CardDescription>
          </div>
          <Select value={selectedMonth} onValueChange={(value: "current" | "last" | "year") => {
            setSelectedMonth(value);
            setIsExpanded(false);
          }}>
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
        <CardContent className="space-y-4">
          <div className="text-4xl font-bold">{formatCurrency(displayTotal)}</div>
          
          {/* Expandable Transactions List */}
          {displayTransactions.length > 0 && (
            <div className="pt-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full justify-between py-2 border-t"
              >
                <span>{displayTransactions.length} transaction{displayTransactions.length !== 1 ? 's' : ''}</span>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              
              {isExpanded && (
                <div className="mt-2 max-h-80 overflow-y-auto space-y-1">
                  {displayTransactions.map((txn) => (
                    <div
                      key={txn.id}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {txn.categoryColor && (
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: txn.categoryColor }}
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{txn.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(txn.date, { showYear: selectedMonth === "year" ? "always" : "never" })}
                            {txn.categoryName && ` · ${txn.categoryName}`}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-destructive flex-shrink-0 ml-3">
                        -{formatCurrency(Math.abs(txn.amount))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Spending vs Budget */}
      <Card>
        <CardHeader>
          <CardTitle>Spending by Category</CardTitle>
          <CardDescription>Category budgets for {displayLabel}</CardDescription>
        </CardHeader>
        <CardContent>
          {displayCategorySpending.length > 0 ? (
            <div className="space-y-6">
              {displayCategorySpending
                .filter((cat) => cat.spent > 0 || cat.budget)
                .sort((a, b) => b.spent - a.spent)
                .map((category) => (
                  <BudgetProgress
                    key={category.id}
                    category={category}
                    spent={category.spent}
                    budget={category.budget}
                  />
                ))}
              {displayCategorySpending.filter((cat) => cat.spent > 0 || cat.budget).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No spending data for this month yet.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No categories found.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Burn-up Chart */}
      <Card>
        <CardHeader>
          <CardTitle>{selectedMonth === "year" ? "Monthly" : "Daily"} Spending Trend</CardTitle>
          <CardDescription>
            {selectedMonth === "current"
              ? `Cumulative spending comparison: ${formatMonth(currentMonth)} vs ${formatMonth(lastMonth)}`
              : selectedMonth === "last"
              ? `Cumulative daily spending for ${formatMonth(lastMonth)}`
              : `Year-to-date cumulative spending for ${currentYear}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart 
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorThisMonth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorLastMonth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis
                  dataKey={xAxisKey}
                  stroke="#64748b"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  label={selectedMonth === "year" ? { value: "Month", position: "insideBottom", offset: -5 } : undefined}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickFormatter={formatYAxis}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <Tooltip content={<SpendingTooltip />} />
                {selectedMonth === "current" && (
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="line"
                  />
                )}
                {selectedMonth === "current" && (
                  <Area
                    type="monotone"
                    dataKey="lastMonth"
                    name="Last Month"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    fill="url(#colorLastMonth)"
                    strokeDasharray="5 5"
                    dot={false}
                    activeDot={{ r: 5, fill: '#94a3b8' }}
                  />
                )}
                <Area
                  type="monotone"
                  dataKey="thisMonth"
                  name={selectedMonth === "current" ? "This Month" : selectedMonth === "last" ? formatMonth(lastMonth) : `${currentYear}`}
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  fill="url(#colorThisMonth)"
                  dot={false}
                  activeDot={{ r: 6, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-96 flex items-center justify-center text-muted-foreground">
              No spending data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
