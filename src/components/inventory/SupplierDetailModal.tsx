"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  IconTruck,
  IconPhone,
  IconMail,
  IconMapPin,
  IconEdit,
  IconTrash,
  IconCreditCard,
  IconCalendar,
  IconFileText,
  IconPackage,
  IconClipboardList,
  IconUser,
  IconBuilding,
} from "@tabler/icons-react";
import { toast } from "sonner";
import Link from "next/link";

interface Supplier {
  id: number;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  taxId?: string;
  paymentTerms?: string;
  creditLimit?: number;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    products: number;
    purchaseOrders: number;
  };
}

interface SupplierDetailModalProps {
  supplierId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

export default function SupplierDetailModal({
  supplierId,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false,
}: SupplierDetailModalProps) {
  const { data: session } = useSession();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch supplier details when modal opens
  useEffect(() => {
    if (isOpen && supplierId) {
      fetchSupplierDetails();
    }
  }, [isOpen, supplierId]);

  const fetchSupplierDetails = async () => {
    if (!supplierId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/suppliers/${supplierId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch supplier details");
      }

      const data = await response.json();
      setSupplier(data.data);
    } catch (err) {
      console.error("Error fetching supplier details:", err);
      setError("Failed to load supplier details. Please try again.");
      toast.error("Failed to load supplier details");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (supplier && onEdit) {
      onEdit(supplier.id);
      onClose();
    }
  };

  const handleDelete = () => {
    if (supplier && onDelete) {
      onDelete(supplier.id);
      onClose();
    }
  };

  const formatAddress = () => {
    if (!supplier) return null;

    const addressParts = [
      supplier.address,
      supplier.city,
      supplier.state,
      supplier.country,
      supplier.postalCode,
    ].filter(Boolean);

    return addressParts.length > 0 ? addressParts.join(", ") : null;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconTruck className="h-5 w-5" />
            Supplier Details
          </DialogTitle>
          <DialogDescription>
            Complete information about this supplier
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">
              Loading supplier details...
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchSupplierDetails} variant="outline">
              Try Again
            </Button>
          </div>
        ) : supplier ? (
          <div className="space-y-6">
            {/* Header with Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold">{supplier.name}</h2>
                <Badge variant={supplier.isActive ? "default" : "secondary"}>
                  {supplier.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                {canEdit && (
                  <Button onClick={handleEdit} variant="outline" size="sm">
                    <IconEdit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
                {canDelete && (
                  <Button
                    onClick={handleDelete}
                    variant="destructive"
                    size="sm"
                  >
                    <IconTrash className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
            </div>

            <Separator />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconUser className="h-4 w-4" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {supplier.contactPerson && (
                    <div className="flex items-center gap-3">
                      <IconUser className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Contact Person</p>
                        <p className="text-sm text-muted-foreground">
                          {supplier.contactPerson}
                        </p>
                      </div>
                    </div>
                  )}

                  {supplier.email && (
                    <div className="flex items-center gap-3">
                      <IconMail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Email</p>
                        <p className="text-sm text-muted-foreground">
                          {supplier.email}
                        </p>
                      </div>
                    </div>
                  )}

                  {supplier.phone && (
                    <div className="flex items-center gap-3">
                      <IconPhone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Phone</p>
                        <p className="text-sm text-muted-foreground">
                          {supplier.phone}
                        </p>
                      </div>
                    </div>
                  )}

                  {!supplier.contactPerson &&
                    !supplier.email &&
                    !supplier.phone && (
                      <p className="text-sm text-muted-foreground">
                        No contact information available
                      </p>
                    )}
                </CardContent>
              </Card>

              {/* Address Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconMapPin className="h-4 w-4" />
                    Address Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {formatAddress() ? (
                    <div className="flex items-start gap-3">
                      <IconMapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Address</p>
                        <p className="text-sm text-muted-foreground">
                          {formatAddress()}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No address information available
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Business Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconBuilding className="h-4 w-4" />
                    Business Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {supplier.taxId && (
                    <div className="flex items-center gap-3">
                      <IconFileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Tax ID</p>
                        <p className="text-sm text-muted-foreground">
                          {supplier.taxId}
                        </p>
                      </div>
                    </div>
                  )}

                  {supplier.paymentTerms && (
                    <div className="flex items-center gap-3">
                      <IconCreditCard className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Payment Terms</p>
                        <p className="text-sm text-muted-foreground">
                          {supplier.paymentTerms}
                        </p>
                      </div>
                    </div>
                  )}

                  {supplier.creditLimit && (
                    <div className="flex items-center gap-3">
                      <IconCreditCard className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Credit Limit</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(supplier.creditLimit)}
                        </p>
                      </div>
                    </div>
                  )}

                  {!supplier.taxId &&
                    !supplier.paymentTerms &&
                    !supplier.creditLimit && (
                      <p className="text-sm text-muted-foreground">
                        No business information available
                      </p>
                    )}
                </CardContent>
              </Card>

              {/* Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconClipboardList className="h-4 w-4" />
                    Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <IconPackage className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Products</p>
                      <p className="text-sm text-muted-foreground">
                        {supplier._count?.products || 0} products
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <IconClipboardList className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Purchase Orders</p>
                      <p className="text-sm text-muted-foreground">
                        {supplier._count?.purchaseOrders || 0} orders
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <IconCalendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Created</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(supplier.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <IconCalendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Last Updated</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(supplier.updatedAt)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Notes Section */}
            {supplier.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconFileText className="h-4 w-4" />
                    Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {supplier.notes}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
