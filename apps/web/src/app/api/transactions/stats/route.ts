import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { parseDate, toDateString } from "@somar/shared/utils";

/**
 * GET /api/transactions/stats
 * Get spending statistics.
 * Query params:
 * - startDate: Start date in YYYY-MM-DD format (required)
 * - endDate: End date in YYYY-MM-DD format (required)
 * - stat: Type of stat (total, byCategory, cumulative, income) - default: all
 */
export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  try {
    const url = new URL(request.url);
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const stat = url.searchParams.get("stat");

    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "startDate and endDate parameters are required (YYYY-MM-DD)" } },
        { status: 400 }
      );
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_FORMAT", message: "Dates must be in YYYY-MM-DD format" } },
        { status: 400 }
      );
    }

    const baseWhere = {
      userId: session.user.id,
      date: { gte: startDate, lte: endDate },
      excluded: false,
      amount: { lt: 0 }, // Only expenses (negative amounts)
    };

    const result: Record<string, unknown> = {};

    // Total spending
    if (!stat || stat === "total") {
      const totalResult = await db.transaction.aggregate({
        where: baseWhere,
        _sum: { amount: true },
      });
      result.total = Math.abs(totalResult._sum.amount || 0);
    }

    // Spending by category
    if (!stat || stat === "byCategory") {
      const transactions = await db.transaction.findMany({
        where: baseWhere,
        include: { category: true },
      });

      const byCategory: Record<string, { amount: number; name: string; color: string }> = {};
      for (const txn of transactions) {
        const categoryId = txn.categoryId || "uncategorized";
        const categoryName = txn.category?.name || "Uncategorized";
        const categoryColor = txn.category?.color || "#94a3b8";

        if (!byCategory[categoryId]) {
          byCategory[categoryId] = { amount: 0, name: categoryName, color: categoryColor };
        }
        byCategory[categoryId].amount += Math.abs(txn.amount);
      }

      result.byCategory = Object.entries(byCategory)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.amount - a.amount);
    }

    // Daily cumulative spending (for charts)
    if (!stat || stat === "cumulative") {
      const transactions = await db.transaction.findMany({
        where: baseWhere,
        orderBy: { date: "asc" },
        select: { date: true, amount: true },
      });

      const dailyTotals: Record<string, number> = {};
      for (const txn of transactions) {
        dailyTotals[txn.date] = (dailyTotals[txn.date] || 0) + Math.abs(txn.amount);
      }

      // Build cumulative data for each day in range
      let cumulative = 0;
      const cumulativeData: Array<{ date: string; daily: number; cumulative: number }> = [];

      const start = parseDate(startDate);
      const end = parseDate(endDate);
      for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = toDateString(d);
        const daily = dailyTotals[dateStr] || 0;
        cumulative += daily;
        cumulativeData.push({ date: dateStr, daily, cumulative });
      }

      result.cumulative = cumulativeData;
    }

    // Income for the month
    if (!stat || stat === "income") {
      const incomeResult = await db.transaction.aggregate({
        where: {
          userId: session.user.id,
          date: { gte: startDate, lte: endDate },
          excluded: false,
          amount: { gt: 0 }, // Only income (positive amounts)
        },
        _sum: { amount: true },
      });
      result.income = incomeResult._sum.amount || 0;
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("[Transactions] Error fetching stats:", error);
    return NextResponse.json(
      { success: false, error: { code: "FETCH_FAILED", message: "Failed to fetch stats" } },
      { status: 500 }
    );
  }
}
