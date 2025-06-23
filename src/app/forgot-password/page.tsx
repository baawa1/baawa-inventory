import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <ForgotPasswordForm />
        <div className="mt-4 text-center">
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-primary hover:underline"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
