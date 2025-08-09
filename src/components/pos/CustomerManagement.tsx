'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  IconEye,
  IconTrophy,
  IconMail,
  IconPhone,
  IconCash,
  IconCreditCard,
  IconBuildingBank,
  IconDeviceMobile,
  IconPrinter,
  IconSearch,
  IconFilter,
  IconChevronLeft,
  IconChevronRight,
} from '@tabler/icons-react';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ReceiptPrinter } from './ReceiptPrinter';

interface User {
  id: string;
  email?: string | null;
  name?: string | null;
  role: string;
  status: string;
  isEmailVerified: boolean;
}

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
  firstPurchase: string;
  daysSinceLastPurchase: number;
  customerLifetimeValue: number;
  purchaseFrequency: number;
}

interface CustomerOrder {
  id: number;
  transactionNumber: string;
  timestamp: Date;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  staffName: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  discount: number;
  total: number;
  notes?: string | null;
  items: {
    id: number;
    name: string;
    sku: string;
    price: number;
    quantity: number;
    total: number;
    coupon?: {
      id: number;
      code: string;
      name: string;
      type: string;
      value: number;
    } | null;
  }[];
}

interface CustomerManagementProps {
  user: User;
}

const paymentMethodIcons = {
  cash: IconCash,
  pos: IconCreditCard,
  bank_transfer: IconBuildingBank,
  mobile_money: IconDeviceMobile,
};

const ITEMS_PER_PAGE = 10;

async function fetchCustomerAnalytics(): Promise<{
  customers: CustomerData[];
  summary: {
    totalCustomers: number;
    totalRevenue: number;
    averageOrderValue: number;
    customerLifetimeValue: number;
    newCustomers: number;
    returningCustomers: number;
    churnedCustomers: number;
    retentionRate: number;
  };
  customerSegments: {
    vip: number;
    regular: number;
    occasional: number;
    inactive: number;
  };
}> {
  const response = await fetch('/api/pos/analytics/customers');
  if (!response.ok) {
    throw new Error('Failed to fetch customer analytics');
  }

  const result = await response.json();
  if (result.success && result.data) {
    return result.data;
  }

  throw new Error('Invalid response format from customer analytics API');
}

async function fetchCustomerOrders(
  customerEmail: string
): Promise<CustomerOrder[]> {
  const response = await fetch(
    `/api/pos/analytics/customers/${encodeURIComponent(customerEmail)}/orders`
  );
  if (!response.ok) {
    throw new Error('Failed to fetch customer orders');
  }

  const result = await response.json();
  if (result.success && result.data) {
    return result.data.map((order: any) => ({
      ...order,
      timestamp: new Date(order.timestamp),
    }));
  }

  throw new Error('Invalid response format from customer orders API');
}

export function CustomerManagement({ user: _user }: CustomerManagementProps) {
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const {
    data: analyticsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['customer-analytics'],
    queryFn: fetchCustomerAnalytics,
  });

  const {
    data: customerOrders,
    isLoading: ordersLoading,
    error: ordersError,
  } = useQuery({
    queryKey: ['customer-orders', selectedCustomer?.email],
    queryFn: () =>
      selectedCustomer
        ? fetchCustomerOrders(selectedCustomer.email)
        : Promise.resolve([]),
    enabled: !!selectedCustomer,
  });

  if (error) {
    toast.error('Failed to load customer data');
  }

  if (ordersError) {
    toast.error('Failed to load customer orders');
  }

  // Filter and paginate customers
  const filteredCustomers =
    analyticsData?.customers.filter(customer => {
      const matchesSearch =
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'vip' &&
          customer.rank <=
            Math.ceil((analyticsData?.customers.length || 0) * 0.1)) ||
        (statusFilter === 'regular' &&
          customer.rank >
            Math.ceil((analyticsData?.customers.length || 0) * 0.1) &&
          customer.rank <=
            Math.ceil((analyticsData?.customers.length || 0) * 0.5)) ||
        (statusFilter === 'occasional' &&
          customer.rank >
            Math.ceil((analyticsData?.customers.length || 0) * 0.5));

      return matchesSearch && matchesStatus;
    }) || [];

  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Render customer item
  const renderCustomerItem = (customer: CustomerData) => {
    const isSelected = selectedCustomer?.id === customer.id;

    return (
      <div
        key={customer.id}
        className={`cursor-pointer rounded-lg border p-3 transition-colors ${
          isSelected
            ? 'bg-primary/10 border-primary'
            : 'bg-card hover:bg-accent/50 border-border'
        }`}
        onClick={() => setSelectedCustomer(customer)}
      >
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {customer.rank === 1 ? (
                <IconTrophy className="mr-1 h-3 w-3 text-yellow-500" />
              ) : null}
              #{customer.rank}
            </Badge>
            <Badge
              variant="secondary"
              className={
                customer.rank <=
                Math.ceil((analyticsData?.customers.length || 0) * 0.1)
                  ? 'bg-yellow-100 text-yellow-800'
                  : customer.rank <=
                      Math.ceil((analyticsData?.customers.length || 0) * 0.5)
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
              }
            >
              {customer.rank <=
              Math.ceil((analyticsData?.customers.length || 0) * 0.1)
                ? 'VIP'
                : customer.rank <=
                    Math.ceil((analyticsData?.customers.length || 0) * 0.5)
                  ? 'Regular'
                  : 'Occasional'}
            </Badge>
          </div>
          <div className="text-muted-foreground text-sm">
            {new Date(customer.lastPurchase).toLocaleDateString()}
          </div>
        </div>

        <div className="mb-2">
          <div className="font-medium">{customer.name}</div>
          <div className="text-muted-foreground text-sm">{customer.email}</div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div>{customer.totalOrders} orders</div>
          <div className="font-medium">
            {formatCurrency(customer.totalSpent)}
          </div>
        </div>
      </div>
    );
  };

  // Render customer order details
  const renderCustomerDetails = () => {
    if (!selectedCustomer) {
      return (
        <div className="text-muted-foreground flex h-full items-center justify-center">
          <div className="text-center">
            <IconEye className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p>Select a customer to view their order history</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Customer Header */}
        <div className="border-b pb-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="bg-primary text-primary-foreground rounded-md px-3 py-1">
              <span className="font-medium">
                #{selectedCustomer.rank} - {selectedCustomer.name}
              </span>
            </div>
            <Badge
              variant="secondary"
              className={
                selectedCustomer.rank <=
                Math.ceil((analyticsData?.customers.length || 0) * 0.1)
                  ? 'bg-yellow-100 text-yellow-800'
                  : selectedCustomer.rank <=
                      Math.ceil((analyticsData?.customers.length || 0) * 0.5)
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
              }
            >
              {selectedCustomer.rank <=
              Math.ceil((analyticsData?.customers.length || 0) * 0.1)
                ? 'VIP Customer'
                : selectedCustomer.rank <=
                    Math.ceil((analyticsData?.customers.length || 0) * 0.5)
                  ? 'Regular Customer'
                  : 'Occasional Customer'}
            </Badge>
          </div>

          <div className="text-muted-foreground mb-2 text-sm">
            Customer since{' '}
            {new Date(selectedCustomer.firstPurchase).toLocaleDateString()}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Total Spent</div>
              <div className="font-medium">
                {formatCurrency(selectedCustomer.totalSpent)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Total Orders</div>
              <div className="font-medium">{selectedCustomer.totalOrders}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Avg Order Value</div>
              <div className="font-medium">
                {formatCurrency(selectedCustomer.averageOrderValue)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Last Purchase</div>
              <div className="font-medium">
                {selectedCustomer.daysSinceLastPurchase} days ago
              </div>
            </div>
          </div>

          <div className="mt-3 space-y-1 text-sm">
            {selectedCustomer.email && (
              <div className="flex items-center gap-2">
                <IconMail className="h-3 w-3" />
                {selectedCustomer.email}
              </div>
            )}
            {selectedCustomer.phone && (
              <div className="flex items-center gap-2">
                <IconPhone className="h-3 w-3" />
                {selectedCustomer.phone}
              </div>
            )}
          </div>
        </div>

        {/* Order History */}
        <div>
          <h3 className="mb-3 font-medium">Order History</h3>
          {ordersLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2"></div>
                <p className="text-muted-foreground text-sm">
                  Loading orders...
                </p>
              </div>
            </div>
          ) : customerOrders && customerOrders.length > 0 ? (
            <div className="space-y-3">
              {customerOrders.map(order => {
                const PaymentIcon =
                  paymentMethodIcons[
                    order.paymentMethod as keyof typeof paymentMethodIcons
                  ] || IconCash;

                return (
                  <Collapsible key={order.id} className="w-full">
                    <CollapsibleTrigger asChild>
                      <div className="hover:bg-accent/50 flex w-full cursor-pointer items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-medium">
                              #{order.transactionNumber}
                            </span>
                            <Badge
                              variant="secondary"
                              className={
                                order.paymentStatus === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }
                            >
                              {order.paymentStatus}
                            </Badge>
                          </div>
                          <div className="text-muted-foreground text-sm">
                            {order.items.length} items •{' '}
                            {formatCurrency(order.total)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-muted-foreground flex items-center gap-1 text-sm">
                            <PaymentIcon className="h-3 w-3" />
                            {order.paymentMethod.replace('_', ' ')}
                          </div>
                          <div className="text-muted-foreground text-sm">
                            {format(order.timestamp, 'MMM dd, yyyy')}
                          </div>
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="bg-background space-y-4 rounded-lg border border-t-0 p-4">
                        {/* Order Summary */}
                        <div className="rounded-lg border p-3">
                          <div className="mb-2 flex items-center justify-between">
                            <div className="text-sm font-medium">
                              Order Summary
                            </div>
                            <div className="text-muted-foreground text-sm">
                              {format(order.timestamp, 'MMM dd, yyyy h:mm a')}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">
                                Staff:
                              </span>
                              <span className="ml-2">{order.staffName}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Payment:
                              </span>
                              <span className="ml-2">
                                {order.paymentMethod.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div>
                          <h4 className="mb-2 text-sm font-medium">Items</h4>
                          <div className="divide-border space-y-0 divide-y rounded-lg border">
                            {order.items.map(item => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between p-3"
                              >
                                <div className="flex-1">
                                  <div className="text-sm font-medium">
                                    {item.name}
                                  </div>
                                  <div className="text-muted-foreground text-xs">
                                    SKU: {item.sku}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm">
                                    {item.quantity} x{' '}
                                    {formatCurrency(item.price)}
                                  </div>
                                  <div className="text-sm font-medium">
                                    {formatCurrency(item.total)}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Order Totals */}
                        <div className="rounded-lg border p-3">
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Subtotal:</span>
                              <span>{formatCurrency(order.subtotal)}</span>
                            </div>
                            {order.discount > 0 && (
                              <>
                                <div className="flex justify-between text-sm">
                                  <span>Discount:</span>
                                  <span>-{formatCurrency(order.discount)}</span>
                                </div>
                                {/* Show coupon information if any items have coupons */}
                                {order.items.some(item => item.coupon) && (
                                  <div className="bg-muted mt-2 rounded-md p-2">
                                    <div className="text-muted-foreground mb-1 text-sm font-medium">
                                      Applied Coupon:
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        {
                                          order.items.find(item => item.coupon)
                                            ?.coupon?.code
                                        }
                                      </Badge>
                                      <span className="text-muted-foreground text-xs">
                                        {
                                          order.items.find(item => item.coupon)
                                            ?.coupon?.name
                                        }
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                            <div className="flex justify-between border-t pt-2 text-sm font-medium">
                              <span>TOTAL</span>
                              <span>{formatCurrency(order.total)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Transaction Notes */}
                        {order.notes && (
                          <div className="rounded-lg border p-3">
                            <h4 className="mb-2 text-sm font-medium">Notes</h4>
                            <div className="bg-muted rounded-md p-2">
                              <p className="text-muted-foreground text-sm">
                                {order.notes}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex justify-end">
                          <ReceiptPrinter
                            receiptData={{
                              id: order.id.toString(),
                              transactionNumber: order.transactionNumber,
                              timestamp: order.timestamp,
                              staffName: order.staffName,
                              customerName: order.customerName,
                              customerPhone: order.customerPhone || '',
                              customerEmail: order.customerEmail,
                              customerAddress:
                                (order as any).customer?.billingAddress || '',
                              customerCity: (order as any).customer?.city || '',
                              customerState:
                                (order as any).customer?.state || '',
                              fees: (order as any).fees || [],
                              items: order.items.map(item => ({
                                id: item.id,
                                name: item.name,
                                sku: item.sku,
                                price: item.price,
                                quantity: item.quantity,
                                category: '',
                              })),
                              subtotal: order.subtotal,
                              discount: order.discount,
                              total: order.total,
                              paymentMethod: order.paymentMethod,
                            }}
                            trigger={
                              <Button variant="outline" size="sm">
                                <IconPrinter className="mr-2 h-3 w-3" />
                                Print Receipt
                              </Button>
                            }
                          />
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          ) : (
            <div className="text-muted-foreground flex items-center justify-center py-8">
              <p>No orders found for this customer</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2"></div>
          <p>Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-49px)] flex-col space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Customer Management
          </h1>
          <p className="text-muted-foreground">
            Manage and view all customers with detailed analytics
          </p>
        </div>
        <div className="text-muted-foreground text-sm">
          {analyticsData?.summary.totalCustomers} total customers
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconFilter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <IconSearch className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="Search customers by name, email, or phone..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                <SelectItem value="vip">VIP Customers</SelectItem>
                <SelectItem value="regular">Regular Customers</SelectItem>
                <SelectItem value="occasional">Occasional Customers</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="flex min-h-0 flex-1 gap-6">
        {/* Left Panel - Customer List */}
        <Card className="flex w-1/2 flex-col overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              Customers ({filteredCustomers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 p-0">
            <div className="h-full overflow-y-auto p-4">
              <div className="space-y-3">
                {paginatedCustomers.map(renderCustomerItem)}
              </div>

              {paginatedCustomers.length === 0 && (
                <div className="text-muted-foreground flex h-32 items-center justify-center">
                  <p>No customers found matching your criteria</p>
                </div>
              )}
            </div>
          </CardContent>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t p-4">
              <div className="flex items-center justify-between">
                <div className="text-muted-foreground text-sm">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage(prev => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                  >
                    <IconChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage(prev => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <IconChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Right Panel - Customer Details */}
        <Card className="flex w-1/2 flex-col overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg">Customer Details</CardTitle>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 overflow-y-auto">
            {renderCustomerDetails()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
