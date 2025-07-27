import { auth } from '#root/auth';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import EditExpenseForm from '@/components/finance/edit-expense/EditExpenseForm';

export const metadata: Metadata = {
  title: 'Edit Expense - BaaWA Inventory',
  description: 'Edit an expense transaction',
};

interface EditExpensePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditExpensePage({
  params,
}: EditExpensePageProps) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user) {
    redirect('/login');
  }

  // Check if user has finance access
  const userRole = session.user.role;
  if (!['ADMIN', 'MANAGER'].includes(userRole)) {
    redirect('/unauthorized');
  }

  return <EditExpenseForm user={session.user} expenseId={id} />;
}
