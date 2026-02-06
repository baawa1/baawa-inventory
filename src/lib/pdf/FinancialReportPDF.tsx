import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: '1pt solid #e5e7eb',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    backgroundColor: '#f3f4f6',
    padding: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottom: '0.5pt solid #e5e7eb',
  },
  label: {
    fontSize: 10,
    color: '#374151',
  },
  value: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  valuePositive: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  valueNegative: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  summaryBox: {
    backgroundColor: '#f9fafb',
    padding: 15,
    marginTop: 10,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#9ca3af',
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 8,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '0.5pt solid #e5e7eb',
  },
  tableCell: {
    flex: 1,
    fontSize: 9,
  },
  tableCellRight: {
    flex: 1,
    fontSize: 9,
    textAlign: 'right',
  },
});

interface FinancialReportData {
  reportType: string;
  period: { startDate: string; endDate: string };
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
    grossProfit: number;
  };
  profitLoss: {
    revenue: { sales: number; otherIncome: number; totalRevenue: number };
    expenses: {
      costOfGoods: number;
      operatingExpenses: number;
      totalExpenses: number;
    };
  };
  paymentMethods: Array<{ method: string; amount: number; count: number }>;
}

interface FinancialReportPDFProps {
  data: FinancialReportData;
  companyName?: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(amount);
};

export function FinancialReportPDF({
  data,
  companyName = 'Your Company',
}: FinancialReportPDFProps) {
  const reportDate = new Date().toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const periodStart = new Date(data.period.startDate).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const periodEnd = new Date(data.period.endDate).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{companyName}</Text>
          <Text style={styles.subtitle}>
            Financial Report: {data.reportType.replace('_', ' ')}
          </Text>
          <Text style={styles.subtitle}>
            Period: {periodStart} - {periodEnd}
          </Text>
          <Text style={styles.subtitle}>Generated: {reportDate}</Text>
        </View>

        {/* Executive Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Executive Summary</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Total Revenue</Text>
            <Text style={styles.valuePositive}>
              {formatCurrency(data.summary.totalIncome)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Total Expenses</Text>
            <Text style={styles.valueNegative}>
              {formatCurrency(data.summary.totalExpenses)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Gross Profit</Text>
            <Text
              style={
                data.summary.grossProfit >= 0
                  ? styles.valuePositive
                  : styles.valueNegative
              }
            >
              {formatCurrency(data.summary.grossProfit)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Net Profit</Text>
            <Text
              style={
                data.summary.netProfit >= 0
                  ? styles.valuePositive
                  : styles.valueNegative
              }
            >
              {formatCurrency(data.summary.netProfit)}
            </Text>
          </View>
        </View>

        {/* Revenue Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Revenue Breakdown</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Sales Revenue</Text>
            <Text style={styles.value}>
              {formatCurrency(data.profitLoss.revenue.sales)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Other Income</Text>
            <Text style={styles.value}>
              {formatCurrency(data.profitLoss.revenue.otherIncome)}
            </Text>
          </View>
          <View style={[styles.row, { backgroundColor: '#f9fafb' }]}>
            <Text style={[styles.label, { fontWeight: 'bold' }]}>Total Revenue</Text>
            <Text style={styles.valuePositive}>
              {formatCurrency(data.profitLoss.revenue.totalRevenue)}
            </Text>
          </View>
        </View>

        {/* Expense Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expense Breakdown</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Cost of Goods Sold</Text>
            <Text style={styles.value}>
              {formatCurrency(data.profitLoss.expenses.costOfGoods)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Operating Expenses</Text>
            <Text style={styles.value}>
              {formatCurrency(data.profitLoss.expenses.operatingExpenses)}
            </Text>
          </View>
          <View style={[styles.row, { backgroundColor: '#f9fafb' }]}>
            <Text style={[styles.label, { fontWeight: 'bold' }]}>Total Expenses</Text>
            <Text style={styles.valueNegative}>
              {formatCurrency(data.profitLoss.expenses.totalExpenses)}
            </Text>
          </View>
        </View>

        {/* Payment Methods */}
        {data.paymentMethods.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Method Distribution</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableCell}>Payment Method</Text>
                <Text style={styles.tableCellRight}>Transactions</Text>
                <Text style={styles.tableCellRight}>Amount</Text>
              </View>
              {data.paymentMethods.map((pm, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={styles.tableCell}>
                    {pm.method?.replace('_', ' ') || 'Unknown'}
                  </Text>
                  <Text style={styles.tableCellRight}>{pm.count}</Text>
                  <Text style={styles.tableCellRight}>{formatCurrency(pm.amount)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          This report was automatically generated by the Finance Manager system.
          For questions, contact your system administrator.
        </Text>
      </Page>
    </Document>
  );
}
