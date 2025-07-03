import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth-helpers";
import { LoginForm } from "@/components/auth/LoginForm";

interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string; message?: string }>;
}

function LoginFormWrapper({
  searchParams,
}: {
  searchParams: { callbackUrl?: string; message?: string };
}) {
  const getMessageContent = (message: string) => {
    switch (message) {
      case "password-reset-success":
        return "Your password has been reset successfully. Please log in with your new password.";
      default:
        return message;
    }
  };

  return (
    <>
      {searchParams.message && (
        <div className="bg-green-50 text-green-700 text-sm p-3 rounded-md mb-4 text-center">
          {getMessageContent(searchParams.message)}
        </div>
      )}
      <LoginForm callbackUrl={searchParams.callbackUrl} />
    </>
  );
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getServerSession();
  const resolvedSearchParams = await searchParams;

  // Redirect if already logged in
  if (session) {
    redirect(resolvedSearchParams.callbackUrl || "/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            BaaWA Inventory POS
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Accessories Inventory Management System
          </p>
        </div>

        <Suspense fallback={<div>Loading...</div>}>
          <LoginFormWrapper searchParams={resolvedSearchParams} />
        </Suspense>

        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {" "}
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-primary hover:text-primary/80"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
