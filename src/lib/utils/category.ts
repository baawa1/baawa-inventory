import { Category } from '@/hooks/api/categories';

/**
 * Formats a category name with its parent hierarchy
 * @param category - The category object with optional parent
 * @returns Formatted string like "Parent >> Child" or just "Category"
 */
export function formatCategoryHierarchy(
  category: Category | null | undefined
): string {
  if (!category) return '-';

  if (category.parent) {
    return `${category.parent.name} >> ${category.name}`;
  }

  return category.name;
}

/**
 * Formats a category name with its full hierarchy path
 * @param category - The category object with optional parent
 * @returns Formatted string like "Grandparent >> Parent >> Child"
 */
export function formatFullCategoryHierarchy(
  category: Category | null | undefined
): string {
  if (!category) return '-';

  const hierarchy: string[] = [];
  let currentCategory: Category | null = category;

  // Build hierarchy from child to parent
  while (currentCategory) {
    hierarchy.unshift(currentCategory.name);
    // Handle the parent type properly
    currentCategory = currentCategory.parent
      ? ({
          ...currentCategory.parent,
          isActive: true,
          productCount: 0,
          subcategoryCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as Category)
      : null;
  }

  return hierarchy.join(' >> ');
}

/**
 * Creates a flat list of categories with hierarchical display names
 * @param categories - Array of categories with hierarchy
 * @returns Array of categories with formatted display names
 */
export function createHierarchicalCategoryOptions(
  categories: Category[]
): Array<{
  id: number;
  name: string;
  displayName: string;
  parentId?: number;
}> {
  return categories.map(category => ({
    id: category.id,
    name: category.name,
    displayName: formatCategoryHierarchy(category),
    parentId: category.parentId,
  }));
}
