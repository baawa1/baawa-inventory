import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '#root/auth';

export default async function RegisterPage() {
  const session = await auth();

  if (session?.user) {
    redirect('/dashboard');
  }

  redirect('/login');
}
