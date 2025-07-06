export const DISCREPANCY_REASONS = [
  { value: "damaged_goods", label: "Damaged Goods" },
  { value: "expired_items", label: "Expired Items" },
  { value: "theft_loss", label: "Theft/Loss" },
  { value: "counting_error", label: "Counting Error" },
  { value: "supplier_shortage", label: "Supplier Shortage" },
  { value: "shrinkage", label: "Shrinkage" },
  { value: "spillage", label: "Spillage/Breakage" },
  { value: "misplaced", label: "Misplaced Items" },
  { value: "system_error", label: "System Error" },
  { value: "transfer_pending", label: "Transfer Pending" },
  { value: "quality_control", label: "Quality Control Rejection" },
  { value: "returns", label: "Customer Returns" },
  { value: "other", label: "Other" },
] as const;

export type DiscrepancyReasonValue = typeof DISCREPANCY_REASONS[number]["value"];
