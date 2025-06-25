import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-helpers";
import AddProductForm from "@/components/inventory/AddProductForm";

export const metadata: Metadata = {
  title: "Add Product - BaaWA Inventory",
  description: "Add a new product to your inventory",
};

export default async function AddProductPage() {
  const session = await getServerSession();

  // Check if user has permission to add products
  if (session?.user.role !== "ADMIN" && session?.user.role !== "MANAGER") {
    redirect("/unauthorized");
  }

  return <AddProductForm />;
}
