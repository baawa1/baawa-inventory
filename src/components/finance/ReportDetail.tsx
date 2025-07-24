"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { useFinancialReports } from "@/hooks/api/finance";
import { formatDate } from "@/lib/utils";
import { AppUser } from "@/types/user";
import {
  ArrowLeft,
  Download,
  FileText,
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
} from "lucide-react";

interface ReportDetailProps {
  reportId: number;
  user: AppUser;
}

export function ReportDetail({ reportId, user: _user }: ReportDetailProps) {
  const router = useRouter();
  const { data: reports, isLoading, error } = useFinancialReports();
  const report = reports?.find((r: any) => r.id === reportId);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading report details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Report Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The report you're looking for doesn't exist or has been deleted.
          </p>
          <Button onClick={() => router.push("/finance/reports")}>
            Back to Reports
          </Button>
        </div>
      </div>
    );
  }

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case "FINANCIAL_SUMMARY":
        return <DollarSign className="h-5 w-5" />;
      case "INCOME_STATEMENT":
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      case "EXPENSE_REPORT":
        return <TrendingDown className="h-5 w-5 text-red-600" />;
      case "CASH_FLOW":
        return <BarChart3 className="h-5 w-5 text-blue-600" />;
      default:
        return <FileText className="h-5 w-5" />;
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

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/finance/reports")}
          className="mb-4 px-4 lg:px-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Reports
        </Button>
        <div className="flex items-center justify-between">
          <PageHeader
            title={getReportTypeLabel(report.reportType)}
            description={`Report #${report.id} - ${report.reportName}`}
          />
          <div className="flex items-center gap-2">
            {report.fileUrl && (
              <Button variant="outline" asChild>
                <a
                  href={report.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Report
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Report Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {getReportTypeIcon(report.reportType)}
              Report Summary
            </CardTitle>
            <Badge variant="outline">Completed</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                Report Title
              </div>
              <div className="text-lg font-medium">{report.reportName}</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Generated Date
              </div>
              <div className="text-lg font-medium">
                {formatDate(report.generatedAt)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Parameters */}
      <Card>
        <CardHeader>
          <CardTitle>Report Parameters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Period Start</div>
              <div className="font-medium">
                {formatDate(report.periodStart)}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Period End</div>
              <div className="font-medium">{formatDate(report.periodEnd)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Report ID</div>
              <div className="font-mono text-sm">{report.id}</div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Generated</div>
              <div className="text-sm">{formatDate(report.generatedAt)}</div>
            </div>

            {report.generatedBy && (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  Generated By
                </div>
                <div className="text-sm">{report.generatedBy}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
