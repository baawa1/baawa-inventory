import Link from "next/link";
import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth-helpers";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default async function RegisterPage() {
  const session = await getServerSession();

  // Redirect if already logged in
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            BaaWA Inventory POS
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Create your account to get started
          </p>
        </div>

        <RegisterForm />

        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-primary hover:text-primary/80"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
