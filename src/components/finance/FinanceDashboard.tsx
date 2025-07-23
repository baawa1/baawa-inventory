"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IconBuilding } from "@tabler/icons-react";

interface FinanceDashboardProps {
  user: any;
}

export function FinanceDashboard({ user: _user }: FinanceDashboardProps) {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <IconBuilding className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Finance Dashboard</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Finance Management</CardTitle>
          <CardDescription>
            Finance management features are currently under development.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This section will include financial tracking, income/expense
            management, and financial reporting capabilities. Coming soon!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
