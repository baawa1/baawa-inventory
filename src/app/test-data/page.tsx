"use client";

import { useState, useEffect } from "react";

export default function TestDataPage() {
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Test categories
        const categoriesRes = await fetch("/api/categories");
        console.log("Categories response status:", categoriesRes.status);

        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          console.log("Categories full response:", categoriesData);
          setCategories(categoriesData.data || []);
        } else {
          const errorData = await categoriesRes.text();
          console.error("Categories error:", errorData);
          setError(`Categories: ${categoriesRes.status} - ${errorData}`);
        }

        // Test brands
        const brandsRes = await fetch("/api/brands");
        console.log("Brands response status:", brandsRes.status);

        if (brandsRes.ok) {
          const brandsData = await brandsRes.json();
          console.log("Brands full response:", brandsData);
          setBrands(brandsData.data || []);
        } else {
          const errorData = await brandsRes.text();
          console.error("Brands error:", errorData);
          setError(
            (prev) =>
              `${prev || ""} | Brands: ${brandsRes.status} - ${errorData}`
          );
        }
      } catch (err) {
        console.error("Error loading data:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">API Data Test</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
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
