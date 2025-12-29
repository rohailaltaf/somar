"use client";

import { useState } from "react";
import { useCategoryMutations } from "@/hooks";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tags, MoreVertical, Pencil, Trash2, DollarSign, Calendar, History, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { CategoryType } from "@somar/shared";
import { formatCurrency } from "@/lib/utils";

interface CategoryBudget {
  id: string;
  amount: number;
  startMonth: string;
}

interface CategoryWithBudget {
  id: string;
  name: string;
  type: string;
  color: string;
  createdAt: string;
  currentBudget: CategoryBudget | null;
  allBudgets: CategoryBudget[];
}

interface CategoriesListProps {
  categories: CategoryWithBudget[];
}

export function CategoriesList({ categories }: CategoriesListProps) {
  const { updateCategory, deleteCategory, setBudget, deleteBudget } = useCategoryMutations();

  const [editingCategory, setEditingCategory] = useState<CategoryWithBudget | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<CategoryWithBudget | null>(null);
  const [budgetCategory, setBudgetCategory] = useState<CategoryWithBudget | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState<CategoryType>("spending");
  const [editColor, setEditColor] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [budgetMonth, setBudgetMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const handleEdit = (category: CategoryWithBudget) => {
    setEditingCategory(category);
    setEditName(category.name);
    setEditType(category.type as CategoryType);
    setEditColor(category.color);
  };

  const handleSaveEdit = () => {
    if (!editingCategory || !editName.trim()) return;

    updateCategory.mutate(
      { id: editingCategory.id, name: editName.trim(), type: editType, color: editColor },
      {
        onSuccess: () => {
          setEditingCategory(null);
          toast.success("Category updated");
        },
      }
    );
  };

  const handleDelete = () => {
    if (!deletingCategory) return;

    deleteCategory.mutate(deletingCategory.id, {
      onSuccess: () => {
        setDeletingCategory(null);
        toast.success("Category deleted");
      },
    });
  };

  const handleOpenBudget = (category: CategoryWithBudget) => {
    setBudgetCategory(category);
    setBudgetAmount(category.currentBudget?.amount?.toString() || "");
  };

  const handleSaveBudget = () => {
    if (!budgetCategory) return;

    const amount = parseFloat(budgetAmount);
    if (isNaN(amount) || amount < 0) {
      toast.error("Please enter a valid budget amount");
      return;
    }

    setBudget.mutate(
      { categoryId: budgetCategory.id, amount, startMonth: budgetMonth },
      {
        onSuccess: () => {
          setBudgetCategory(null);
          toast.success("Budget saved");
        },
      }
    );
  };

  const handleDeleteBudget = (budgetId: string) => {
    deleteBudget.mutate(budgetId, {
      onSuccess: () => {
        toast.success("Budget removed");
      },
    });
  };

  if (categories.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Tags className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No categories yet</h3>
          <p className="text-muted-foreground mt-1">
            Create categories to organize your transactions
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Card key={category.id}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: category.color }}
                >
                  <Tags className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base capitalize">{category.name}</CardTitle>
                    <Badge 
                      variant={
                        category.type === "income" ? "default" : 
                        category.type === "transfer" ? "outline" : 
                        "secondary"
                      } 
                      className="text-xs"
                    >
                      {category.type}
                    </Badge>
                  </div>
                  <CardDescription>
                    {category.type === "spending" && category.currentBudget ? (
                      <Badge variant="secondary" className="mt-1">
                        {formatCurrency(category.currentBudget.amount)}/month
                      </Badge>
                    ) : category.type === "spending" ? (
                      <span className="text-xs text-muted-foreground">No budget set</span>
                    ) : null}
                  </CardDescription>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {category.type === "spending" && (
                    <DropdownMenuItem onClick={() => handleOpenBudget(category)}>
                      <DollarSign className="w-4 h-4 mr-2" />
                      Set Budget
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => handleEdit(category)}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setDeletingCategory(category)}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Update the category name or color.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Category Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="e.g., groceries"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-type">Type</Label>
              <Select value={editType} onValueChange={(value) => setEditType(value as CategoryType)}>
                <SelectTrigger id="edit-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spending">Spending</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-color">Color</Label>
              <div className="flex gap-2">
                <Input
                  id="edit-color"
                  value={editColor}
                  onChange={(e) => setEditColor(e.target.value)}
                  placeholder="oklch(0.65 0.18 140)"
                  className="flex-1"
                />
                <div
                  className="w-10 h-10 rounded-lg border"
                  style={{ backgroundColor: editColor }}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCategory(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={updateCategory.isPending}>
              {updateCategory.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Budget Dialog */}
      <Dialog open={!!budgetCategory} onOpenChange={() => setBudgetCategory(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Budget</DialogTitle>
            <DialogDescription>
              Set a monthly budget for &quot;{budgetCategory?.name}&quot;. The budget will apply
              starting from the selected month.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Set New Budget Section */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Set New Budget
              </h3>
              <div className="space-y-4 pl-6">
                <div className="space-y-2">
                  <Label htmlFor="budget-amount">Budget Amount</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="budget-amount"
                      type="number"
                      value={budgetAmount}
                      onChange={(e) => setBudgetAmount(e.target.value)}
                      placeholder="500"
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget-month">Starting Month</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="budget-month"
                      type="month"
                      value={budgetMonth}
                      onChange={(e) => setBudgetMonth(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This budget will apply from this month onwards until changed.
                  </p>
                </div>
              </div>
            </div>

            {/* Budget History Section */}
            {budgetCategory && budgetCategory.allBudgets.length > 0 && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="font-medium text-sm flex items-center gap-2">
                    <History className="w-4 h-4" />
                    Budget History
                  </h3>
                  <div className="space-y-2 pl-6">
                    {budgetCategory.allBudgets.map((budget) => {
                      const [year, month] = budget.startMonth.split("-");
                      const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      });
                      
                      return (
                        <div
                          key={budget.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-muted/50"
                        >
                          <div className="flex flex-col gap-1">
                            <span className="font-medium">{formatCurrency(budget.amount)}/month</span>
                            <span className="text-xs text-muted-foreground">
                              Starting {monthName}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteBudget(budget.id)}
                            disabled={deleteBudget.isPending}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBudgetCategory(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveBudget} disabled={setBudget.isPending}>
              {setBudget.isPending ? "Saving..." : "Save Budget"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingCategory} onOpenChange={() => setDeletingCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deletingCategory?.name}&quot;? Transactions
              with this category will become uncategorized.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingCategory(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteCategory.isPending}>
              {deleteCategory.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
