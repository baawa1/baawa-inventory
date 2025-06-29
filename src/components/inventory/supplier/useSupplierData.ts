import { useState, useEffect } from "react";

interface Supplier {
  id: number;
  name: string;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  taxId?: string | null;
  paymentTerms?: string | null;
  creditLimit?: number | null;
  isActive: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UseSupplierDataResult {
  supplier: Supplier | null;
  loading: boolean;
  error: string | null;
}

export function useSupplierData(
  supplierId: number | null,
  isOpen: boolean
): UseSupplierDataResult {
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && supplierId) {
      setLoading(true);
      setError(null);

      fetch(`/api/suppliers/${supplierId}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to fetch supplier");
          }
          return response.json();
        })
        .then((data) => {
          if (data.success && data.supplier) {
            setSupplier(data.supplier);
          } else {
            throw new Error(data.message || "Failed to fetch supplier");
          }
        })
        .catch((error) => {
          setError(error.message);
          console.error("Error fetching supplier:", error);
        })
        .finally(() => {
          setLoading(false);
        });
    } else if (!isOpen) {
      // Reset state when modal is closed
      setSupplier(null);
      setError(null);
    }
  }, [isOpen, supplierId]);

  return { supplier, loading, error };
}
