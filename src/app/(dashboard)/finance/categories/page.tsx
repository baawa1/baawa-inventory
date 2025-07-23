import { redirect } from "next/navigation";
import { auth } from "../../../../../auth";
import { CategoryList } from "@/components/finance/CategoryList";
import { USER_ROLES, hasRole } from "@/lib/auth/roles";

export const metadata = {
  title: "Financial Categories - BaaWA Inventory POS",
  description: "Manage income and expense categories",
};

export default async function CategoriesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!hasRole(session.user.role, [USER_ROLES.ADMIN, USER_ROLES.MANAGER])) {
    redirect("/unauthorized");
  }

  return <CategoryList user={session.user} />;
}
