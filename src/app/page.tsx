import { redirect } from "next/navigation";
import { auth } from "../../auth";

export default async function HomePage() {
  const session = await auth();

  if (session?.user) {
    // User is authenticated, redirect to dashboard
    redirect("/dashboard");
  }

  // User is not authenticated, redirect to login
  redirect("/login");
}
