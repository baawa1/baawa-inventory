import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import EditProductForm from "@/components/inventory/EditProductForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  // Only admins, managers, and employees can edit products
  if (!["ADMIN", "MANAGER", "EMPLOYEE"].includes(session?.user.role || "")) {
    redirect("/unauthorized");
  }

  const { id } = await params;
  const productId = parseInt(id);

  if (isNaN(productId)) {
    redirect("/inventory/products");
  }

  return <EditProductForm productId={productId} />;
}
