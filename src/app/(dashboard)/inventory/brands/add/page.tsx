import { Metadata } from "next";
import AddBrandForm from "@/components/inventory/AddBrandForm";

export const metadata: Metadata = {
  title: "Add Brand | BaaWA Inventory Manager",
  description: "Add a new brand to your inventory system",
};

export default function AddBrandPage() {
  return <AddBrandForm />;
}
