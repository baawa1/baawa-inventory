"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";

interface BudgetCategory {
  id: string;
  name: string;
  budget: number;
  spent: number;
  remaining: number;
  utilization: number;
  status: "on-track" | "warning" | "over-budget";
}

interface BudgetOverviewProps {
  categories: BudgetCategory[];
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  overallUtilization: number;
}

export function BudgetOverview({
  categories,
  totalBudget,
  totalSpent,
  totalRemaining,
  overallUtilization,
}: BudgetOverviewProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "on-track":
        return "text-green-600";
      case "warning":
        return "text-yellow-600";
      case "over-budget":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "on-track":
        return <CheckCircle className="h-4 w-4" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4" />;
      case "over-budget":
        return <TrendingDown className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Budget Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Overview</CardTitle>
          <CardDescription>
            Track your budget utilization across all categories
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Budget</p>
              <p className="text-2xl font-bold">
                {formatCurrency(totalBudget)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Spent</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(totalSpent)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Remaining</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(totalRemaining)}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Utilization</span>
              <span>{overallUtilization.toFixed(1)}%</span>
            </div>
            <Progress value={overallUtilization} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
          <CardDescription>
            Budget utilization by expense category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categories.map((category) => (
              <div key={category.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{category.name}</span>
                    <Badge
                      variant="outline"
                      className={getStatusColor(category.status)}
                    >
                      {getStatusIcon(category.status)}
                      <span className="ml-1 capitalize">
                        {category.status.replace("-", " ")}
                      </span>
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {formatCurrency(category.spent)} /{" "}
                      {formatCurrency(category.budget)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {category.utilization.toFixed(1)}% used
                    </p>
                  </div>
                </div>
                <Progress value={category.utilization} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
