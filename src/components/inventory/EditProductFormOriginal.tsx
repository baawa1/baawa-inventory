"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatCurrency } from "@/lib/utils";
import { updateProductSchema } from "@/lib/validations/product";
import { toast } from "sonner";
import type { z } from "zod";

type UpdateProductData = z.infer<typeof updateProductSchema>;

interface Category {
  id: number;
  name: string;
}

interface Brand {
  id: number;
  name: string;
}

interface Supplier {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  description: string | null;
  sku: string;
  barcode: string | null;
  category?: {
    id: number;
    name: string;
  };
  brand?: {
    id: number;
    name: string;
  };
  cost: number;
  price: number;
  stock: number;
  min_stock: number;
  max_stock: number | null;
  supplier_id: number;
  status: "active" | "inactive" | "discontinued";
  images: Array<{ url: string; isPrimary: boolean }> | null;
}

interface EditProductFormProps {
  productId: number;
}

export default function EditProductForm({ productId }: EditProductFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [product, setProduct] = useState<Product | null>(null);

  // Add loading states for better UX
  const [_loadingCategories, setLoadingCategories] = useState(true);
  const [_loadingBrands, setLoadingBrands] = useState(true);
  const [_loadingSuppliers, setLoadingSuppliers] = useState(true);

  const form = useForm({
    resolver: zodResolver(updateProductSchema),
    defaultValues: {
      name: "",
      description: "",
      sku: "",
      barcode: "",
      categoryId: undefined as number | undefined,
      brandId: undefined as number | undefined,
      supplierId: undefined as number | undefined,
      purchasePrice: 0,
      sellingPrice: 0,
      currentStock: 0,
      minimumStock: 0,
      maximumStock: undefined as number | undefined,
      status: "active" as const,
      imageUrl: "",
    },
  }) as any; // Type assertion to work around complex React Hook Form + Zod integration issues

  // Load product data and dynamic data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Create fetch function with timeout
        const fetchWithTimeout = (url: string, timeout = 10000) => {
          return Promise.race([
            fetch(url),
            new Promise<Response>((_, reject) =>
              setTimeout(() => reject(new Error("Request timeout")), timeout)
            ),
          ]);
        };

        // Load product data and form data in parallel with timeout
        const [productRes, categoriesRes, brandsRes, suppliersRes] =
          await Promise.allSettled([
            fetchWithTimeout(`/api/products/${productId}`),
            fetchWithTimeout("/api/categories"),
            fetchWithTimeout("/api/brands"),
            fetchWithTimeout("/api/suppliers?limit=100"),
          ]);

        // Handle categories
        if (categoriesRes.status === "fulfilled" && categoriesRes.value.ok) {
          try {
            const categoriesData = await categoriesRes.value.json();
            setCategories(
              categoriesData.data || categoriesData.categories || []
            );
          } catch (error) {
            console.warn("Failed to parse categories data:", error);
          }
        } else {
          console.warn("Failed to fetch categories");
        }
        setLoadingCategories(false);

        // Handle brands
        if (brandsRes.status === "fulfilled" && brandsRes.value.ok) {
          try {
            const brandsData = await brandsRes.value.json();
            setBrands(brandsData.data || brandsData.brands || []);
          } catch (error) {
            console.warn("Failed to parse brands data:", error);
          }
        } else {
          console.warn("Failed to fetch brands");
        }
        setLoadingBrands(false);

        // Handle product data (this is critical)
        if (productRes.status === "fulfilled" && productRes.value.ok) {
          try {
            const productData = await productRes.value.json();
            const productInfo = productData.data as Product;
            setProduct(productInfo);

            // Populate form with existing data
            form.reset({
              name: productInfo.name,
              description: productInfo.description || "",
              sku: productInfo.sku,
              barcode: productInfo.barcode || "",
              categoryId: productInfo.category?.id,
              brandId: productInfo.brand?.id,
              supplierId: productInfo.supplier_id,
              purchasePrice: Number(productInfo.cost),
              sellingPrice: Number(productInfo.price),
              currentStock: productInfo.stock,
              minimumStock: productInfo.min_stock,
              maximumStock: productInfo.max_stock || undefined,
              status: productInfo.status,
              imageUrl: productInfo.images?.[0]?.url || "",
            });
          } catch (error) {
            console.error("Failed to parse product data:", error);
            throw new Error("Failed to load product data");
          }
        } else {
          if (productRes.status === "rejected") {
            console.error("Product fetch failed:", productRes.reason);
          }
          throw new Error("Product not found");
        }

        // Handle suppliers
        if (suppliersRes.status === "fulfilled" && suppliersRes.value.ok) {
          try {
            const suppliersData = await suppliersRes.value.json();
            setSuppliers(suppliersData.suppliers || suppliersData.data || []);
          } catch (error) {
            console.warn("Failed to parse suppliers data:", error);
          }
        } else {
          console.warn("Failed to fetch suppliers");
          // Don't fail the entire component for suppliers
        }
        setLoadingSuppliers(false);
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load product data. Please try again.");
        router.push("/inventory/products");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [productId, form, router]);

  const onSubmit = async (data: UpdateProductData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Convert empty strings to null for optional fields
      const cleanedData = {
        ...data,
        description: data.description?.trim() || null,
        barcode: data.barcode?.trim() || null,
        imageUrl: data.imageUrl?.trim() || null,
        maximumStock: data.maximumStock || null,
      };

      const response = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update product");
      }

      const result = await response.json();
      console.log("Product updated successfully:", result);

      // Show success notification
      toast.success("Product updated successfully!");

      // Redirect to products list
      router.push("/inventory/products");
    } catch (error) {
      console.error("Error updating product:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setSubmitError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl py-6">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
          <p className="text-muted-foreground">Loading product data...</p>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-6">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Products
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
        <p className="text-muted-foreground">
          Update the product details below.
        </p>
      </div>

      {submitError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Product Information</CardTitle>
          <CardDescription>
            Update the details for {product?.name}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 items-start justify-start gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter product name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SKU *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter SKU" {...field} />
                        </FormControl>
                        <FormDescription>
                          Unique identifier for this product
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 items-start justify-start gap-4">
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category *</FormLabel>
                        <Select
                          onValueChange={(value) =>
                            field.onChange(parseInt(value))
                          }
                          value={
                            field.value ? field.value.toString() : undefined
                          }
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem
                                key={`category-${category.id}`}
                                value={category.id.toString()}
                              >
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="brandId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brand</FormLabel>
                        <Select
                          onValueChange={(value) =>
                            field.onChange(parseInt(value))
                          }
                          value={
                            field.value ? field.value.toString() : undefined
                          }
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a brand" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {brands.map((brand) => (
                              <SelectItem
                                key={`brand-${brand.id}`}
                                value={brand.id.toString()}
                              >
                                {brand.name}
                              </SelectItem>
                            ))}
                            <SelectItem key="custom-brand" value="__custom__">
                              + Add new brand
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Select an existing brand or choose "Add new brand" to
                          create one
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter product description"
                          className="resize-none"
                          rows={3}
                          {...field}
                          value={field.value || ""}
                          onChange={(e) =>
                            field.onChange(e.target.value || null)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Identification Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Identification</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 items-start justify-start gap-4">
                  <FormField
                    control={form.control}
                    name="barcode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Barcode</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter barcode"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) =>
                              field.onChange(e.target.value || null)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="supplierId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Supplier *</FormLabel>
                        <Select
                          onValueChange={(value) =>
                            field.onChange(Number(value))
                          }
                          value={field.value ? String(field.value) : undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a supplier" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {suppliers.map((supplier) => (
                              <SelectItem
                                key={supplier.id}
                                value={String(supplier.id)}
                              >
                                {supplier.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Pricing Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Pricing</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 items-start justify-start gap-4">
                  <FormField
                    control={form.control}
                    name="purchasePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Purchase Price (₦) *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                              ₦
                            </span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              className="pl-8"
                              {...field}
                              onChange={(e) =>
                                field.onChange(Number(e.target.value))
                              }
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Cost price from supplier
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sellingPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Selling Price (₦) *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                              ₦
                            </span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              className="pl-8"
                              {...field}
                              onChange={(e) =>
                                field.onChange(Number(e.target.value))
                              }
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Price to sell to customers
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {form.watch("purchasePrice") > 0 &&
                  form.watch("sellingPrice") > 0 && (
                    <div className="text-sm text-muted-foreground">
                      Profit Margin:{" "}
                      {formatCurrency(
                        form.watch("sellingPrice") - form.watch("purchasePrice")
                      )}
                      (
                      {(
                        ((form.watch("sellingPrice") -
                          form.watch("purchasePrice")) /
                          form.watch("sellingPrice")) *
                        100
                      ).toFixed(1)}
                      %)
                    </div>
                  )}
              </div>

              {/* Inventory Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Inventory Management</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="currentStock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Stock</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          Current quantity in stock
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="minimumStock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Stock</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          Alert when stock falls below this level
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="maximumStock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Stock</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="Leave empty for no limit"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value ? Number(e.target.value) : null
                              )
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum quantity to keep in stock
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {form.watch("currentStock") <= form.watch("minimumStock") &&
                  form.watch("minimumStock") > 0 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Warning: Current stock is at or below the minimum stock
                        level.
                      </AlertDescription>
                    </Alert>
                  )}
              </div>

              {/* Additional Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  Additional Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 items-start justify-start gap-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">
                              <div className="flex items-center gap-2">
                                <Badge variant="default" className="text-xs">
                                  Active
                                </Badge>
                                <span>Available for sale</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="inactive">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  Inactive
                                </Badge>
                                <span>Not available for sale</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="discontinued">
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="destructive"
                                  className="text-xs"
                                >
                                  Discontinued
                                </Badge>
                                <span>No longer available</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image URL</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://example.com/image.jpg"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) =>
                              field.onChange(e.target.value || null)
                            }
                          />
                        </FormControl>
                        <FormDescription>URL to product image</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Submit Section */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating Product...
                    </>
                  ) : (
                    "Update Product"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
