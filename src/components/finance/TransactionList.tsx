"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IconReceipt } from "@tabler/icons-react";

interface TransactionListProps {
  user: any;
}

export function TransactionList({ user: _user }: TransactionListProps) {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <IconReceipt className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Financial Transactions</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction Management</CardTitle>
          <CardDescription>
            Financial transaction management features are currently under
            development.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This section will include transaction tracking, income/expense
            management, and financial reporting capabilities. Coming soon!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
