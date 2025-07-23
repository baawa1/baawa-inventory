import { redirect } from "next/navigation";
import { auth } from "../../../../../../auth";
import { USER_ROLES, hasRole } from "@/lib/auth/roles";

export const metadata = {
  title: "Add Income - BaaWA Inventory POS",
  description: "Add new income transaction",
};

export default async function AddIncomePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!hasRole(session.user.role, [USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.STAFF])) {
    redirect("/unauthorized");
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Add Income</h1>
      <p className="text-muted-foreground">
        Add income form is currently under development.
      </p>
    </div>
  );
}