import { redirect } from "next/navigation";
import { auth } from "../../../../../../auth";
import { USER_ROLES, hasRole } from "@/lib/auth/roles";

export const metadata = {
  title: "Add Category - BaaWA Inventory POS",
  description: "Add new financial category",
};

export default async function AddCategoryPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!hasRole(session.user.role, [USER_ROLES.ADMIN, USER_ROLES.MANAGER])) {
    redirect("/unauthorized");
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Add Financial Category</h1>
      <p className="text-muted-foreground">
        Add category form is currently under development.
      </p>
    </div>
  );
}