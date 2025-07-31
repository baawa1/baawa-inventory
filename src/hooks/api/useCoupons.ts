import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface Coupon {
  id: number;
  code: string;
  name: string;
  description: string | null;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  minimumAmount: number | null;
  maxUses: number | null;
  currentUses: number;
  isActive: boolean;
  validFrom: string;
  validUntil: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  createdByUser: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface CouponFilters {
  search: string;
  status: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
}

export interface CouponPagination {
  page: number;
  limit: number;
  totalPages: number;
  total: number;
}

export interface CouponResponse {
  data: Coupon[];
  pagination: CouponPagination;
}

export interface CreateCouponData {
  code: string;
  name: string;
  description?: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  minimumAmount?: number;
  maxUses?: number;
  validFrom: string;
  validUntil: string;
}

export interface UpdateCouponData {
  code?: string;
  name?: string;
  description?: string;
  type?: 'PERCENTAGE' | 'FIXED';
  value?: number;
  minimumAmount?: number;
  maxUses?: number;
  isActive?: boolean;
  validFrom?: string;
  validUntil?: string;
}

export interface ValidateCouponData {
  code: string;
  totalAmount: number;
}

export interface ValidateCouponResponse {
  coupon: {
    id: number;
    code: string;
    name: string;
    type: 'PERCENTAGE' | 'FIXED';
    value: number;
    minimumAmount: number | null;
  };
  discountAmount: number;
  finalAmount: number;
}

// Fetch coupons
async function fetchCoupons(
  filters: Partial<CouponFilters> = {}
): Promise<CouponResponse> {
  const searchParams = new URLSearchParams({
    page: String(filters.page || 1),
    limit: String(filters.limit || 10),
    sortBy: filters.sortBy || 'createdAt',
    sortOrder: filters.sortOrder || 'desc',
  });

  if (filters.search) searchParams.set('search', filters.search);
  if (filters.status && filters.status !== 'all')
    searchParams.set('status', filters.status);

  const response = await fetch(`/api/pos/coupons?${searchParams.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch coupons');
  }

  const data = await response.json();
  return {
    data: data.data || [],
    pagination: {
      page: data.pagination?.page || 1,
      limit: data.pagination?.limit || 10,
      totalPages: data.pagination?.totalPages || 1,
      total: data.pagination?.total || 0,
    },
  };
}

// Create coupon
async function createCoupon(data: CreateCouponData): Promise<Coupon> {
  const response = await fetch('/api/pos/coupons', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create coupon');
  }

  return response.json();
}

// Update coupon
async function updateCoupon(
  id: number,
  data: UpdateCouponData
): Promise<Coupon> {
  const response = await fetch(`/api/pos/coupons/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update coupon');
  }

  return response.json();
}

// Delete coupon
async function deleteCoupon(id: number): Promise<void> {
  const response = await fetch(`/api/pos/coupons/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete coupon');
  }
}

// Toggle coupon status
async function toggleCouponStatus(id: number): Promise<Coupon> {
  const response = await fetch(`/api/pos/coupons/${id}/toggle`, {
    method: 'PATCH',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to toggle coupon status');
  }

  return response.json();
}

// Validate coupon
async function validateCoupon(
  data: ValidateCouponData
): Promise<ValidateCouponResponse> {
  const response = await fetch('/api/pos/coupons/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to validate coupon');
  }

  return response.json();
}

// React Query hooks
export function useCoupons(filters: Partial<CouponFilters> = {}) {
  return useQuery({
    queryKey: ['coupons', filters],
    queryFn: () => fetchCoupons(filters),
  });
}

export function useCoupon(id: number) {
  return useQuery({
    queryKey: ['coupons', id],
    queryFn: async () => {
      const response = await fetch(`/api/pos/coupons/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch coupon');
      }
      return response.json();
    },
    enabled: !!id,
  });
}

export function useCreateCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast.success('Coupon created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCouponData }) =>
      updateCoupon(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast.success('Coupon updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast.success('Coupon deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useToggleCouponStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleCouponStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast.success('Coupon status updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useValidateCoupon() {
  return useMutation({
    mutationFn: validateCoupon,
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
