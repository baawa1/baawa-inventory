import { Metadata } from 'next';
import { auth } from '#root/auth';
import { redirect } from 'next/navigation';
import { EditTransactionForm } from '@/components/finance/EditTransactionForm';

export const metadata: Metadata = {
  title: 'Edit Transaction | BaaWA Finance Manager',
  description: 'Edit financial transaction details',
};

interface EditTransactionPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTransactionPage({
  params,
}: EditTransactionPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Only admins and managers can edit transactions
  if (!['ADMIN', 'MANAGER'].includes(session.user.role)) {
    redirect('/unauthorized');
  }

  const { id } = await params;
  const transactionId = parseInt(id);

  if (isNaN(transactionId)) {
    redirect('/finance');
  }

  return (
    <EditTransactionForm transactionId={transactionId} user={session.user} />
  );
}
