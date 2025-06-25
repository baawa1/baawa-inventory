import { Metadata } from "next";
import BrandList from "@/components/inventory/BrandList";

export const metadata: Metadata = {
  title: "Brands | BaaWA Inventory Manager",
  description: "Manage product brands in your inventory system",
};

export default function BrandsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Brands</h1>
          <p className="text-muted-foreground">
            Manage your product brands and their information.
          </p>
        </div>

        <BrandList />
      </div>
    </div>
  );
}
