"use client";

import React, { useState } from "react";
import { useFinancialReports, useGenerateReport } from "@/hooks/api/finance";
import { AppUser } from "@/types/user";

// UI Components
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/ui/page-header";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Icons
import {
  Plus,
  Download,
  Eye,
  FileText,
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
} from "lucide-react";

interface ReportsListProps {
  user: AppUser;
}

export function ReportsList({ user: _user }: ReportsListProps) {
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [reportType, setReportType] = useState("FINANCIAL_SUMMARY");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: reports, isLoading, error } = useFinancialReports();
  const generateReport = useGenerateReport();

  const handleGenerateReport = async () => {
    if (!startDate || !endDate) {
      alert("Please select both start and end dates");
      return;
    }

    try {
      await generateReport.mutateAsync({
        reportType: reportType as any,
        periodStart: startDate,
        periodEnd: endDate,
        includeDetails: true,
      });
      setIsGenerateDialogOpen(false);
    } catch (error) {
      console.error("Error generating report:", error);
    }
  };

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case "FINANCIAL_SUMMARY":
        return <DollarSign className="h-4 w-4" />;
      case "INCOME_STATEMENT":
        return <TrendingUp className="h-4 w-4" />;
      case "EXPENSE_REPORT":
        return <TrendingDown className="h-4 w-4" />;
      case "CASH_FLOW":
        return <BarChart3 className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case "FINANCIAL_SUMMARY":
        return "Financial Summary";
      case "INCOME_STATEMENT":
        return "Income Statement";
      case "EXPENSE_REPORT":
        return "Expense Report";
      case "CASH_FLOW":
        return "Cash Flow";
      default:
        return type;
    }
  };

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-destructive">
                Failed to load financial reports
              </p>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="mt-2"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Financial Reports"
          description="View and generate financial reports and analytics"
        />
        <Dialog
          open={isGenerateDialogOpen}
          onOpenChange={setIsGenerateDialogOpen}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Generate Financial Report</DialogTitle>
              <DialogDescription>
                Select the report type and date range to generate a new
                financial report.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="reportType">Report Type</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FINANCIAL_SUMMARY">
                      Financial Summary
                    </SelectItem>
                    <SelectItem value="INCOME_STATEMENT">
                      Income Statement
                    </SelectItem>
                    <SelectItem value="EXPENSE_REPORT">
                      Expense Report
                    </SelectItem>
                    <SelectItem value="CASH_FLOW">Cash Flow</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsGenerateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerateReport}
                disabled={generateReport.isPending}
              >
                {generateReport.isPending ? "Generating..." : "Generate Report"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Report Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Financial Summary
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Overview</div>
            <p className="text-xs text-muted-foreground">
              Complete financial overview
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Income Statement
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Income</div>
            <p className="text-xs text-muted-foreground">
              Revenue and income analysis
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Expense Report
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Expenses</div>
            <p className="text-xs text-muted-foreground">
              Cost and expense breakdown
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Flow</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Flow</div>
            <p className="text-xs text-muted-foreground">Cash flow analysis</p>
          </CardContent>
        </Card>
      </div>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Generated Reports</CardTitle>
          <CardDescription>
            View and download previously generated financial reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Loading reports...</span>
            </div>
          ) : !reports || reports.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No reports generated yet</p>
              <Button
                onClick={() => setIsGenerateDialogOpen(true)}
                className="mt-4"
              >
                <Plus className="mr-2 h-4 w-4" />
                Generate First Report
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Generated By</TableHead>
                  <TableHead>Generated At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">
                      {report.reportName}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getReportTypeIcon(report.reportType)}
                        {getReportTypeLabel(report.reportType)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(report.periodStart).toLocaleDateString()} -{" "}
                      {new Date(report.periodEnd).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {report.generatedByUser.firstName}{" "}
                      {report.generatedByUser.lastName}
                    </TableCell>
                    <TableCell>
                      {new Date(report.generatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="mr-1 h-3 w-3" />
                          View
                        </Button>
                        {report.fileUrl && (
                          <Button variant="outline" size="sm">
                            <Download className="mr-1 h-3 w-3" />
                            Download
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
