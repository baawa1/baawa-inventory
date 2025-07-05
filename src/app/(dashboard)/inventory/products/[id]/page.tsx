import { notFound } from "next/navigation";
import { ProductDetails } from "@/components/inventory/ProductDetails";
import { getUserFromRequest } from "@/lib/auth";

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const user = await getUserFromRequest();

  if (!user) {
    notFound();
  }

  const { id } = await params;
  const productId = parseInt(id);

  if (isNaN(productId)) {
    notFound();
  }

  return <ProductDetails productId={productId} user={user} />;
}
