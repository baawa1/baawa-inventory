import { notFound } from "next/navigation";
import EditCategoryForm from "@/components/inventory/EditCategoryForm";
import { prisma } from "@/lib/db";

interface EditCategoryPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getCategory(id: string) {
  try {
    const categoryId = parseInt(id);

    if (isNaN(categoryId)) {
      return null;
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return null;
    }

    // Transform to match expected interface
    return {
      id: category.id,
      name: category.name,
      description: category.description,
      isActive: category.isActive,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
    };
  } catch (error) {
    console.error("Error fetching category:", error);
    return null;
  }
}

export default async function EditCategoryPage({
  params,
}: EditCategoryPageProps) {
  const { id } = await params;
  const category = await getCategory(id);

  if (!category) {
    notFound();
  }

  return <EditCategoryForm category={category} />;
}
