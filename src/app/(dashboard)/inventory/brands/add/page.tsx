import { Metadata } from "next";
import AddBrandForm from "@/components/inventory/AddBrandForm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Add Brand | BaaWA Inventory Manager",
  description: "Add a new brand to your inventory system",
};

export default function AddBrandPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/inventory/brands">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Brands
            </Link>
          </Button>

          <div>
            <h1 className="text-2xl font-bold tracking-tight">Add New Brand</h1>
            <p className="text-muted-foreground">
              Create a new brand for your inventory products.
            </p>
          </div>
        </div>

        <AddBrandForm />
      </div>
    </div>
  );
}
