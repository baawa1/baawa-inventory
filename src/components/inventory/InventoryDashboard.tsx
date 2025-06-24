"use client";

import { SiteHeader } from "@/components/site-header";
import { InventoryMetrics } from "./InventoryMetrics";
import { InventoryCharts } from "./InventoryCharts";
import { RecentActivity } from "./RecentActivity";
import { QuickActions } from "./QuickActions";

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
    <>
      <SiteHeader />
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

            {/* Recent Activity */}
            <RecentActivity />
          </div>
        </div>
      </div>
    </>
  );
}
