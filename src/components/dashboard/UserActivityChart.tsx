"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";
import { IconUsers } from "@tabler/icons-react";

const chartConfig = {
  logins: {
    label: "User Logins",
    color: "hsl(var(--primary))",
  },
  activeUsers: {
    label: "Active Users",
    color: "hsl(142 76% 36%)",
  },
} satisfies ChartConfig;

// Sample user activity data
const userActivityData = [
  { date: "2024-01-01", logins: 15, activeUsers: 12 },
  { date: "2024-01-02", logins: 22, activeUsers: 18 },
  { date: "2024-01-03", logins: 18, activeUsers: 15 },
  { date: "2024-01-04", logins: 25, activeUsers: 21 },
  { date: "2024-01-05", logins: 19, activeUsers: 16 },
  { date: "2024-01-06", logins: 28, activeUsers: 24 },
  { date: "2024-01-07", logins: 32, activeUsers: 27 },
  { date: "2024-01-08", logins: 21, activeUsers: 18 },
  { date: "2024-01-09", logins: 26, activeUsers: 22 },
  { date: "2024-01-10", logins: 24, activeUsers: 20 },
  { date: "2024-01-11", logins: 17, activeUsers: 14 },
  { date: "2024-01-12", logins: 29, activeUsers: 25 },
  { date: "2024-01-13", logins: 23, activeUsers: 19 },
  { date: "2024-01-14", logins: 31, activeUsers: 26 },
];

interface UserActivityChartProps {
  dateRange?: any;
}

export function UserActivityChart({
  dateRange: _dateRange,
}: UserActivityChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconUsers className="h-5 w-5" />
          User Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={userActivityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                }}
              />
              <YAxis />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value: any) => {
                      return new Date(value).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      });
                    }}
                    formatter={(value: any, name: string) => [
                      value,
                      name === "logins" ? "User Logins" : "Active Users",
                    ]}
                  />
                }
              />
              <Line
                type="monotone"
                dataKey="logins"
                stroke="var(--color-logins)"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="activeUsers"
                stroke="var(--color-activeUsers)"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Legend */}
        <div className="flex justify-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: "var(--color-logins)" }}
            ></div>
            <span className="text-sm text-muted-foreground">User Logins</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: "var(--color-activeUsers)" }}
            ></div>
            <span className="text-sm text-muted-foreground">Active Users</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
