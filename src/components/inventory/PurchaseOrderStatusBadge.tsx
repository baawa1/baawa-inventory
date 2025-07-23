import { Badge } from "@/components/ui/badge";
import { PURCHASE_ORDER_STATUS } from "@/lib/constants";

interface PurchaseOrderStatusBadgeProps {
  status: string;
  className?: string;
}

export function PurchaseOrderStatusBadge({
  status,
  className,
}: PurchaseOrderStatusBadgeProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case PURCHASE_ORDER_STATUS.DRAFT:
        return "bg-gray-400 text-gray-800 border-gray-400";
      case PURCHASE_ORDER_STATUS.PENDING:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case PURCHASE_ORDER_STATUS.APPROVED:
        return "bg-green-100 text-green-800 border-green-200";
      case PURCHASE_ORDER_STATUS.ORDERED:
        return "bg-blue-100 text-blue-800 border-blue-200";
      case PURCHASE_ORDER_STATUS.PARTIAL_RECEIVED:
        return "bg-orange-100 text-orange-800 border-orange-200";
      case PURCHASE_ORDER_STATUS.RECEIVED:
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case PURCHASE_ORDER_STATUS.CANCELLED:
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case PURCHASE_ORDER_STATUS.DRAFT:
        return "Draft";
      case PURCHASE_ORDER_STATUS.PENDING:
        return "Pending";
      case PURCHASE_ORDER_STATUS.APPROVED:
        return "Approved";
      case PURCHASE_ORDER_STATUS.ORDERED:
        return "Ordered";
      case PURCHASE_ORDER_STATUS.PARTIAL_RECEIVED:
        return "Partial Received";
      case PURCHASE_ORDER_STATUS.RECEIVED:
        return "Received";
      case PURCHASE_ORDER_STATUS.CANCELLED:
        return "Cancelled";
      default:
        return status;
    }
  };

  return (
    <Badge className={`${getStatusColor(status)} ${className || ""}`}>
      {getStatusLabel(status)}
    </Badge>
  );
}
