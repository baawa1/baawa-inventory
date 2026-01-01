/**
 * Weighted Average Cost Calculator
 * Used for inventory valuation and COGS calculation
 */

export interface WeightedAverageCostParams {
  existingStock: number;
  existingCost: number;
  newQuantity: number;
  newCost: number;
}

export interface WeightedAverageCostResult {
  weightedAverageCost: number;
  totalStock: number;
  existingValue: number;
  newValue: number;
  totalValue: number;
}

/**
 * Calculate weighted average cost for inventory
 *
 * Formula: (Existing Value + New Value) / Total Quantity
 *
 * Example:
 * - Existing: 10 units @ ₦100 = ₦1,000
 * - New Purchase: 5 units @ ₦150 = ₦750
 * - Total: 15 units = ₦1,750
 * - Weighted Average: ₦1,750 / 15 = ₦116.67
 *
 * @param params - Cost calculation parameters
 * @returns Weighted average cost and breakdown
 */
export function calculateWeightedAverageCost(
  params: WeightedAverageCostParams
): WeightedAverageCostResult {
  const { existingStock, existingCost, newQuantity, newCost } = params;

  // Validate inputs
  if (existingStock < 0 || newQuantity <= 0) {
    throw new Error('Stock quantities must be non-negative');
  }

  if (existingCost < 0 || newCost < 0) {
    throw new Error('Costs must be non-negative');
  }

  const totalStock = existingStock + newQuantity;

  // If no existing stock, use new cost directly
  if (existingStock === 0) {
    return {
      weightedAverageCost: newCost,
      totalStock,
      existingValue: 0,
      newValue: newQuantity * newCost,
      totalValue: newQuantity * newCost,
    };
  }

  // Calculate weighted average
  const existingValue = existingStock * existingCost;
  const newValue = newQuantity * newCost;
  const totalValue = existingValue + newValue;
  const weightedAverageCost = totalValue / totalStock;

  return {
    weightedAverageCost,
    totalStock,
    existingValue,
    newValue,
    totalValue,
  };
}

/**
 * Calculate Cost of Goods Sold (COGS) using weighted average
 *
 * @param quantitySold - Quantity sold
 * @param weightedAverageCost - Current weighted average cost
 * @returns COGS amount
 */
export function calculateCOGS(
  quantitySold: number,
  weightedAverageCost: number
): number {
  if (quantitySold < 0) {
    throw new Error('Quantity sold must be non-negative');
  }

  if (weightedAverageCost < 0) {
    throw new Error('Cost must be non-negative');
  }

  return quantitySold * weightedAverageCost;
}

/**
 * Calculate gross profit
 *
 * @param revenue - Total revenue from sale
 * @param cogs - Cost of goods sold
 * @returns Gross profit amount
 */
export function calculateGrossProfit(revenue: number, cogs: number): number {
  return revenue - cogs;
}

/**
 * Calculate gross profit margin percentage
 *
 * @param revenue - Total revenue from sale
 * @param cogs - Cost of goods sold
 * @returns Gross profit margin as percentage (0-100)
 */
export function calculateGrossProfitMargin(
  revenue: number,
  cogs: number
): number {
  if (revenue === 0) return 0;
  const grossProfit = calculateGrossProfit(revenue, cogs);
  return (grossProfit / revenue) * 100;
}
