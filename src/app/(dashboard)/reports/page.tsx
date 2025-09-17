import { redirect } from 'next/navigation';

// Redirect /reports to /finance/reports (main reports section)
export default function ReportsRedirect() {
  redirect('/finance/reports');
}