"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useCategoryMutations } from "@somar/shared/hooks";
import type { CategoryType, CategoryWithBudget } from "@somar/shared";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tags,
  MoreHorizontal,
  Pencil,
  Trash2,
  DollarSign,
  Calendar,
  History,
  X,
  Sparkles,
  TrendingUp,
  ArrowLeftRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { formatCurrency } from "@somar/shared";

interface CategoriesListProps {
  categories: CategoryWithBudget[];
  categoryType: "spending" | "income" | "transfer";
}

export function CategoriesList({ categories, categoryType }: CategoriesListProps) {
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
    return <EmptyState categoryType={categoryType} />;
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category, index) => (
          <CategoryCard
            key={category.id}
            category={category}
            index={index}
            onEdit={handleEdit}
            onDelete={setDeletingCategory}
            onSetBudget={handleOpenBudget}
          />
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}>
        <DialogContent className="bg-surface border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Category</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Update the category name, type, or color.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-foreground-secondary">Category Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="e.g., groceries"
                className="bg-surface-elevated border-border text-foreground placeholder:text-foreground-dim focus:border-primary focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-type" className="text-foreground-secondary">Type</Label>
              <Select value={editType} onValueChange={(value) => setEditType(value as CategoryType)}>
                <SelectTrigger id="edit-type" className="bg-surface-elevated border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-surface-elevated border-border">
                  <SelectItem value="spending" className="text-foreground-secondary focus:bg-muted">Spending</SelectItem>
                  <SelectItem value="income" className="text-foreground-secondary focus:bg-muted">Income</SelectItem>
                  <SelectItem value="transfer" className="text-foreground-secondary focus:bg-muted">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-color" className="text-foreground-secondary">Color</Label>
              <div className="flex gap-3">
                <Input
                  id="edit-color"
                  value={editColor}
                  onChange={(e) => setEditColor(e.target.value)}
                  placeholder="oklch(0.65 0.18 140)"
                  className="flex-1 bg-surface-elevated border-border text-foreground placeholder:text-foreground-dim focus:border-primary focus:ring-primary"
                />
                <div
                  className="w-12 h-10 rounded-lg border border-border-strong flex-shrink-0"
                  style={{
                    backgroundColor: editColor,
                    boxShadow: `0 0 20px ${editColor}40`,
                  }}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setEditingCategory(null)}
              className="bg-transparent border-border text-foreground-secondary hover:bg-surface-elevated hover:text-foreground"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={updateCategory.isPending}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {updateCategory.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Budget Dialog */}
      <Dialog open={!!budgetCategory} onOpenChange={() => setBudgetCategory(null)}>
        <DialogContent className="max-w-lg bg-surface border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: budgetCategory?.color,
                  boxShadow: `0 0 10px ${budgetCategory?.color}60`,
                }}
              />
              Budget for {budgetCategory?.name}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Set a monthly budget. It applies from the selected month onwards until changed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Set New Budget Section */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm flex items-center gap-2 text-foreground-secondary">
                <DollarSign className="w-4 h-4 text-primary" />
                Set Budget
              </h3>
              <div className="space-y-4 pl-6">
                <div className="space-y-2">
                  <Label htmlFor="budget-amount" className="text-foreground-secondary">Monthly Amount</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-dim" />
                    <Input
                      id="budget-amount"
                      type="number"
                      value={budgetAmount}
                      onChange={(e) => setBudgetAmount(e.target.value)}
                      placeholder="500"
                      className="pl-9 bg-surface-elevated border-border text-foreground placeholder:text-foreground-dim focus:border-primary"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget-month" className="text-foreground-secondary">Starting Month</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-dim" />
                    <Input
                      id="budget-month"
                      type="month"
                      value={budgetMonth}
                      onChange={(e) => setBudgetMonth(e.target.value)}
                      className="pl-9 bg-surface-elevated border-border text-foreground focus:border-primary"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Budget History Section */}
            {budgetCategory && budgetCategory.allBudgets.length > 0 && (
              <div className="space-y-4">
                <div className="h-px bg-border" />
                <h3 className="font-medium text-sm flex items-center gap-2 text-foreground-secondary">
                  <History className="w-4 h-4 text-primary" />
                  Budget History
                </h3>
                <div className="space-y-2 pl-6 max-h-[200px] overflow-y-auto">
                  {budgetCategory.allBudgets.map((budget) => {
                    const [year, month] = budget.startMonth.split("-");
                    const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    });

                    return (
                      <div
                        key={budget.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-surface-elevated border border-border"
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-foreground">
                            {formatCurrency(budget.amount)}/mo
                          </span>
                          <span className="text-xs text-muted-foreground">
                            From {monthName}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-danger hover:bg-danger/10"
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
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setBudgetCategory(null)}
              className="bg-transparent border-border text-foreground-secondary hover:bg-surface-elevated hover:text-foreground"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveBudget}
              disabled={setBudget.isPending}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {setBudget.isPending ? "Saving..." : "Save Budget"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingCategory} onOpenChange={() => setDeletingCategory(null)}>
        <DialogContent className="bg-surface border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-foreground">Delete Category</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Are you sure you want to delete &quot;{deletingCategory?.name}&quot;? Transactions
              with this category will become uncategorized.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeletingCategory(null)}
              className="bg-transparent border-border text-foreground-secondary hover:bg-surface-elevated hover:text-foreground"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleteCategory.isPending}
              className="bg-destructive hover:bg-destructive/90 text-primary-foreground"
            >
              {deleteCategory.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CategoryCard({
  category,
  index,
  onEdit,
  onDelete,
  onSetBudget,
}: {
  category: CategoryWithBudget;
  index: number;
  onEdit: (category: CategoryWithBudget) => void;
  onDelete: (category: CategoryWithBudget) => void;
  onSetBudget: (category: CategoryWithBudget) => void;
}) {
  const isSpending = category.type === "spending";
  const hasBudget = isSpending && category.currentBudget;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative"
    >
      <div className="relative h-full rounded-2xl bg-surface border border-border-subtle p-5 transition-all duration-300 hover:border-primary/30 overflow-hidden">
        {/* Glow effect on hover */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${category.color}15 0%, transparent 50%)`,
          }}
        />

        {/* Top row: Color indicator + Name + Menu */}
        <div className="relative flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Color indicator with glow */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
              style={{
                backgroundColor: category.color,
                boxShadow: `0 0 25px ${category.color}50`,
              }}
            >
              <Tags className="w-5 h-5 text-white/90" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-foreground capitalize truncate">
                {category.name}
              </h3>
            </div>
          </div>

          {/* Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-foreground-dim hover:text-foreground-secondary hover:bg-surface-elevated opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-surface-elevated border-border min-w-[160px]"
            >
              {isSpending && (
                <DropdownMenuItem
                  onClick={() => onSetBudget(category)}
                  className="text-foreground-secondary focus:bg-muted focus:text-foreground"
                >
                  <DollarSign className="w-4 h-4 mr-2 text-primary" />
                  Set Budget
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => onEdit(category)}
                className="text-foreground-secondary focus:bg-muted focus:text-foreground"
              >
                <Pencil className="w-4 h-4 mr-2 text-muted-foreground" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem
                onClick={() => onDelete(category)}
                className="text-danger focus:bg-danger/10 focus:text-danger"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Budget section for spending categories */}
        {isSpending && (
          <div className="relative mt-4">
            {hasBudget ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="text-xs text-muted-foreground">Budget</div>
                  <div className="text-sm font-medium text-foreground-secondary">
                    {formatCurrency(category.currentBudget!.amount)}/mo
                  </div>
                </div>
                <button
                  onClick={() => onSetBudget(category)}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  Edit
                </button>
              </div>
            ) : (
              <button
                onClick={() => onSetBudget(category)}
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <DollarSign className="w-3.5 h-3.5" />
                Set budget
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function EmptyState({ categoryType }: { categoryType: "spending" | "income" | "transfer" }) {
  const config = {
    spending: {
      icon: Tags,
      title: "No spending categories",
      description: "Create categories to organize your expenses and set budgets",
      color: "var(--primary)",
    },
    income: {
      icon: TrendingUp,
      title: "No income categories",
      description: "Create categories to track different income sources",
      color: "var(--success)",
    },
    transfer: {
      icon: ArrowLeftRight,
      title: "No transfer categories",
      description: "Create categories for transfers between accounts",
      color: "var(--muted-foreground)",
    },
  };

  const { icon: Icon, title, description, color } = config[categoryType];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div
        className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6 bg-primary/10"
        style={{ boxShadow: `0 0 40px ${color}20` }}
      >
        <Icon className="w-9 h-9 text-primary" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">
        {title}
      </h3>
      <p className="text-muted-foreground text-sm max-w-[280px]">
        {description}
      </p>
      <div className="mt-6 flex items-center gap-2 text-xs text-foreground-dim">
        <Sparkles className="w-3.5 h-3.5" />
        <span>Click &quot;Add Category&quot; above to get started</span>
      </div>
    </motion.div>
  );
}
