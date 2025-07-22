"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateSupplierSchema,
  type UpdateSupplierFormData,
} from "@/lib/validations/supplier";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { FormLoading } from "@/components/ui/form-loading";
import { toast } from "sonner";
import { useSupplier, useUpdateSupplier } from "@/hooks/api/suppliers";
import { logger } from "@/lib/logger";

interface EditSupplierFormProps {
  supplierId: number;
}

export default function EditSupplierForm({
  supplierId,
}: EditSupplierFormProps) {
  const router = useRouter();
  const [_serverError, setServerError] = useState<string | null>(null);

  // TanStack Query hooks
  const { data: supplier, isLoading, error: _error } = useSupplier(supplierId);
  const updateSupplierMutation = useUpdateSupplier();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset: _reset,
    formState: { errors },
  } = useForm<UpdateSupplierFormData>({
    resolver: zodResolver(updateSupplierSchema),
    values: supplier
      ? {
          id: supplier.id,
          name: supplier.name,
          contactPerson: supplier.contactPerson || "",
          email: supplier.email || "",
          phone: supplier.phone || "",
          address: supplier.address || "",
          city: supplier.city || "",
          state: supplier.state || "",
          country: supplier.country || "",
          postalCode: supplier.postalCode || "",
          taxNumber: supplier.taxId || "",
          paymentTerms: supplier.paymentTerms || "",
          creditLimit: supplier.creditLimit,
          isActive: supplier.isActive,
          notes: supplier.notes || "",
        }
      : undefined,
  });

  const isActive = watch("isActive");

  const onSubmit = async (data: UpdateSupplierFormData) => {
    try {
      setServerError(null);

      // Transform form data to API format
      const apiData = {
        id: data.id,
        name: data.name,
        contactPerson: data.contactPerson || undefined,
        email: data.email || undefined,
        phone: data.phone || undefined,
        address: data.address || undefined,
        city: data.city || undefined,
        state: data.state || undefined,
        country: data.country || undefined,
        postalCode: data.postalCode || undefined,
        taxId: data.taxNumber || undefined,
        paymentTerms: data.paymentTerms || undefined,
        creditLimit: data.creditLimit,
        isActive: data.isActive,
        notes: data.notes || undefined,
      };

      await updateSupplierMutation.mutateAsync({ id: data.id, data: apiData });
      toast.success("Supplier updated successfully!");
      router.push("/inventory/suppliers");
    } catch (error) {
      logger.error("Failed to update supplier", {
        supplierId: supplier?.id,
        supplierName: data.name,
        error: error instanceof Error ? error.message : String(error),
      });
      toast.error("Failed to update supplier");
    }
  };

  if (isLoading) {
    return (
      <FormLoading
        title="Edit Supplier"
        description="Loading supplier information..."
        backLabel="Back to Suppliers"
        onBack={() => router.push("/inventory/suppliers")}
        backUrl="/inventory/suppliers"
      />
    );
  }

  // Show loading state during update
  if (updateSupplierMutation.isPending) {
    return (
      <FormLoading
        title="Edit Supplier"
        description="Updating supplier information..."
        backLabel="Back to Suppliers"
        onBack={() => router.push("/inventory/suppliers")}
        backUrl="/inventory/suppliers"
      />
    );
  }

  if (!supplier) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/inventory/suppliers")}
          className="mb-4 px-4 lg:px-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Suppliers
        </Button>
        <PageHeader
          title="Edit Supplier"
          description={`Update the details for "${supplier.name}" supplier`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Supplier Information</CardTitle>
          <CardDescription>
            Update the details for this supplier. Required fields are marked
            with an asterisk (*).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">
                Supplier Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Enter supplier name"
                disabled={updateSupplierMutation.isPending}
              />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPerson">Contact Person</Label>
              <Input
                id="contactPerson"
                {...register("contactPerson")}
                placeholder="Enter contact person"
                disabled={updateSupplierMutation.isPending}
              />
              {errors.contactPerson && (
                <p className="text-sm text-destructive">
                  {errors.contactPerson.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="Enter email address"
                  disabled={updateSupplierMutation.isPending}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  {...register("phone")}
                  placeholder="Enter phone number"
                  disabled={updateSupplierMutation.isPending}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">
                    {errors.phone.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                {...register("address")}
                placeholder="Enter address"
                disabled={updateSupplierMutation.isPending}
              />
              {errors.address && (
                <p className="text-sm text-destructive">
                  {errors.address.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  {...register("city")}
                  placeholder="Enter city"
                  disabled={updateSupplierMutation.isPending}
                />
                {errors.city && (
                  <p className="text-sm text-destructive">
                    {errors.city.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  {...register("state")}
                  placeholder="Enter state"
                  disabled={updateSupplierMutation.isPending}
                />
                {errors.state && (
                  <p className="text-sm text-destructive">
                    {errors.state.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  {...register("country")}
                  placeholder="Enter country"
                  disabled={updateSupplierMutation.isPending}
                />
                {errors.country && (
                  <p className="text-sm text-destructive">
                    {errors.country.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input
                  id="postalCode"
                  {...register("postalCode")}
                  placeholder="Enter postal code"
                  disabled={updateSupplierMutation.isPending}
                />
                {errors.postalCode && (
                  <p className="text-sm text-destructive">
                    {errors.postalCode.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="taxNumber">Tax Number</Label>
                <Input
                  id="taxNumber"
                  {...register("taxNumber")}
                  placeholder="Enter tax number"
                  disabled={updateSupplierMutation.isPending}
                />
                {errors.taxNumber && (
                  <p className="text-sm text-destructive">
                    {errors.taxNumber.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentTerms">Payment Terms</Label>
                <Input
                  id="paymentTerms"
                  {...register("paymentTerms")}
                  placeholder="Enter payment terms"
                  disabled={updateSupplierMutation.isPending}
                />
                {errors.paymentTerms && (
                  <p className="text-sm text-destructive">
                    {errors.paymentTerms.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="creditLimit">Credit Limit</Label>
              <Input
                id="creditLimit"
                type="number"
                {...register("creditLimit", { valueAsNumber: true })}
                placeholder="0.00"
                disabled={updateSupplierMutation.isPending}
                min="0"
                step="0.01"
              />
              {errors.creditLimit && (
                <p className="text-sm text-destructive">
                  {errors.creditLimit.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                {...register("notes")}
                placeholder="Enter any additional notes"
                rows={3}
                disabled={updateSupplierMutation.isPending}
              />
              {errors.notes && (
                <p className="text-sm text-destructive">
                  {errors.notes.message}
                </p>
              )}
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label className="text-base">Active Status</Label>
                <p className="text-sm text-muted-foreground">
                  Active suppliers will be available for product assignment.
                  Inactive suppliers will be hidden from selection.
                </p>
              </div>
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={(checked) => setValue("isActive", checked)}
                disabled={updateSupplierMutation.isPending}
              />
            </div>
            {errors.isActive && (
              <p className="text-sm text-destructive">
                {errors.isActive.message}
              </p>
            )}

            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/inventory/suppliers")}
                disabled={updateSupplierMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateSupplierMutation.isPending}>
                {updateSupplierMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Supplier"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
