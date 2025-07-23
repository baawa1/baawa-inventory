import { redirect } from "next/navigation";
import { auth } from "../../../../../../auth";
import { AddCategoryForm } from "@/components/finance/AddCategoryForm";
import { USER_ROLES, hasRole } from "@/lib/auth/roles";

export const metadata = {
  title: "Add Category - BaaWA Inventory POS",
  description: "Create a new financial category",
};

export default async function AddCategoryPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!hasRole(session.user.role, [USER_ROLES.ADMIN, USER_ROLES.MANAGER])) {
    redirect("/unauthorized");
  }

  return <AddCategoryForm user={session.user} />;
}
