'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useSupplier } from '@/hooks/api/suppliers';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  IconTruck,
  IconPhone,
  IconMail,
  IconMapPin,
  IconEdit,
  IconCreditCard,
  IconCalendar,
  IconFileText,
  IconPackage,
  IconClipboardList,
  IconUser,
  IconBuilding,
  IconX,
  IconRefresh,
} from '@tabler/icons-react';

interface _Supplier {
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
  };
}

interface SupplierDetailModalProps {
  supplierId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (id: number) => void;
  onDeactivate?: (id: number) => void;
  onReactivate?: (id: number) => void;
  canEdit?: boolean;
  canDeactivate?: boolean;
}

export default function SupplierDetailModal({
  supplierId,
  isOpen,
  onClose,
  onEdit,
  onDeactivate,
  onReactivate,
  canEdit = false,
  canDeactivate = false,
}: SupplierDetailModalProps) {
  const { data: _session } = useSession();

  // Use TanStack Query hook for fetching supplier data
  const {
    data: supplier,
    isLoading: loading,
    error,
    isError,
  } = useSupplier(supplierId || 0);

  const errorMessage = isError && error ? (error as Error).message : null;

  const handleEdit = () => {
    if (supplier && onEdit) {
      onEdit(supplier.id);
      onClose();
    }
  };

  const handleDeactivate = () => {
    if (supplier && onDeactivate) {
      onDeactivate(supplier.id);
      onClose();
    }
  };

  const handleReactivate = () => {
    if (supplier && onReactivate) {
      onReactivate(supplier.id);
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

    return addressParts.length > 0 ? addressParts.join(', ') : null;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] w-[95vw] max-w-4xl overflow-y-auto">
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
            <div className="text-muted-foreground text-sm">
              Loading supplier details...
            </div>
          </div>
        ) : errorMessage ? (
          <div className="py-8 text-center">
            <p className="mb-4 text-red-600">{errorMessage}</p>
            <p className="text-sm text-gray-500">
              Please try again or contact support if the problem persists.
            </p>
          </div>
        ) : supplier ? (
          <div className="space-y-6">
            {/* Header with Actions */}
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
              <div className="flex flex-col gap-3">
                <h2 className="text-2xl font-bold break-words">
                  {supplier.name}
                </h2>
                <Badge
                  variant={supplier.isActive ? 'default' : 'secondary'}
                  className="w-fit"
                >
                  {supplier.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {canEdit && (
                  <Button onClick={handleEdit} variant="outline" size="sm">
                    <IconEdit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                )}
              </div>
            </div>

            <Separator />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
                    <div className="flex items-start gap-3">
                      <IconUser className="text-muted-foreground mt-0.5 h-4 w-4 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">Contact Person</p>
                        <p className="text-muted-foreground text-sm break-words">
                          {supplier.contactPerson}
                        </p>
                      </div>
                    </div>
                  )}

                  {supplier.email && (
                    <div className="flex items-start gap-3">
                      <IconMail className="text-muted-foreground mt-0.5 h-4 w-4 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">Email</p>
                        <p className="text-muted-foreground text-sm break-all">
                          {supplier.email}
                        </p>
                      </div>
                    </div>
                  )}

                  {supplier.phone && (
                    <div className="flex items-start gap-3">
                      <IconPhone className="text-muted-foreground mt-0.5 h-4 w-4 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">Phone</p>
                        <p className="text-muted-foreground text-sm break-all">
                          {supplier.phone}
                        </p>
                      </div>
                    </div>
                  )}

                  {!supplier.contactPerson &&
                    !supplier.email &&
                    !supplier.phone && (
                      <p className="text-muted-foreground text-sm">
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
                      <IconMapPin className="text-muted-foreground mt-0.5 h-4 w-4" />
                      <div>
                        <p className="text-sm font-medium">Address</p>
                        <p className="text-muted-foreground text-sm">
                          {formatAddress()}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">
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
                      <IconFileText className="text-muted-foreground h-4 w-4" />
                      <div>
                        <p className="text-sm font-medium">Tax ID</p>
                        <p className="text-muted-foreground text-sm">
                          {supplier.taxId}
                        </p>
                      </div>
                    </div>
                  )}

                  {supplier.paymentTerms && (
                    <div className="flex items-center gap-3">
                      <IconCreditCard className="text-muted-foreground h-4 w-4" />
                      <div>
                        <p className="text-sm font-medium">Payment Terms</p>
                        <p className="text-muted-foreground text-sm">
                          {supplier.paymentTerms}
                        </p>
                      </div>
                    </div>
                  )}

                  {supplier.creditLimit && (
                    <div className="flex items-center gap-3">
                      <IconCreditCard className="text-muted-foreground h-4 w-4" />
                      <div>
                        <p className="text-sm font-medium">Credit Limit</p>
                        <p className="text-muted-foreground text-sm">
                          {formatCurrency(supplier.creditLimit)}
                        </p>
                      </div>
                    </div>
                  )}

                  {!supplier.taxId &&
                    !supplier.paymentTerms &&
                    !supplier.creditLimit && (
                      <p className="text-muted-foreground text-sm">
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
                    <IconPackage className="text-muted-foreground h-4 w-4" />
                    <div>
                      <p className="text-sm font-medium">Products</p>
                      <p className="text-muted-foreground text-sm">
                        {supplier._count?.products || 0} products
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <IconCalendar className="text-muted-foreground h-4 w-4" />
                    <div>
                      <p className="text-sm font-medium">Created</p>
                      <p className="text-muted-foreground text-sm">
                        {formatDate(supplier.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <IconCalendar className="text-muted-foreground h-4 w-4" />
                    <div>
                      <p className="text-sm font-medium">Last Updated</p>
                      <p className="text-muted-foreground text-sm">
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
                  <p className="text-muted-foreground text-sm whitespace-pre-wrap">
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
