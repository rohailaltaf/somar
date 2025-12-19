"use client";

import { useState, useMemo, useEffect } from "react";
import { Account, Category } from "@prisma/client";
import { TransactionsList } from "./transactions-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { X, Search } from "lucide-react";

// Type for transaction with relations
interface TransactionWithRelations {
  id: string;
  accountId: string;
  categoryId: string | null;
  description: string;
  amount: number;
  date: string;
  excluded: boolean;
  isConfirmed: boolean;
  createdAt: string;
  plaidTransactionId: string | null;
  category: {
    id: string;
    name: string;
    type: string;
    color: string;
    createdAt: string;
  } | null;
  account: {
    id: string;
    name: string;
    type: string;
    createdAt: string;
    plaidItemId: string | null;
    plaidAccountId: string | null;
  };
}

interface TransactionsClientProps {
  accounts: Account[];
  categories: Category[];
}

export function TransactionsClient({
  accounts,
  categories,
}: TransactionsClientProps) {
  const [transactions, setTransactions] = useState<TransactionWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [accountFilter, setAccountFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [showExcluded, setShowExcluded] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Load transactions from server with pagination and filters
  useEffect(() => {
    const loadTransactions = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: itemsPerPage.toString(),
        });
        
        if (accountFilter !== "all") params.set("accountId", accountFilter);
        if (categoryFilter !== "all") params.set("categoryId", categoryFilter);
        if (startDate) params.set("startDate", startDate);
        if (endDate) params.set("endDate", endDate);
        if (showExcluded) params.set("showExcluded", "true");
        if (searchQuery.trim()) params.set("search", searchQuery.trim());
        
        const response = await fetch(`/api/transactions?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        setTransactions(data.transactions);
        setTotalCount(data.pagination.totalCount);
        setTotalPages(data.pagination.totalPages);
      } catch (error) {
        console.error("Failed to load transactions:", error);
        setTransactions([]);
        setTotalCount(0);
        setTotalPages(0);
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, [currentPage, accountFilter, categoryFilter, startDate, endDate, showExcluded, searchQuery]);

  const clearFilters = () => {
    setAccountFilter("all");
    setCategoryFilter("all");
    setStartDate("");
    setEndDate("");
    setSearchQuery("");
    setCurrentPage(1);
  };

  const hasFilters = accountFilter !== "all" || categoryFilter !== "all" || startDate || endDate || searchQuery.trim();

  // Calculate display range
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalCount);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountFilter, categoryFilter, startDate, endDate, showExcluded, searchQuery]);

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="mb-4">
            <Label htmlFor="search">Search</Label>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="search"
                type="text"
                placeholder="Search transaction descriptions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-2">
              <Label>Account</Label>
              <Select value={accountFilter} onValueChange={setAccountFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All accounts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All accounts</SelectItem>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="capitalize">{category.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="flex items-end">
              {hasFilters && (
                <Button variant="outline" onClick={clearFilters} className="w-full">
                  <X className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
          <div className="mt-4 flex items-center space-x-2">
            <Checkbox
              id="show-excluded"
              checked={showExcluded}
              onCheckedChange={(checked) => setShowExcluded(checked === true)}
            />
            <Label
              htmlFor="show-excluded"
              className="text-sm font-normal cursor-pointer"
            >
              Show excluded transactions
            </Label>
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            {loading ? (
              "Loading transactions..."
            ) : totalCount === 0 ? (
              "No transactions found"
            ) : (
              <>
                Showing {startIndex + 1}-{endIndex} of {totalCount} transactions
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="mt-6">
        {loading ? (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-12 w-full bg-muted animate-pulse rounded" />
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <TransactionsList
              transactions={transactions}
              categories={categories}
            />
            {totalPages > 1 && (
              <Card className="mt-4">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        size="sm"
                      >
                        First
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        size="sm"
                      >
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              onClick={() => setCurrentPage(pageNum)}
                              size="sm"
                              className="w-10"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        size="sm"
                      >
                        Next
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        size="sm"
                      >
                        Last
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </>
  );
}

