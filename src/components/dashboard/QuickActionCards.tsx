'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  IconPlus,
  IconShoppingCart,
  IconPackages,
  IconUsers,
  IconFileText,
  IconChartBar,
  IconAlertTriangle,
  IconArrowRight,
} from '@tabler/icons-react';
import Link from 'next/link';

interface QuickActionCardsProps {
  userRole: string;
}

export function QuickActionCards({ userRole }: QuickActionCardsProps) {
  const quickActions = [
    {
      title: 'New Sale',
      description: 'Start a new POS transaction',
      icon: <IconShoppingCart className="h-5 w-5" />,
      href: '/pos',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      badge: null,
      roles: ['ADMIN', 'MANAGER', 'STAFF'],
    },
    {
      title: 'Add Product',
      description: 'Add new inventory item',
      icon: <IconPlus className="h-5 w-5" />,
      href: '/inventory/products/add',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      badge: null,
      roles: ['ADMIN', 'MANAGER'],
    },
    {
      title: 'Inventory Check',
      description: 'View low stock items',
      icon: <IconPackages className="h-5 w-5" />,
      href: '/inventory/products?lowStock=true',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      badge: { text: '23 Low', variant: 'destructive' },
      roles: ['ADMIN', 'MANAGER', 'STAFF'],
    },
    {
      title: 'User Management',
      description: 'Manage user accounts',
      icon: <IconUsers className="h-5 w-5" />,
      href: '/admin',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      badge: { text: '5 Pending', variant: 'outline' },
      roles: ['ADMIN'],
    },
    {
      title: 'Sales Report',
      description: 'Generate sales analytics',
      icon: <IconChartBar className="h-5 w-5" />,
      href: '/reports/sales',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      badge: null,
      roles: ['ADMIN', 'MANAGER'],
    },
    {
      title: 'Stock Reconciliation',
      description: 'Perform inventory audit',
      icon: <IconFileText className="h-5 w-5" />,
      href: '/inventory/stock-reconciliations',
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100',
      badge: null,
      roles: ['ADMIN', 'MANAGER'],
    },
  ];

  // Filter actions based on user role
  const availableActions = quickActions.filter(action =>
    action.roles.includes(userRole)
  );

  const getBadgeVariant = (variant: string) => {
    switch (variant) {
      case 'destructive':
        return 'destructive';
      case 'outline':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconAlertTriangle className="h-5 w-5" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {availableActions.map((action, index) => (
            <Link key={index} href={action.href}>
              <Card className="hover:border-primary/20 cursor-pointer border-2 transition-all duration-200 hover:shadow-md">
                <CardContent className="p-4">
                  <div className="mb-3 flex items-start justify-between">
                    <div
                      className={`rounded-lg p-2 ${action.bgColor} ${action.color}`}
                    >
                      {action.icon}
                    </div>
                    {action.badge && (
                      <Badge
                        variant={getBadgeVariant(action.badge.variant) as any}
                        className="text-xs"
                      >
                        {action.badge.text}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">{action.title}</h3>
                    <p className="text-muted-foreground text-xs">
                      {action.description}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center justify-end">
                    <IconArrowRight className="text-muted-foreground group-hover:text-primary h-4 w-4 transition-colors" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Additional Quick Stats */}
        <div className="mt-6 border-t pt-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">₦1.2M</p>
              <p className="text-muted-foreground text-xs">Today's Sales</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">47</p>
              <p className="text-muted-foreground text-xs">Orders Today</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">23</p>
              <p className="text-muted-foreground text-xs">Low Stock</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">5</p>
              <p className="text-muted-foreground text-xs">Pending Users</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
