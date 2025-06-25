import { Metadata } from "next";
import EditBrandForm from "@/components/inventory/EditBrandForm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Edit Brand | BaaWA Inventory Manager",
  description: "Edit brand information in your inventory system",
};

interface EditBrandPageProps {
  params: {
    id: string;
  };
}

export default function EditBrandPage({ params }: EditBrandPageProps) {
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
            <h1 className="text-2xl font-bold tracking-tight">Edit Brand</h1>
            <p className="text-muted-foreground">
              Update brand information and settings.
            </p>
          </div>
        </div>

        <EditBrandForm brandId={parseInt(params.id)} />
      </div>
    </div>
  );
}
