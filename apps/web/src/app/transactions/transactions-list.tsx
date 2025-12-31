"use client";

import { useState, useMemo, memo } from "react";
import { useTransactionMutations } from "@/hooks";
import type { Category, TransactionWithRelations } from "@somar/shared";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Receipt,
  MoreVertical,
  EyeOff,
  Eye,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { cn, formatCurrency } from "@/lib/utils";

interface TransactionsListProps {
  transactions: TransactionWithRelations[];
  categories: Category[];
}

// Memoized category select options to avoid re-rendering on every transaction
const CategoryOptions = memo(({ categories }: { categories: Category[] }) => (
  <>
    <SelectItem value="uncategorized">
      <span className="text-muted-foreground">Uncategorized</span>
    </SelectItem>
    {categories.map((category) => (
      <SelectItem key={category.id} value={category.id}>
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: category.color }}
          />
          <span className="capitalize">{category.name}</span>
        </div>
      </SelectItem>
    ))}
  </>
));
CategoryOptions.displayName = "CategoryOptions";

export function TransactionsList({
  transactions,
  categories,
}: TransactionsListProps) {
  const { confirmTransaction, toggleExcluded, deleteTransaction } = useTransactionMutations();

  const [editingCategory, setEditingCategory] = useState<{
    transaction: TransactionWithRelations;
    categoryId: string;
  } | null>(null);
  const [deletingTransaction, setDeletingTransaction] =
    useState<TransactionWithRelations | null>(null);

  // Memoize categories to prevent re-renders
  const memoizedCategories = useMemo(() => categories, [categories]);

  const handleToggleExcluded = (transaction: TransactionWithRelations) => {
    toggleExcluded.mutate(transaction.id, {
      onSuccess: () => {
        toast.success(
          transaction.excluded ? "Transaction included" : "Transaction excluded"
        );
      },
    });
  };

  const handleCategoryChange = (
    transaction: TransactionWithRelations,
    categoryId: string
  ) => {
    setEditingCategory({ transaction, categoryId });
  };

  const handleSaveCategory = () => {
    if (!editingCategory) return;

    confirmTransaction.mutate(
      {
        transactionId: editingCategory.transaction.id,
        categoryId: editingCategory.categoryId,
      },
      {
        onSuccess: () => {
          setEditingCategory(null);
          toast.success("Category updated");
        },
      }
    );
  };

  const handleDelete = () => {
    if (!deletingTransaction) return;

    deleteTransaction.mutate(deletingTransaction.id, {
      onSuccess: () => {
        setDeletingTransaction(null);
        toast.success("Transaction deleted");
      },
    });
  };

  const formatDate = (dateStr: string) => {
    // Parse YYYY-MM-DD without timezone conversion
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Receipt className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No transactions found</h3>
          <p className="text-muted-foreground mt-1">
            Upload a CSV file to import transactions
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Account</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow
                key={transaction.id}
                className={cn(transaction.excluded && "opacity-50")}
              >
                <TableCell className="font-medium">
                  {formatDate(transaction.date)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className={cn(transaction.excluded && "line-through")}>
                      {transaction.description}
                    </span>
                    {!transaction.isConfirmed && (
                      <Badge variant="outline" className="text-xs">
                        Unconfirmed
                      </Badge>
                    )}
                    {transaction.excluded && (
                      <Badge variant="secondary" className="text-xs">
                        <EyeOff className="w-3 h-3 mr-1" />
                        Excluded
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Select
                    value={transaction.categoryId || "uncategorized"}
                    onValueChange={(v) =>
                      handleCategoryChange(
                        transaction,
                        v === "uncategorized" ? "" : v
                      )
                    }
                  >
                    <SelectTrigger className="w-[150px] h-8">
                      <SelectValue>
                        {transaction.category ? (
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{
                                backgroundColor: transaction.category.color,
                              }}
                            />
                            <span className="capitalize">
                              {transaction.category.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">
                            Uncategorized
                          </span>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <CategoryOptions categories={memoizedCategories} />
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{transaction.account.name}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <span
                    className={cn(
                      "font-medium",
                      transaction.amount < 0 ? "text-red-600" : "text-emerald-600"
                    )}
                  >
                    {transaction.amount < 0 ? "-" : "+"}
                    {formatCurrency(Math.abs(transaction.amount), true)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleToggleExcluded(transaction)}
                      title={transaction.excluded ? "Include in reports" : "Exclude from reports"}
                    >
                      {transaction.excluded ? (
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-muted-foreground" />
                      )}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => setDeletingTransaction(transaction)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Category Change Confirmation Dialog */}
      <Dialog
        open={!!editingCategory}
        onOpenChange={() => setEditingCategory(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Category</DialogTitle>
            <DialogDescription>
              Change the category for this transaction?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCategory(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCategory} disabled={confirmTransaction.isPending}>
              {confirmTransaction.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingTransaction}
        onOpenChange={() => setDeletingTransaction(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Transaction</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this transaction? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingTransaction(null)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteTransaction.isPending}>
              {deleteTransaction.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
