import { notFound } from "next/navigation";
import EditCategoryForm from "@/components/inventory/EditCategoryForm";

interface EditCategoryPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getCategory(id: string) {
  try {
    // Use server-side API directly instead of HTTP fetch
    const { supabase } = await import("@/lib/supabase");
    const { categoryIdSchema } = await import("@/lib/validations/category");

    const validatedId = categoryIdSchema.parse({ id });

    const { data: category, error } = await supabase
      .from("categories")
      .select("*")
      .eq("id", validatedId.id)
      .single();

    if (error) {
      console.error("Error fetching category:", error);
      return null;
    }

    // Transform to camelCase for frontend
    return {
      id: category.id,
      name: category.name,
      description: category.description,
      isActive: category.is_active,
      createdAt: category.created_at,
      updatedAt: category.updated_at,
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
