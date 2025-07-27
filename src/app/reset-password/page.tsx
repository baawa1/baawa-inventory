import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import Link from 'next/link';

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
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
