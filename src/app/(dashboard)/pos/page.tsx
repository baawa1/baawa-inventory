import { redirect } from "next/navigation";
import { auth } from "../../../../auth";
import { POSInterface } from "@/components/pos/POSInterface";
import { ALL_ROLES } from "@/lib/auth/roles";

export default async function POSPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Check role permissions - all authenticated users can access POS
  if (!ALL_ROLES.includes(session.user.role as any)) {
    redirect("/unauthorized");
  }

  return <POSInterface />;
}
