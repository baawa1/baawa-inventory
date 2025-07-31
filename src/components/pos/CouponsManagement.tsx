'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  IconSearch,
  IconPlus,
  IconTicket,
  IconPercentage,
  IconCurrencyNaira,
  IconEye,
  IconTrash,
  IconCopy,
  IconCheck,
  IconX,
} from '@tabler/icons-react';
import { formatCurrency } from '@/lib/utils';
import {
  useCoupons,
  useCreateCoupon,
  useToggleCouponStatus,
  useDeleteCoupon,
  type Coupon,
  type CreateCouponData,
} from '@/hooks/api/useCoupons';
import { toast } from 'sonner';

interface CouponsManagementProps {
  user: {
    id: string;
    role: string;
  };
}

export function CouponsManagement({ user }: CouponsManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  const {
    data: couponsResponse,
    isLoading,
    error,
  } = useCoupons({
    search: searchTerm,
    status: selectedStatus,
    page: 1,
    limit: 100, // Get more coupons for the management view
  });

  const coupons = couponsResponse?.data || [];

  const createMutation = useCreateCoupon();
  const toggleStatusMutation = useToggleCouponStatus();
  const deleteMutation = useDeleteCoupon();

  const statusOptions = [
    { value: 'all', label: 'All Coupons' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'expired', label: 'Expired' },
  ];

  const getStatusBadge = (coupon: Coupon) => {
    const now = new Date();
    const validUntil = new Date(coupon.validUntil);
    const isExpired = validUntil < now;
    const isMaxUsesReached =
      coupon.maxUses && coupon.currentUses >= coupon.maxUses;

    if (isExpired) {
      return <Badge className="bg-gray-100 text-gray-800">Expired</Badge>;
    }
    if (isMaxUsesReached) {
      return <Badge className="bg-orange-100 text-orange-800">Used Up</Badge>;
    }
    if (coupon.isActive) {
      return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    }
    return <Badge className="bg-red-100 text-red-800">Inactive</Badge>;
  };

  const getUsageProgress = (coupon: Coupon) => {
    if (!coupon.maxUses) return null;
    const percentage = (coupon.currentUses / coupon.maxUses) * 100;
    return (
      <div className="h-2 w-full rounded-full bg-gray-200">
        <div
          className="bg-primary h-2 rounded-full"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        ></div>
      </div>
    );
  };

  const generateCouponCode = () => {
    return 'SAVE' + Math.random().toString(36).substr(2, 6).toUpperCase();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Coupon code copied to clipboard');
  };

  const handleCreateCoupon = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const data: CreateCouponData = {
      code: formData.get('code') as string,
      name: formData.get('name') as string,
      description: (formData.get('description') as string) || undefined,
      type:
        (formData.get('type') as 'percentage' | 'fixed') === 'percentage'
          ? 'PERCENTAGE'
          : 'FIXED',
      value: parseFloat(formData.get('value') as string),
      minimumAmount: formData.get('minimumAmount')
        ? parseFloat(formData.get('minimumAmount') as string)
        : undefined,
      maxUses: formData.get('maxUses')
        ? parseInt(formData.get('maxUses') as string)
        : undefined,
      validFrom: formData.get('validFrom') as string,
      validUntil: formData.get('validUntil') as string,
    };

    createMutation.mutate(data, {
      onSuccess: () => {
        setIsCreateDialogOpen(false);
      },
    });
  };

  // Calculate summary stats
  const activeCoupons = coupons.filter(
    c => c.isActive && new Date(c.validUntil) > new Date()
  ).length;
  const totalUsage = coupons.reduce((sum, c) => sum + c.currentUses, 0);
  const expiredCoupons = coupons.filter(
    c => new Date(c.validUntil) < new Date()
  ).length;

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Coupons Management</h1>
          <p className="text-muted-foreground">
            Create and manage discount coupons for your store
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <IconPlus className="mr-1 h-4 w-4" />
              Create Coupon
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Coupon</DialogTitle>
              <DialogDescription>
                Set up a new discount coupon for your customers
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateCoupon} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="code">Coupon Code</Label>
                  <div className="flex gap-2">
                    <Input
                      id="code"
                      name="code"
                      placeholder="Enter coupon code"
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={e => {
                        const input = (e.target as HTMLElement)
                          .closest('.flex')
                          ?.querySelector('input') as HTMLInputElement;
                        if (input) input.value = generateCouponCode();
                      }}
                    >
                      Generate
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="name">Coupon Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="e.g., Black Friday Sale"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe what this coupon is for"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Discount Type</Label>
                  <Select name="type" defaultValue="percentage">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="value">Discount Value</Label>
                  <Input
                    id="value"
                    name="value"
                    type="number"
                    step="0.01"
                    placeholder="10 or 1000"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minimumAmount">Minimum Order Amount</Label>
                  <Input
                    id="minimumAmount"
                    name="minimumAmount"
                    type="number"
                    step="0.01"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <Label htmlFor="maxUses">Maximum Uses</Label>
                  <Input
                    id="maxUses"
                    name="maxUses"
                    type="number"
                    placeholder="Optional (unlimited if empty)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="validFrom">Valid From</Label>
                  <Input
                    id="validFrom"
                    name="validFrom"
                    type="datetime-local"
                    defaultValue={new Date().toISOString().slice(0, 16)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="validUntil">Valid Until</Label>
                  <Input
                    id="validUntil"
                    name="validUntil"
                    type="datetime-local"
                    required
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create Coupon'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Coupons</CardTitle>
            <IconTicket className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{coupons.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Coupons
            </CardTitle>
            <IconCheck className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCoupons}</div>
            <div className="text-muted-foreground text-xs">
              Currently available
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
            <IconPercentage className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsage}</div>
            <div className="text-muted-foreground text-xs">Times used</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <IconX className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expiredCoupons}</div>
            <div className="text-muted-foreground text-xs">
              Past expiry date
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <div className="relative">
                <IconSearch className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
                <Input
                  placeholder="Search coupons..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Coupons Table */}
      <Card>
        <CardHeader>
          <CardTitle>Coupons</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Valid Period</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map(coupon => (
                  <TableRow key={coupon.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-medium">
                          {coupon.code}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(coupon.code)}
                        >
                          <IconCopy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{coupon.name}</div>
                        {coupon.description && (
                          <div className="text-muted-foreground max-w-xs truncate text-sm">
                            {coupon.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        {coupon.type === 'PERCENTAGE' ? (
                          <>
                            <IconPercentage className="h-4 w-4" />
                            <span>{coupon.value}</span>
                          </>
                        ) : (
                          <>
                            <IconCurrencyNaira className="h-4 w-4" />
                            <span>{coupon.value}</span>
                          </>
                        )}
                      </div>
                      {coupon.minimumAmount && (
                        <div className="text-muted-foreground text-xs">
                          Min: {formatCurrency(coupon.minimumAmount)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">
                          {coupon.currentUses}
                          {coupon.maxUses ? `/${coupon.maxUses}` : ''} uses
                        </div>
                        {getUsageProgress(coupon)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>
                          {new Date(coupon.validFrom).toLocaleDateString()}
                        </div>
                        <div className="text-muted-foreground">
                          to {new Date(coupon.validUntil).toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(coupon)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {coupons.length === 0 && !isLoading && (
            <div className="text-muted-foreground py-8 text-center">
              No coupons found. Create your first coupon to get started.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Coupon Details Dialog */}
      <Dialog
        open={!!selectedCoupon}
        onOpenChange={() => setSelectedCoupon(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Coupon Details</DialogTitle>
            <DialogDescription>
              Complete information about this coupon
            </DialogDescription>
          </DialogHeader>

          {selectedCoupon && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Code</label>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-lg">
                      {selectedCoupon.code}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(selectedCoupon.code)}
                    >
                      <IconCopy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedCoupon)}</div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Name</label>
                <p className="text-sm">{selectedCoupon.name}</p>
              </div>

              {selectedCoupon.description && (
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <p className="text-sm">{selectedCoupon.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Discount</label>
                  <p className="text-sm">
                    {selectedCoupon.type === 'PERCENTAGE'
                      ? `${selectedCoupon.value}% off`
                      : `${formatCurrency(selectedCoupon.value)} off`}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Minimum Order</label>
                  <p className="text-sm">
                    {selectedCoupon.minimumAmount
                      ? formatCurrency(selectedCoupon.minimumAmount)
                      : 'No minimum'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Usage</label>
                  <p className="text-sm">
                    {selectedCoupon.currentUses}
                    {selectedCoupon.maxUses
                      ? ` of ${selectedCoupon.maxUses}`
                      : ' (unlimited)'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Valid Period</label>
                  <p className="text-sm">
                    {new Date(selectedCoupon.validFrom).toLocaleDateString()} -{' '}
                    {new Date(selectedCoupon.validUntil).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
