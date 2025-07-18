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
  params: Promise<{
    id: string;
  }>;
}

export default async function EditBrandPage({ params }: EditBrandPageProps) {
  const { id } = await params;

  return <EditBrandForm brandId={parseInt(id)} />;
}
