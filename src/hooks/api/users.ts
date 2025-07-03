import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";

// Types for Users API
export interface APIUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "EMPLOYEE";
  userStatus: "PENDING" | "VERIFIED" | "APPROVED" | "REJECTED" | "SUSPENDED";
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  lastLogin?: string;
  approvedBy?: number;
  approvedAt?: string;
  rejectionReason?: string;
}

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
}

// API Functions
const fetchUsers = async (filters: UserFilters = {}): Promise<APIUser[]> => {
  const params = new URLSearchParams();

  if (filters.isActive !== undefined) {
    params.append("isActive", filters.isActive.toString());
  }
  if (filters.status) {
    params.append("status", filters.status);
  }
  if (filters.role) {
    params.append("role", filters.role);
  }

  const url = `/api/users${params.toString() ? `?${params.toString()}` : ""}`;
  const response = await fetch(url, {
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch users");
  }

  const data = await response.json();
  return data.users || data; // Handle both pagination and direct array responses
};

const createUser = async (userData: CreateUserData): Promise<APIUser> => {
  const response = await fetch("/api/users", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to create user");
  }

  const data = await response.json();
  return data.user || data;
};

const updateUser = async ({
  id,
  ...userData
}: UpdateUserData & { id: number }): Promise<APIUser> => {
  const response = await fetch(`/api/users/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to update user");
  }

  const data = await response.json();
  return data.user || data;
};

const deleteUser = async (id: number): Promise<void> => {
  const response = await fetch(`/api/users/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to delete user");
  }
};

const approveUser = async (
  userId: number,
  action: "approve" | "reject",
  rejectionReason?: string
): Promise<void> => {
  const response = await fetch("/api/admin/approve-user", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId,
      action,
      rejectionReason,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to ${action} user`);
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

export const usePendingUsers = (status?: string) => {
  const filters: UserFilters = {};
  if (status && status !== "all") {
    filters.status = status;
  }

  return useQuery({
    queryKey: queryKeys.users.pending(status),
    queryFn: async () => {
      const users = await fetchUsers(filters);
      // Filter users to show non-approved users for pending management
      return status === "all" || !status
        ? users.filter((user) => user.userStatus !== "APPROVED")
        : users;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes for more frequent updates
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
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

export const useApproveUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      action,
      rejectionReason,
    }: {
      userId: number;
      action: "approve" | "reject";
      rejectionReason?: string;
    }) => approveUser(userId, action, rejectionReason),
    onSuccess: () => {
      // Invalidate all user-related queries
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
        userStatus: "APPROVED", // Reactivating users should set them as approved
      }),
    onSuccess: () => {
      // Invalidate all user-related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
};
