"use client";

import { useState } from "react";
import { useCategoryMutations } from "@somar/shared/hooks";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import type { CategoryType } from "@somar/shared";

const presetColors = [
  "oklch(0.65 0.2 30)",   // Orange
  "oklch(0.65 0.18 140)", // Green
  "oklch(0.6 0.18 200)",  // Blue
  "oklch(0.65 0.15 280)", // Purple
  "oklch(0.65 0.2 330)",  // Pink
  "oklch(0.6 0.12 80)",   // Yellow-green
  "oklch(0.55 0.15 250)", // Indigo
  "oklch(0.7 0.15 150)",  // Teal
];

export function CreateCategoryDialog() {
  const { createCategory } = useCategoryMutations();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<CategoryType>("spending");
  const [color, setColor] = useState(presetColors[0]);

  const handleCreate = () => {
    if (!name.trim()) {
      toast.error("Please enter a category name");
      return;
    }

    createCategory.mutate(
      { name: name.trim(), type, color },
      {
        onSuccess: () => {
          toast.success("Category created");
          setOpen(false);
          setName("");
          setType("spending");
          setColor(presetColors[Math.floor(Math.random() * presetColors.length)]);
        },
        onError: () => {
          toast.error("Failed to create category");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Category</DialogTitle>
          <DialogDescription>
            Add a new category to organize your transactions.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Category Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., utilities"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select value={type} onValueChange={(value) => setType(value as CategoryType)}>
              <SelectTrigger id="type">
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
            <Label>Color</Label>
            <div className="flex gap-2 flex-wrap">
              {presetColors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-lg transition-all ${
                    color === c ? "ring-2 ring-offset-2 ring-primary" : ""
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={createCategory.isPending}>
            {createCategory.isPending ? "Creating..." : "Create Category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
