"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Filter, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  useFinancialCategories,
  useDeleteFinancialCategory,
} from "@/hooks/api/useFinancialCategories";
import { AppUser } from "@/types/user";

interface CategoryListProps {
  user: AppUser;
}

export function CategoryList({ user: _user }: CategoryListProps) {
  const router = useRouter();
  const [filters, setFilters] = useState({
    type: "",
    isActive: "",
  });

  const { data: categories = [], isLoading } = useFinancialCategories();
  const deleteCategory = useDeleteFinancialCategory();

  const filteredCategories = categories.filter((category) => {
    if (filters.type && category.type !== filters.type) return false;
    if (
      filters.isActive !== "" &&
      category.isActive !== (filters.isActive === "true")
    )
      return false;
    return true;
  });

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this category?")) {
      try {
        await deleteCategory.mutateAsync(id);
        toast.success("Category deleted successfully");
      } catch (_error: any) {
        toast.error("Failed to delete category");
      }
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Financial Categories</h1>
          <p className="text-muted-foreground">
            Manage income and expense categories
          </p>
        </div>
        <Button onClick={() => router.push("/finance/categories/add")}>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={filters.type}
                onValueChange={(value) =>
                  setFilters({ ...filters, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="INCOME">Income</SelectItem>
                  <SelectItem value="EXPENSE">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={filters.isActive}
                onValueChange={(value) =>
                  setFilters({ ...filters, isActive: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCategories.map((category) => (
          <Card key={category.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{category.name}</CardTitle>
                <Badge
                  variant={category.type === "INCOME" ? "default" : "secondary"}
                >
                  {category.type}
                </Badge>
              </div>
              <CardDescription>
                {category.description || "No description"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={category.isActive ? "default" : "secondary"}>
                    {category.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      router.push(`/finance/categories/${category.id}/edit`)
                    }
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(category.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCategories.length === 0 && !isLoading && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No categories found</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push("/finance/categories/add")}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First Category
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
