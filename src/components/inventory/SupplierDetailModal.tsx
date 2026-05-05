'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useSupplier } from '@/hooks/api/suppliers';
import { type ApiSupplier } from '@/lib/validations/supplier';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  detailDialogContentClassName,
  DetailItem,
  DetailMetric,
  DetailNotice,
  DetailSection,
} from '@/components/ui/detail-dialog';
import {
  IconTruck,
  IconEdit,
} from '@tabler/icons-react';

// Using ApiSupplier type from validation file

interface SupplierDetailModalProps {
  supplierId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (_id: number) => void;
  canEdit?: boolean;
}

export default function SupplierDetailModal({
  supplierId,
  isOpen,
  onClose,
  onEdit,
  canEdit = false,
}: SupplierDetailModalProps) {
  const { data: _session } = useSession();

  // Use TanStack Query hook for fetching supplier data
  const {
    data: supplier,
    isLoading: loading,
    error,
    isError,
  } = useSupplier(supplierId || 0) as {
    data: ApiSupplier | undefined;
    isLoading: boolean;
    error: unknown;
    isError: boolean;
  };

  const errorMessage = isError && error ? (error as Error).message : null;

  const handleEdit = () => {
    if (supplier && onEdit) {
      onEdit(supplier.id);
      onClose();
    }
  };

  const formatAddress = () => {
    if (!supplier) return null;

    const addressParts = [
      supplier.address,
      supplier.city,
      supplier.state,
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={detailDialogContentClassName}>
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
          <div className="grid gap-4 text-sm">
            <DetailSection title="Supplier Summary">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-col gap-3">
                  <h2 className="text-2xl font-bold break-words">
                    {supplier.name}
                  </h2>
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
            </DetailSection>

            <DetailSection title="Key Metrics">
              <div className="grid gap-3 md:grid-cols-3">
                <DetailMetric
                  label="Products"
                  value={supplier._count?.products || 0}
                />
                <DetailMetric
                  label="Created"
                  value={
                    supplier.createdAt ? formatDate(supplier.createdAt) : 'N/A'
                  }
                  valueClassName="text-lg leading-snug"
                />
                <DetailMetric
                  label="Updated"
                  value={
                    supplier.updatedAt ? formatDate(supplier.updatedAt) : 'N/A'
                  }
                  valueClassName="text-lg leading-snug"
                />
              </div>
            </DetailSection>

            {/* Main Content Grid */}
            <div className="grid gap-4 md:grid-cols-2">
              <DetailSection title="Contact Information">
                <div className="grid gap-3">
                  <DetailItem
                    label="Contact Person"
                    value={supplier.contactPerson || 'N/A'}
                  />
                  <DetailItem label="Email" value={supplier.email || 'N/A'} />
                  <DetailItem label="Phone" value={supplier.phone || 'N/A'} />
                </div>
              </DetailSection>

              <DetailSection title="Address Information">
                <div className="grid gap-3">
                  <DetailItem
                    label="Address"
                    value={formatAddress() || 'No address information available'}
                  />
                </div>
              </DetailSection>

              <DetailSection title="Supplier Metadata">
                <div className="grid gap-3">
                  <DetailItem
                    label="Created"
                    value={
                      supplier.createdAt
                        ? formatDate(supplier.createdAt)
                        : 'Not available'
                    }
                  />
                  <DetailItem
                    label="Last Updated"
                    value={
                      supplier.updatedAt
                        ? formatDate(supplier.updatedAt)
                        : 'Not available'
                    }
                  />
                </div>
              </DetailSection>
            </div>

            {/* Notes Section */}
            {supplier.notes && (
              <DetailNotice
                title="Notes"
                className="border-slate-200 bg-slate-50 text-slate-900"
              >
                <p className="whitespace-pre-wrap">{supplier.notes}</p>
              </DetailNotice>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
