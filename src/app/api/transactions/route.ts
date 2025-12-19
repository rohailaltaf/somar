import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  // Pagination params
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = (page - 1) * limit;
  
  // Filter params
  const accountId = searchParams.get("accountId") || undefined;
  const categoryId = searchParams.get("categoryId") || undefined;
  const startDate = searchParams.get("startDate") || undefined;
  const endDate = searchParams.get("endDate") || undefined;
  const showExcluded = searchParams.get("showExcluded") === "true";
  const search = searchParams.get("search") || undefined;
  
  // Build WHERE conditions
  const where: Prisma.TransactionWhereInput = {};
  
  if (accountId && accountId !== "all") {
    where.accountId = accountId;
  }
  if (categoryId && categoryId !== "all") {
    where.categoryId = categoryId;
  }
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = startDate;
    if (endDate) where.date.lte = endDate;
  }
  if (!showExcluded) {
    where.excluded = false;
  }
  if (search) {
    where.description = {
      contains: search,
    };
  }

  // Get total count for pagination
  const totalCount = await db.transaction.count({ where });

  // Get paginated results with joins
  const results = await db.transaction.findMany({
    where,
    include: {
      category: true,
      account: true,
    },
    orderBy: [
      { date: "desc" },
      { createdAt: "desc" },
    ],
    skip: offset,
    take: limit,
  });

  return Response.json({
    transactions: results,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  });
}

