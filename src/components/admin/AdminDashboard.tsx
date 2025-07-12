"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserManagement } from "./UserManagement";
import { PendingUsersManagement } from "./PendingUsersManagement";
import { DeactivatedUsersManagement } from "@/components/admin/DeactivatedUsersManagement";

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("users");

  return (
    <div data-testid="admin-dashboard" className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground">
          Manage users, pending approvals, and deactivated accounts
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">Active Users</TabsTrigger>
          <TabsTrigger value="pending">Pending Approvals</TabsTrigger>
          <TabsTrigger value="deactivated">Deactivated Users</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <UserManagement />
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <PendingUsersManagement />
        </TabsContent>

        <TabsContent value="deactivated" className="space-y-4">
          <DeactivatedUsersManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
