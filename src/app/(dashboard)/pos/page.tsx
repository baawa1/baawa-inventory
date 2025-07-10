import { redirect } from "next/navigation";
import { auth } from "../../../../auth";
import { POSInterface } from "@/components/pos/POSInterface";

export default async function POSPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Check role permissions - all authenticated users can access POS
  if (!["ADMIN", "MANAGER", "STAFF"].includes(session.user.role)) {
    redirect("/unauthorized");
  }

  return <POSInterface />;
}
