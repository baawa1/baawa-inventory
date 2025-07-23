"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";
import { useCreateFinancialCategory } from "@/hooks/api/useFinancialCategories";
import { AppUser } from "@/types/user";

interface AddCategoryFormProps {
  user: AppUser;
}

const addCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  type: z.enum(["INCOME", "EXPENSE"]),
  description: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
});

type FormData = z.infer<typeof addCategorySchema>;

export function AddCategoryForm({ user: _user }: AddCategoryFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createCategory = useCreateFinancialCategory();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(addCategorySchema),
    defaultValues: {
      type: "EXPENSE",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);

      await createCategory.mutateAsync(data);

      toast.success("Category created successfully");
      router.push("/finance/categories");
    } catch (error) {
      console.error("Error creating category:", error);
      toast.error("Failed to create category");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Add Category</h1>
          <p className="text-muted-foreground">
            Create a new financial category
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Category Details</CardTitle>
          <CardDescription>
            Enter the category information below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter category name..."
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Type */}
              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select
                  onValueChange={(value: "INCOME" | "EXPENSE") =>
                    setValue("type", value)
                  }
                  defaultValue="EXPENSE"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INCOME">Income</SelectItem>
                    <SelectItem value="EXPENSE">Expense</SelectItem>
                  </SelectContent>
                </Select>
                {errors.type && (
                  <p className="text-sm text-destructive">
                    {errors.type.message}
                  </p>
                )}
              </div>

              {/* Color */}
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Input id="color" type="color" {...register("color")} />
                {errors.color && (
                  <p className="text-sm text-destructive">
                    {errors.color.message}
                  </p>
                )}
              </div>

              {/* Icon */}
              <div className="space-y-2">
                <Label htmlFor="icon">Icon</Label>
                <Input
                  id="icon"
                  placeholder="Icon name (optional)..."
                  {...register("icon")}
                />
                {errors.icon && (
                  <p className="text-sm text-destructive">
                    {errors.icon.message}
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter category description..."
                {...register("description")}
              />
              {errors.description && (
                <p className="text-sm text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? "Creating..." : "Create Category"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
