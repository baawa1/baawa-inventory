'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  IconFilter,
  IconEye,
  IconDownload,
  IconRefresh,
  IconCash,
  IconCreditCard,
  IconBuildingBank,
  IconDeviceMobile,
} from '@tabler/icons-react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency } from '@/lib/utils';

interface Transaction {
  id: string;
  transactionNumber: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  transactionType: string;
  createdAt: string;
  staffName: string;
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
}

interface TransactionListProps {
  user: any;
  filters?: {
    dateFrom?: string;
    dateTo?: string;
    type?: string;
    paymentMethod?: string;
  };
}

const paymentMethodIcons = {
  cash: IconCash,
  pos: IconCreditCard,
  bank_transfer: IconBuildingBank,
  mobile_money: IconDeviceMobile,
};

const paymentMethodLabels = {
  cash: 'Cash',
  pos: 'POS Machine',
  bank_transfer: 'Bank Transfer',
  mobile_money: 'Mobile Money',
};

export function TransactionList({
  user: _user,
  filters = {},
}: TransactionListProps) {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Build query parameters
  const queryParams = useMemo(() => {
    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: pageSize.toString(),
    });

    if (search) params.append('search', search);
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    if (filters.type && filters.type !== 'all')
      params.append('type', filters.type);
    if (filters.paymentMethod && filters.paymentMethod !== 'all') {
      params.append('paymentMethod', filters.paymentMethod);
    }

    return params.toString();
  }, [search, currentPage, pageSize, filters]);

  // Fetch transactions
  const {
    data: transactionData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['transactions', queryParams],
    queryFn: async () => {
      const response = await fetch(`/api/sales?${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      return response.json();
    },
  });

  const transactions = transactionData?.data || [];
  const pagination = transactionData?.pagination || {};

  // Handle search
  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle page size change
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  // Export transactions
  const handleExport = () => {
    const csvData = transactions.map((t: Transaction) => ({
      'Transaction ID': t.transactionNumber,
      Date: format(new Date(t.createdAt), 'yyyy-MM-dd HH:mm:ss'),
      Customer: t.customerName || '',
      Phone: t.customerPhone || '',
      Email: t.customerEmail || '',
      Amount: t.totalAmount,
      'Payment Method':
        paymentMethodLabels[
          t.paymentMethod as keyof typeof paymentMethodLabels
        ] || t.paymentMethod,
      Status: t.paymentStatus,
      Staff: t.staffName,
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map((row: any) => Object.values(row).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-red-600">Error loading transactions</p>
            <Button
              onClick={() => refetch()}
              variant="outline"
              className="mt-2"
            >
              <IconRefresh className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Transactions</h2>
          <p className="text-muted-foreground">
            View and manage all financial transactions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <IconRefresh className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={handleExport} variant="outline" size="sm">
            <IconDownload className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconFilter className="h-5 w-5" />
            Search & Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search transactions..."
                value={search}
                onChange={e => handleSearch(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">Page Size:</span>
              <Select
                value={pageSize.toString()}
                onValueChange={value => handlePageSizeChange(parseInt(value))}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions ({pagination.totalItems || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center">
              <div className="border-primary mx-auto h-8 w-8 animate-spin border-b-2"></div>
              <p className="text-muted-foreground mt-2">
                Loading transactions...
              </p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">No transactions found</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Staff</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction: Transaction) => {
                    const PaymentIcon =
                      paymentMethodIcons[
                        transaction.paymentMethod as keyof typeof paymentMethodIcons
                      ] || IconCash;

                    return (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-mono text-sm">
                          {transaction.transactionNumber}
                        </TableCell>
                        <TableCell>
                          {format(
                            new Date(transaction.createdAt),
                            'MMM dd, yyyy HH:mm'
                          )}
                        </TableCell>
                        <TableCell>
                          {transaction.customerName || '-'}
                          {transaction.customerPhone && (
                            <div className="text-muted-foreground text-xs">
                              {transaction.customerPhone}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(transaction.totalAmount)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <PaymentIcon className="h-4 w-4" />
                            <span>
                              {paymentMethodLabels[
                                transaction.paymentMethod as keyof typeof paymentMethodLabels
                              ] || transaction.paymentMethod}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              transaction.paymentStatus === 'completed'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {transaction.paymentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>{transaction.staffName}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <IconEye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-muted-foreground text-sm">
                    Showing {(currentPage - 1) * pageSize + 1} to{' '}
                    {Math.min(currentPage * pageSize, pagination.totalItems)} of{' '}
                    {pagination.totalItems} results
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
