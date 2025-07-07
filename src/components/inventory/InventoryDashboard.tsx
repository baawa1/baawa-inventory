"use client";

import { InventoryMetrics } from "@/components/inventory/InventoryMetrics";
import { InventoryCharts } from "@/components/inventory/InventoryCharts";
import { RecentActivity } from "@/components/inventory/RecentActivity";
import { QuickActions } from "@/components/inventory/QuickActions";
import { LowStockWidget } from "@/components/inventory/LowStockWidget";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  emailVerified: boolean;
  image?: string;
}

interface InventoryDashboardProps {
  user: User;
}

export function InventoryDashboard({ user }: InventoryDashboardProps) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          {/* Header Section */}
          <div className="px-4 lg:px-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  Inventory Management
                </h1>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Manage products, suppliers, and stock levels
                </p>
              </div>
              <QuickActions userRole={user.role} />
            </div>
          </div>

          {/* Metrics Cards */}
          <InventoryMetrics />

          {/* Charts Section */}
          <div className="px-4 lg:px-6">
            <InventoryCharts />
          </div>

          {/* Low Stock Widget and Recent Activity */}
          <div className="px-4 lg:px-6">
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
