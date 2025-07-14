"use client";

import { InventoryMetrics } from "@/components/inventory/InventoryMetrics";
import { InventoryCharts } from "@/components/inventory/InventoryCharts";
import { RecentActivity } from "@/components/inventory/RecentActivity";
import { QuickActions } from "@/components/inventory/QuickActions";
import { LowStockWidget } from "@/components/inventory/LowStockWidget";

interface User {
  id: string;
  email?: string | null;
  name?: string | null;
  role: string;
  status: string;
  isEmailVerified: boolean;
}

interface InventoryDashboardProps {
  user: User;
}

export function InventoryDashboard({ user }: InventoryDashboardProps) {
  return (
    <div data-testid="dashboard" className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          {/* Header Section */}

          <QuickActions userRole={user.role} />

          {/* Metrics Cards */}
          <InventoryMetrics />

          {/* Charts Section */}
          <div>
            <InventoryCharts />
          </div>

          {/* Low Stock Widget and Recent Activity */}
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LowStockWidget />
              <RecentActivity />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
