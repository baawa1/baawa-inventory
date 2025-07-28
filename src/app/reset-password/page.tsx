import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import Link from 'next/link';
import { Logo } from '@/components/ui/logo';

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Logo variant="brand" showText centered className="mb-6" />
        <ResetPasswordForm />
        <div className="mt-4 text-center">
          <Link
            href="/login"
            className="text-muted-foreground hover:text-primary text-sm hover:underline"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
