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

  if (!session?.user) {
    redirect("/login");
  }

  // Check if user has permission to add products
  if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
    redirect("/unauthorized");
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Product</h1>
          <p className="text-muted-foreground">
            Create a new product entry for your inventory
          </p>
        </div>
      </div>

      <AddProductForm />
    </div>
  );
}
