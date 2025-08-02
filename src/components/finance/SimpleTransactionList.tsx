'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IconRefresh } from '@tabler/icons-react';

interface SimpleTransactionListProps {
  user: any;
  filters?: {
    dateFrom?: string;
    dateTo?: string;
    type?: string;
    paymentMethod?: string;
  };
}

export function SimpleTransactionList({
  user: _user,
  filters = {},
}: SimpleTransactionListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Recent Transactions
          <Button variant="outline" size="sm">
            <IconRefresh className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="py-8 text-center">
          <p className="text-muted-foreground">
            Transaction list will be implemented here with real data.
          </p>
          <p className="text-muted-foreground mt-2 text-sm">
            Filters: {JSON.stringify(filters)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
