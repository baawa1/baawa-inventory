import { Metadata } from "next";
import BrandList from "@/components/inventory/BrandList";

export const metadata: Metadata = {
  title: "Brands | BaaWA Inventory Manager",
  description: "Manage product brands in your inventory system",
};

export default function BrandsPage() {
  return <BrandList />;
}
