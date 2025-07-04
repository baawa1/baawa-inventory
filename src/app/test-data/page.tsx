"use client";

import { useCategories } from "@/hooks/api/categories";
import { useBrands } from "@/hooks/api/brands";

export default function TestDataPage() {
  // Use TanStack Query hooks instead of manual state management
  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useCategories();

  const {
    data: brandsData,
    isLoading: brandsLoading,
    error: brandsError,
  } = useBrands();

  // Combine loading states
  const loading = categoriesLoading || brandsLoading;

  // Extract data arrays
  const categories = categoriesData?.data || [];
  const brands = brandsData?.data || [];

  // Combine error states
  const error = categoriesError || brandsError;
  const errorMessage = error ? (error as Error).message : null;

  // Log data for debugging (same as before)
  console.log("Categories data:", categoriesData);
  console.log("Brands data:", brandsData);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">API Data Test</h1>

      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">
            Categories ({categories.length})
          </h2>
          <div className="bg-gray-100 p-4 rounded">
            <pre>{JSON.stringify(categories, null, 2)}</pre>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">
            Brands ({brands.length})
          </h2>
          <div className="bg-gray-100 p-4 rounded">
            <pre>{JSON.stringify(brands, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
