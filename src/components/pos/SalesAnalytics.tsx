'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DateRangePickerWithPresets } from '@/components/ui/date-range-picker-with-presets';
import {
  IconTrendingUp,
  IconTrendingDown,
  IconMinus,
  IconEye,
} from '@tabler/icons-react';
import { formatCurrency } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { DashboardTableLayout } from '@/components/layouts/DashboardTableLayout';
import { DashboardTableColumn } from '@/components/layouts/DashboardColumnCustomizer';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface User {
  id: string;
  email?: string | null;
  name?: string | null;
  role: string;
  status: string;
  isEmailVerified: boolean;
}

interface SalesAnalyticsProps {
  user: User;
}

interface SalesData {
  date: string;
  orders: number;
  grossSales: number;
  returns: number;
  coupons: number;
  netSales: number;
  taxes: number;
  shipping: number;
  totalSales: number;
}

interface SalesAnalyticsResponse {
  totalSales: number;
  totalOrders: number;
  totalCustomers: number;
  averageOrderValue: number;
  salesByPeriod: SalesData[];
  recentTransactions: Array<{
    id: number;
    transactionNumber: string;
    customerName: string | null;
    totalAmount: number;
    createdAt: string;
  }>;
}

async function fetchSalesAnalytics(
  dateRange?: DateRange
): Promise<SalesAnalyticsResponse> {
  const params = new URLSearchParams();

  if (dateRange?.from) {
    params.append('fromDate', dateRange.from.toISOString().split('T')[0]);
  }
  if (dateRange?.to) {
    params.append('toDate', dateRange.to.toISOString().split('T')[0]);
  }

  const response = await fetch(`/api/pos/analytics/overview?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch sales analytics');
  }
  return response.json();
}

export function SalesAnalytics({ user: _ }: SalesAnalyticsProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // Start of current month
    to: new Date(), // Today
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalItems: 0,
  });

  const {
    data: analyticsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['sales-analytics', dateRange?.from, dateRange?.to],
    queryFn: () => fetchSalesAnalytics(dateRange),
    enabled: !!dateRange?.from && !!dateRange?.to,
  });

  console.log('Analytics data:', analyticsData);
  console.log('Is loading:', isLoading);
  console.log('Error:', error);

  if (error) {
    toast.error('Failed to load sales analytics data');
  }

  const salesData = analyticsData?.salesByPeriod || [];

  // Add sample data for testing if no real data
  const sampleData: SalesData[] = [
    {
      date: '2024-01-01',
      orders: 5,
      grossSales: 15000,
      returns: 0,
      coupons: 500,
      netSales: 14500,
      taxes: 725,
      shipping: 0,
      totalSales: 15225,
    },
    {
      date: '2024-01-02',
      orders: 8,
      grossSales: 24000,
      returns: 2000,
      coupons: 1000,
      netSales: 21000,
      taxes: 1050,
      shipping: 500,
      totalSales: 22550,
    },
  ];

  // Use sample data if no real data is available
  const dataToUse = salesData.length > 0 ? salesData : sampleData;

  const filteredData = useMemo(() => {
    console.log('Sales data:', dataToUse);
    console.log('Search term:', searchTerm);
    const filtered = dataToUse.filter(item =>
      item.date.toLowerCase().includes(searchTerm.toLowerCase())
    );
    console.log('Filtered data:', filtered);
    return filtered;
  }, [dataToUse, searchTerm]);

  // Add debugging for pagination
  const paginatedData = useMemo(() => {
    const startIndex = (pagination.page - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    const paginated = filteredData.slice(startIndex, endIndex);
    console.log('Paginated data:', paginated);
    console.log('Pagination state:', pagination);
    return paginated;
  }, [filteredData, pagination]);

  const summaryStats = useMemo(() => {
    if (!analyticsData) {
      return {
        orders: 0,
        grossSales: 0,
        returns: 0,
        coupons: 0,
        netSales: 0,
        taxes: 0,
        shipping: 0,
        totalSales: 0,
        grossSalesChange: 0,
        returnsChange: 0,
        couponsChange: 0,
        netSalesChange: 0,
        taxesChange: 0,
        shippingChange: 0,
        totalSalesChange: 0,
      };
    }

    const total = dataToUse.reduce(
      (acc, item) => ({
        orders: acc.orders + item.orders,
        grossSales: acc.grossSales + item.grossSales,
        returns: acc.returns + item.returns,
        coupons: acc.coupons + item.coupons,
        netSales: acc.netSales + item.netSales,
        taxes: acc.taxes + item.taxes,
        shipping: acc.shipping + item.shipping,
        totalSales: acc.totalSales + item.totalSales,
      }),
      {
        orders: 0,
        grossSales: 0,
        returns: 0,
        coupons: 0,
        netSales: 0,
        taxes: 0,
        shipping: 0,
        totalSales: 0,
      }
    );

    // Calculate change percentages (simplified - in real implementation, compare with previous period)
    return {
      ...total,
      grossSalesChange: 0, // Would calculate based on previous period
      returnsChange: 0,
      couponsChange: 0,
      netSalesChange: 0,
      taxesChange: 0,
      shippingChange: 0,
      totalSalesChange: 0,
    };
  }, [dataToUse, analyticsData]);

  const getChangeBadge = (change: number) => {
    if (change > 0) {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          <IconTrendingUp className="mr-1 h-3 w-3" />+{change.toFixed(0)}%
        </Badge>
      );
    } else if (change < 0) {
      return (
        <Badge variant="secondary" className="bg-red-100 text-red-800">
          <IconTrendingDown className="mr-1 h-3 w-3" />
          {change.toFixed(0)}%
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-800">
          <IconMinus className="mr-1 h-3 w-3" />
          0%
        </Badge>
      );
    }
  };

  const handleDateRangeChange = (newDateRange: DateRange | undefined) => {
    setDateRange(newDateRange);
  };

  // Table columns configuration
  const columns: DashboardTableColumn[] = useMemo(
    () => [
      {
        key: 'date',
        label: 'Date',
        sortable: true,
        defaultVisible: true,
        required: true,
      },
      {
        key: 'orders',
        label: 'Orders',
        sortable: true,
        defaultVisible: true,
      },
      {
        key: 'grossSales',
        label: 'Gross Sales',
        sortable: true,
        defaultVisible: true,
      },
      {
        key: 'returns',
        label: 'Returns',
        sortable: true,
        defaultVisible: true,
      },
      {
        key: 'coupons',
        label: 'Coupons',
        sortable: true,
        defaultVisible: true,
      },
      {
        key: 'netSales',
        label: 'Net Sales',
        sortable: true,
        defaultVisible: true,
      },
      {
        key: 'taxes',
        label: 'Taxes',
        sortable: true,
        defaultVisible: true,
      },
      {
        key: 'shipping',
        label: 'Shipping',
        sortable: true,
        defaultVisible: true,
      },
      {
        key: 'totalSales',
        label: 'Total Sales',
        sortable: true,
        defaultVisible: true,
      },
      {
        key: 'actions',
        label: 'Actions',
        sortable: false,
        defaultVisible: true,
      },
    ],
    []
  );

  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    columns.filter(col => col.defaultVisible).map(col => col.key)
  );

  // Render cell function
  const renderCell = (item: SalesData, columnKey: string) => {
    switch (columnKey) {
      case 'date':
        return new Date(item.date).toLocaleDateString();
      case 'orders':
        return item.orders.toString();
      case 'grossSales':
        return formatCurrency(item.grossSales);
      case 'returns':
        return formatCurrency(item.returns);
      case 'coupons':
        return formatCurrency(item.coupons);
      case 'netSales':
        return formatCurrency(item.netSales);
      case 'taxes':
        return formatCurrency(item.taxes);
      case 'shipping':
        return formatCurrency(item.shipping);
      case 'totalSales':
        return formatCurrency(item.totalSales);
      case 'actions':
        return (
          <div className="flex items-center gap-2">
            <Link href={`/pos/daily-orders/${item.date}`}>
              <Button variant="ghost" size="sm">
                <IconEye className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        );
      default:
        return null;
    }
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handlePageSizeChange = (size: number) => {
    setPagination(prev => ({ ...prev, limit: size, page: 1 }));
  };

  // Summary cards and date range filter content
  const beforeFiltersContent = (
    <div className="space-y-6">
      {/* Header with Date Range Filter */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Revenue</h2>
        </div>
        <div className="flex items-center gap-3">
          <DateRangePickerWithPresets
            date={dateRange}
            onDateChange={handleDateRangeChange}
            placeholder="Select date range"
            className="w-[300px]"
          />
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-7">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Gross sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summaryStats.grossSales)}
            </div>
            <div className="mt-2 flex items-center">
              {getChangeBadge(summaryStats.grossSalesChange)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Returns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summaryStats.returns)}
            </div>
            <div className="mt-2 flex items-center">
              {getChangeBadge(summaryStats.returnsChange)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Coupons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summaryStats.coupons)}
            </div>
            <div className="mt-2 flex items-center">
              {getChangeBadge(summaryStats.couponsChange)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Net sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summaryStats.netSales)}
            </div>
            <div className="mt-2 flex items-center">
              {getChangeBadge(summaryStats.netSalesChange)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Taxes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summaryStats.taxes)}
            </div>
            <div className="mt-2 flex items-center">
              {getChangeBadge(summaryStats.taxesChange)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Shipping</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summaryStats.shipping)}
            </div>
            <div className="mt-2 flex items-center">
              {getChangeBadge(summaryStats.shippingChange)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summaryStats.totalSales)}
            </div>
            <div className="mt-2 flex items-center">
              {getChangeBadge(summaryStats.totalSalesChange)}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <>
      <DashboardTableLayout
        title="Sales Analytics"
        description="Analyze sales performance and business insights"
        searchPlaceholder="Search by date..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        isSearching={false}
        filters={[]}
        filterValues={{}}
        onFilterChange={() => {}}
        onResetFilters={() => {}}
        beforeFiltersContent={beforeFiltersContent}
        columns={columns}
        visibleColumns={visibleColumns}
        onColumnsChange={setVisibleColumns}
        columnCustomizerKey="sales-analytics-columns"
        data={paginatedData}
        renderCell={renderCell}
        pagination={{
          page: pagination.page,
          limit: pagination.limit,
          totalPages: Math.ceil(filteredData.length / pagination.limit),
          totalItems: filteredData.length,
        }}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        isLoading={isLoading}
        error={error?.message}
        emptyStateMessage="No revenue data found for the selected date range"
        additionalContent={
          <div className="text-muted-foreground mt-4 text-sm">
            <p>Click on any date row to view detailed orders for that day.</p>
          </div>
        }
      />
    </>
  );
}
