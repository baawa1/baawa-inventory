"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Transaction Details</DialogTitle>
          <DialogDescription>
            Transaction #{transaction.transactionNumber}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium">Amount</h3>
            <p className="text-2xl font-bold">
              {transaction.type === "INCOME" ? "+" : "-"}₦
              {Number(transaction.amount).toLocaleString()}
            </p>
          </div>
          <div>
            <h3 className="font-medium">Type</h3>
            <Badge
              variant={transaction.type === "INCOME" ? "default" : "secondary"}
            >
              {transaction.type}
            </Badge>
          </div>
          <div>
            <h3 className="font-medium">Status</h3>
            <Badge variant="outline">{transaction.status}</Badge>
          </div>
          {transaction.description && (
            <div>
              <h3 className="font-medium">Description</h3>
              <p>{transaction.description}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
