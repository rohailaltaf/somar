"use client";

import { useState, useMemo, useCallback } from "react";
import { useTransactions } from "@/hooks";
import { TransactionsList } from "./transactions-list";
import type { Account, Category } from "@somar/shared";
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

interface TransactionsClientProps {
  accounts: Account[];
  categories: Category[];
}

export function TransactionsClient({
  accounts,
  categories,
}: TransactionsClientProps) {
  const [accountFilter, setAccountFilterState] = useState<string>("all");
  const [categoryFilter, setCategoryFilterState] = useState<string>("all");
  const [startDate, setStartDateState] = useState<string>("");
  const [endDate, setEndDateState] = useState<string>("");
  const [showExcluded, setShowExcludedState] = useState<boolean>(false);
  const [searchQuery, setSearchQueryState] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Wrapper setters that also reset page to 1
  const setAccountFilter = useCallback((value: string) => {
    setAccountFilterState(value);
    setCurrentPage(1);
  }, []);
  const setCategoryFilter = useCallback((value: string) => {
    setCategoryFilterState(value);
    setCurrentPage(1);
  }, []);
  const setStartDate = useCallback((value: string) => {
    setStartDateState(value);
    setCurrentPage(1);
  }, []);
  const setEndDate = useCallback((value: string) => {
    setEndDateState(value);
    setCurrentPage(1);
  }, []);
  const setShowExcluded = useCallback((value: boolean) => {
    setShowExcludedState(value);
    setCurrentPage(1);
  }, []);
  const setSearchQuery = useCallback((value: string) => {
    setSearchQueryState(value);
    setCurrentPage(1);
  }, []);

  // Build filter options for the hook
  const filterOptions = useMemo(() => ({
    accountId: accountFilter !== "all" ? accountFilter : undefined,
    categoryId: categoryFilter === "uncategorized" ? null : categoryFilter !== "all" ? categoryFilter : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    showExcluded,
    search: searchQuery.trim() || undefined,
  }), [accountFilter, categoryFilter, startDate, endDate, showExcluded, searchQuery]);

  const { data: transactions = [], isLoading } = useTransactions(filterOptions);

  // Paginate client-side
  const totalCount = transactions.length;
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalCount);
  const paginatedTransactions = transactions.slice(startIndex, endIndex);

  const clearFilters = () => {
    setAccountFilter("all");
    setCategoryFilter("all");
    setStartDate("");
    setEndDate("");
    setSearchQuery("");
    setCurrentPage(1);
  };

  const hasFilters = accountFilter !== "all" || categoryFilter !== "all" || startDate || endDate || searchQuery.trim();

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
                  <SelectItem value="uncategorized">Uncategorized</SelectItem>
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
            {isLoading ? (
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
        {isLoading ? (
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
              transactions={paginatedTransactions}
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
