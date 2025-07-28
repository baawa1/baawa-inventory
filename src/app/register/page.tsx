import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '../../../auth';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { Logo } from '@/components/ui/logo';

export default async function RegisterPage() {
  const session = await auth();

  if (session?.user) {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Logo variant="brand" showText centered />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            BaaWA Inventory POS
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Create your account
          </p>
        </div>

        <RegisterForm />

        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-primary hover:text-primary/80 font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
