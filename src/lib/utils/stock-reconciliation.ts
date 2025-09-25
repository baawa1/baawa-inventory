export interface DiscrepancyInput {
  discrepancy: number;
  impact?: number;
}

export interface DiscrepancyMetrics {
  netUnits: number;
  netImpact: number;
  overageUnits: number;
  overageImpact: number;
  shortageUnits: number;
  shortageImpact: number;
}

export function calculateDiscrepancyMetrics(
  items: DiscrepancyInput[]
): DiscrepancyMetrics {
  return items.reduce<DiscrepancyMetrics>(
    (acc, item) => {
      const diff = Number(item.discrepancy || 0);
      const impact = Number(item.impact || 0);

      acc.netUnits += diff;
      acc.netImpact += impact;

      if (diff > 0) {
        acc.overageUnits += diff;
        acc.overageImpact += impact;
      } else if (diff < 0) {
        const shortageUnits = Math.abs(diff);
        const shortageImpact = Math.abs(impact);
        acc.shortageUnits += shortageUnits;
        acc.shortageImpact += shortageImpact;
      }

      return acc;
    },
    {
      netUnits: 0,
      netImpact: 0,
      overageUnits: 0,
      overageImpact: 0,
      shortageUnits: 0,
      shortageImpact: 0,
    }
  );
}

export const formatSignedUnits = (value: number) =>
  `${value > 0 ? '+' : value < 0 ? '-' : ''}${Math.abs(value)}`;
