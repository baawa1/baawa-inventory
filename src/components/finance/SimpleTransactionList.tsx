"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IconEye, IconRefresh } from "@tabler/icons-react";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";

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
  user,
  filters = {},
}: SimpleTransactionListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Recent Transactions
          <Button variant="outline" size="sm">
            <IconRefresh className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            Transaction list will be implemented here with real data.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Filters: {JSON.stringify(filters)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
