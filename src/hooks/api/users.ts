import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import type { AppUser } from '@/types/user';

// Types for Users API
export interface CreateUserData {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  userStatus: string;
  password: string;
}

export interface UpdateUserData {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  userStatus: string;
}

export interface UserFilters {
  isActive?: boolean;
  status?: string;
  role?: string;
  limit?: number;
}

// API Functions
const fetchUsers = async (filters: UserFilters = {}): Promise<AppUser[]> => {
  const params = new URLSearchParams();

  if (filters.isActive !== undefined) {
    params.append('isActive', filters.isActive.toString());
  }
  if (filters.status) {
    params.append('status', filters.status);
  }
  if (filters.role) {
    params.append('role', filters.role);
  }
  if (filters.limit !== undefined) {
    params.append('limit', filters.limit.toString());
  }

  const url = `/api/users${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await fetch(url, {
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch users');
  }

  const data = await response.json();
  return data.data || data.users || data; // Handle pagination response format
};

const createUser = async (userData: CreateUserData): Promise<AppUser> => {
  const response = await fetch('/api/users', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create user');
  }

  const data = await response.json();
  return data.user || data;
};

const updateUser = async ({
  id,
  ...userData
}: UpdateUserData & { id: number }): Promise<AppUser> => {
  const response = await fetch(`/api/users/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update user');
  }

  const data = await response.json();
  return data.user || data;
};

const deleteUser = async (id: number): Promise<void> => {
  const response = await fetch(`/api/users/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to delete user');
  }
};

// Query Hooks
export const useUsers = (filters: UserFilters = {}) => {
  return useQuery({
    queryKey: queryKeys.users.list(filters),
    queryFn: () => fetchUsers(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useActiveUsers = () => {
  return useUsers({ isActive: true });
};

export const useDeactivatedUsers = () => {
  return useUsers({ isActive: false });
};

// Mutation Hooks
export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
};

export const useReactivateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      firstName,
      lastName,
      email,
      role,
    }: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
      role: string;
    }) =>
      updateUser({
        id,
        firstName,
        lastName,
        email,
        role,
        userStatus: 'APPROVED', // Reactivating users should set them as approved
      }),
    onSuccess: () => {
      // Invalidate all user-related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
};
