"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils/finance";
import {
  IconTrendingUp,
  IconTrendingDown,
  IconCalendar,
  IconUser,
  IconReceipt,
  IconNotes,
} from "@tabler/icons-react";

interface TransactionDetailModalProps {
  transaction: any;
  isOpen: boolean;
  onClose: () => void;
}

export function TransactionDetailModal({
  transaction,
  isOpen,
  onClose,
}: TransactionDetailModalProps) {
  if (!transaction) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "PENDING":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "CANCELLED":
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      case "APPROVED":
        return <Badge className="bg-blue-100 text-blue-800">Approved</Badge>;
      case "REJECTED":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    return type === "INCOME" ? (
      <Badge className="bg-green-100 text-green-800">
        <IconTrendingUp className="h-3 w-3 mr-1" />
        Income
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">
        <IconTrendingDown className="h-3 w-3 mr-1" />
        Expense
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Transaction Details
            {getTypeBadge(transaction.type)}
          </DialogTitle>
          <DialogDescription>
            Transaction #{transaction.transactionNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Amount
                  </label>
                  <p className={`text-2xl font-bold ${
                    transaction.type === "INCOME" ? "text-green-600" : "text-red-600"
                  }`}>
                    {transaction.type === "INCOME" ? "+" : "-"}
                    {formatCurrency(Number(transaction.amount))}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Status
                  </label>
                  <div className="mt-1">
                    {getStatusBadge(transaction.status)}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Description
                </label>
                <p className="text-sm">
                  {transaction.description || "No description provided"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Category
                  </label>
                  <p className="text-sm">{transaction.category?.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Currency
                  </label>
                  <p className="text-sm">{transaction.currency}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <IconCalendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Transaction Date
                    </label>
                    <p className="text-sm">
                      {new Date(transaction.transactionDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <IconUser className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Created By
                    </label>
                    <p className="text-sm">
                      {transaction.createdByUser
                        ? `${transaction.createdByUser.firstName} ${transaction.createdByUser.lastName}`
                        : "Unknown"}
                    </p>
                  </div>
                </div>
              </div>

              {transaction.paymentMethod && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Payment Method
                  </label>
                  <p className="text-sm">{transaction.paymentMethod}</p>
                </div>
              )}

              {transaction.referenceNumber && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Reference Number
                  </label>
                  <p className="text-sm">{transaction.referenceNumber}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Expense Details */}
          {transaction.type === "EXPENSE" && transaction.expenseDetails && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Expense Details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Expense Type
                  </label>
                  <p className="text-sm">{transaction.expenseDetails.expenseType}</p>
                </div>

                {transaction.expenseDetails.vendorName && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Vendor Name
                      </label>
                      <p className="text-sm">{transaction.expenseDetails.vendorName}</p>
                    </div>
                    {transaction.expenseDetails.vendorContact && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Vendor Contact
                        </label>
                        <p className="text-sm">{transaction.expenseDetails.vendorContact}</p>
                      </div>
                    )}
                  </div>
                )}

                {(transaction.expenseDetails.taxAmount > 0 || transaction.expenseDetails.taxRate > 0) && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Tax Amount
                      </label>
                      <p className="text-sm">{formatCurrency(Number(transaction.expenseDetails.taxAmount))}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Tax Rate
                      </label>
                      <p className="text-sm">{transaction.expenseDetails.taxRate}%</p>
                    </div>
                  </div>
                )}

                {transaction.expenseDetails.receiptUrl && (
                  <div className="flex items-center gap-2">
                    <IconReceipt className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Receipt
                      </label>
                      <a
                        href={transaction.expenseDetails.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline block"
                      >
                        View Receipt
                      </a>
                    </div>
                  </div>
                )}

                {transaction.expenseDetails.notes && (
                  <div className="flex items-start gap-2">
                    <IconNotes className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Notes
                      </label>
                      <p className="text-sm">{transaction.expenseDetails.notes}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Income Details */}
          {transaction.type === "INCOME" && transaction.incomeDetails && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Income Details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Income Source
                  </label>
                  <p className="text-sm">{transaction.incomeDetails.incomeSource}</p>
                </div>

                {transaction.incomeDetails.payerName && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Payer Name
                      </label>
                      <p className="text-sm">{transaction.incomeDetails.payerName}</p>
                    </div>
                    {transaction.incomeDetails.payerContact && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Payer Contact
                        </label>
                        <p className="text-sm">{transaction.incomeDetails.payerContact}</p>
                      </div>
                    )}
                  </div>
                )}

                {(transaction.incomeDetails.taxWithheld > 0 || transaction.incomeDetails.taxRate > 0) && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Tax Withheld
                      </label>
                      <p className="text-sm">{formatCurrency(Number(transaction.incomeDetails.taxWithheld))}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Tax Rate
                      </label>
                      <p className="text-sm">{transaction.incomeDetails.taxRate}%</p>
                    </div>
                  </div>
                )}

                {transaction.incomeDetails.receiptUrl && (
                  <div className="flex items-center gap-2">
                    <IconReceipt className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Receipt
                      </label>
                      <a
                        href={transaction.incomeDetails.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline block"
                      >
                        View Receipt
                      </a>
                    </div>
                  </div>
                )}

                {transaction.incomeDetails.notes && (
                  <div className="flex items-start gap-2">
                    <IconNotes className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Notes
                      </label>
                      <p className="text-sm">{transaction.incomeDetails.notes}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Approval Information */}
          {transaction.approvedBy && transaction.approvedAt && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Approval Information</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Approved By
                    </label>
                    <p className="text-sm">
                      {transaction.approvedByUser
                        ? `${transaction.approvedByUser.firstName} ${transaction.approvedByUser.lastName}`
                        : "Unknown"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Approved At
                    </label>
                    <p className="text-sm">
                      {new Date(transaction.approvedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">System Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Created At
                  </label>
                  <p className="text-sm">
                    {new Date(transaction.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Last Updated
                  </label>
                  <p className="text-sm">
                    {new Date(transaction.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}