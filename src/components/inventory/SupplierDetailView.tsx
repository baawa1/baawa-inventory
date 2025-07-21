"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  IconArrowLeft,
  IconEdit,
  IconTrash,
  IconPhone,
  IconMail,
  IconMapPin,
  IconBuilding,
  IconCalendar,
  IconPackages,
  IconClipboardList,
  IconUser,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useSupplier, useDeleteSupplier } from "@/hooks/api/suppliers";
import { logger } from "@/lib/logger";

interface SupplierDetailViewProps {
  supplierId: number;
}

export default function SupplierDetailView({
  supplierId,
}: SupplierDetailViewProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Permission checks
  const user = session?.user;
  const canManageSuppliers =
    user && ["ADMIN", "MANAGER"].includes(user.role || "");
  const canDeleteSuppliers = user && user.role === "ADMIN";

  // TanStack Query hooks
  const { data: supplier, isLoading: loading, error } = useSupplier(supplierId);

  const deleteSupplierMutation = useDeleteSupplier();

  // Handle delete supplier
  const handleDelete = async () => {
    if (!supplier) return;

    try {
      await deleteSupplierMutation.mutateAsync(supplier.id);
      toast.success("Supplier deleted successfully");
      router.push("/inventory/suppliers");
    } catch (err) {
      logger.error("Failed to delete supplier", {
        supplierId: supplier.id,
        supplierName: supplier.name,
        error: err instanceof Error ? err.message : String(err),
      });
      toast.error("Failed to delete supplier");
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-sm text-muted-foreground">
            Loading supplier details...
          </div>
        </div>
      </div>
    );
  }

  if (error || !supplier) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/inventory/suppliers">
            <Button variant="outline" size="sm">
              <IconArrowLeft className="h-4 w-4 mr-2" />
              Back to Suppliers
            </Button>
          </Link>
        </div>
        <div className="text-center py-8">
          <IconAlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {error?.message || "Supplier not found"}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            The supplier you're looking for doesn't exist or you don't have
            permission to view it.
          </p>
          <Link href="/inventory/suppliers">
            <Button variant="outline">
              <IconArrowLeft className="h-4 w-4 mr-2" />
              Back to Suppliers
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/inventory/suppliers">
              <Button variant="outline" size="sm">
                <IconArrowLeft className="h-4 w-4 mr-2" />
                Back to Suppliers
              </Button>
            </Link>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                {supplier.name}
              </h2>
              <p className="text-sm text-muted-foreground">
                Supplier details and information
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={supplier.isActive ? "default" : "secondary"}>
              {supplier.isActive ? "Active" : "Inactive"}
            </Badge>
            {canManageSuppliers && (
              <Link href={`/inventory/suppliers/${supplier.id}/edit`}>
                <Button variant="outline">
                  <IconEdit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
            )}
            {canDeleteSuppliers && (
              <AlertDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
              >
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <IconTrash className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <IconAlertTriangle className="h-5 w-5 text-red-500" />
                      Delete Supplier
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{supplier.name}"? This
                      action cannot be undone and will affect all related
                      products and purchase orders.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconUser className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Supplier Name
                </label>
                <p className="text-sm">{supplier.name}</p>
              </div>
              {supplier.contactPerson && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Contact Person
                  </label>
                  <p className="text-sm">{supplier.contactPerson}</p>
                </div>
              )}
              <div className="space-y-2">
                {supplier.email && (
                  <div className="flex items-center gap-2">
                    <IconMail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{supplier.email}</span>
                  </div>
                )}
                {supplier.phone && (
                  <div className="flex items-center gap-2">
                    <IconPhone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{supplier.phone}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconMapPin className="h-5 w-5" />
                Address Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {supplier.address ? (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Address
                  </label>
                  <p className="text-sm">{supplier.address}</p>
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-4">
                {supplier.city && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      City
                    </label>
                    <p className="text-sm">{supplier.city}</p>
                  </div>
                )}
                {supplier.state && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      State
                    </label>
                    <p className="text-sm">{supplier.state}</p>
                  </div>
                )}
                {supplier.country && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Country
                    </label>
                    <p className="text-sm">{supplier.country}</p>
                  </div>
                )}
                {supplier.postalCode && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Postal Code
                    </label>
                    <p className="text-sm">{supplier.postalCode}</p>
                  </div>
                )}
              </div>

              {!supplier.address &&
                !supplier.city &&
                !supplier.state &&
                !supplier.country &&
                !supplier.postalCode && (
                  <p className="text-sm text-muted-foreground italic">
                    No address information available
                  </p>
                )}
            </CardContent>
          </Card>

          {/* Business Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconBuilding className="h-5 w-5" />
                Business Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {supplier.taxId && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Tax ID
                  </label>
                  <p className="text-sm">{supplier.taxId}</p>
                </div>
              )}
              {supplier.paymentTerms && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Payment Terms
                  </label>
                  <p className="text-sm">{supplier.paymentTerms}</p>
                </div>
              )}
              {supplier.creditLimit && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Credit Limit
                  </label>
                  <p className="text-sm">
                    ${supplier.creditLimit.toLocaleString()}
                  </p>
                </div>
              )}

              {!supplier.taxId &&
                !supplier.paymentTerms &&
                !supplier.creditLimit && (
                  <p className="text-sm text-muted-foreground italic">
                    No business information available
                  </p>
                )}
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconPackages className="h-5 w-5" />
                Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Products</span>
                <span className="text-sm font-medium">
                  {supplier._count?.products || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Purchase Orders
                </span>
                <span className="text-sm font-medium">
                  {supplier._count?.purchaseOrders || 0}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={supplier.isActive ? "default" : "secondary"}>
                  {supplier.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconCalendar className="h-5 w-5" />
                Important Dates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Created
                </label>
                <p className="text-sm">
                  {new Date(supplier.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Last Updated
                </label>
                <p className="text-sm">
                  {new Date(supplier.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {supplier.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconClipboardList className="h-5 w-5" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{supplier.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-start gap-4">
          <Link href="/inventory/suppliers">
            <Button variant="outline">
              <IconArrowLeft className="h-4 w-4 mr-2" />
              Back to Suppliers
            </Button>
          </Link>
          {canManageSuppliers && (
            <Link href={`/inventory/suppliers/${supplier.id}/edit`}>
              <Button>
                <IconEdit className="h-4 w-4 mr-2" />
                Edit Supplier
              </Button>
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
