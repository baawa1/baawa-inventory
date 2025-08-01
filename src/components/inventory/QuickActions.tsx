'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  IconPlus,
  IconPackage,
  IconUsers,
  IconClipboardCheck,
} from '@tabler/icons-react';
import Link from 'next/link';

interface QuickActionsProps {
  userRole: string;
}

export function QuickActions({ userRole }: QuickActionsProps) {
  const actions = [
    {
      title: 'Add Product',
      description: 'Create new product entry',
      icon: <IconPackage className="size-6" />,
      href: '/dashboard/inventory/products/new',
      roles: ['ADMIN', 'MANAGER', 'STAFF'],
    },
    {
      title: 'Stock Reconciliation',
      description: 'Start inventory count',
      icon: <IconClipboardCheck className="size-6" />,
      href: '/dashboard/inventory/stock-reconciliation/new',
      roles: ['ADMIN', 'MANAGER', 'STAFF'],
    },
    {
      title: 'Add Supplier',
      description: 'Register new supplier',
      icon: <IconUsers className="size-6" />,
      href: '/dashboard/inventory/suppliers/new',
      roles: ['ADMIN', 'MANAGER'],
    },
  ];

  const availableActions = actions.filter(action =>
    action.roles.includes(userRole)
  );

  return (
    <Card className="flex flex-col items-start justify-start gap-2">
      <CardHeader>
        <CardTitle className="flex w-max items-center gap-2">
          <IconPlus className="h-5 w-5" />
          Quick Actions
        </CardTitle>
        <CardDescription>Common inventory management tasks</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {availableActions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              className="flex h-auto flex-col items-center gap-2 p-4"
              asChild
            >
              <Link href={action.href} className="flex flex-row gap-4">
                {action.icon}
                <div>
                  <div className="font-medium">{action.title}</div>
                  <div className="text-muted-foreground text-xs">
                    {action.description}
                  </div>
                </div>
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
