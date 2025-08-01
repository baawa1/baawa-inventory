'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  IconSearch,
  IconUser,
  IconMail,
  IconPhone,
  IconEye,
  IconShoppingBag,
  IconCalendar,
  IconCurrencyNaira,
} from '@tabler/icons-react';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { CustomerDetailView } from './CustomerDetailView';

interface CustomerData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  totalSpent: number;
  totalOrders: number;
  lastPurchase: string;
  averageOrderValue: number;
  rank: number;
}

interface User {
  id: string;
  role: string;
  status: string;
}

interface CustomerHistoryListProps {
  user: User;
}

// API function to fetch customers
async function fetchCustomers(): Promise<CustomerData[]> {
  const response = await fetch('/api/pos/customers');
  if (!response.ok) {
    throw new Error('Failed to fetch customers');
  }
  return response.json();
}

export function CustomerHistoryList({ user }: CustomerHistoryListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(
    null
  );
  const [customerDetailOpen, setCustomerDetailOpen] = useState(false);

  const {
    data: customers = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['customers'],
    queryFn: fetchCustomers,
  });

  // Filter customers based on search term
  const filteredCustomers = customers.filter(
    customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm)
  );

  if (error) {
    toast.error('Failed to load customers');
  }

  const handleViewCustomer = (customer: CustomerData) => {
    setSelectedCustomer(customer);
    setCustomerDetailOpen(true);
  };

  // Calculate summary stats
  const totalCustomers = customers.length;
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const averageOrderValue =
    customers.length > 0
      ? customers.reduce((sum, c) => sum + c.averageOrderValue, 0) /
        customers.length
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Customer History</h1>
          <p className="text-muted-foreground">
            View and manage all customers and their purchase history
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="rounded-lg bg-blue-100 p-2">
                <IconUser className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Total Customers
                </p>
                <p className="text-2xl font-bold">{totalCustomers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="rounded-lg bg-green-100 p-2">
                <IconCurrencyNaira className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Total Revenue
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(totalRevenue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="rounded-lg bg-purple-100 p-2">
                <IconShoppingBag className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Avg Order Value
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(averageOrderValue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <IconSearch className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customer List */}
      <Card>
        <CardHeader>
          <CardTitle>All Customers ({filteredCustomers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center">
              <div className="border-primary mx-auto h-8 w-8 animate-spin border-b-2"></div>
              <p className="text-muted-foreground mt-2">Loading customers...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="py-8 text-center">
              <IconUser className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
              <p className="text-muted-foreground">
                {searchTerm
                  ? 'No customers found matching your search'
                  : 'No customers found'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-right">Total Spent</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Avg Order</TableHead>
                  <TableHead>Last Purchase</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map(customer => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <Badge variant="outline">#{customer.rank}</Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-muted-foreground text-sm">
                          {customer.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {customer.email && (
                          <div className="flex items-center gap-1 text-sm">
                            <IconMail className="h-3 w-3" />
                            {customer.email}
                          </div>
                        )}
                        {customer.phone && (
                          <div className="flex items-center gap-1 text-sm">
                            <IconPhone className="h-3 w-3" />
                            {customer.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(customer.totalSpent)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{customer.totalOrders}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(customer.averageOrderValue)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <IconCalendar className="h-3 w-3" />
                        {format(
                          new Date(customer.lastPurchase),
                          'MMM dd, yyyy'
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog
                        open={
                          customerDetailOpen &&
                          selectedCustomer?.id === customer.id
                        }
                        onOpenChange={open => {
                          setCustomerDetailOpen(open);
                          if (!open) setSelectedCustomer(null);
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewCustomer(customer)}
                          >
                            <IconEye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Customer Details</DialogTitle>
                          </DialogHeader>
                          {selectedCustomer && (
                            <CustomerDetailView
                              customer={selectedCustomer}
                              user={user}
                            />
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
