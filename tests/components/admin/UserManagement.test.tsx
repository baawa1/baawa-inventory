import userEvent from '@testing-library/user-event';
import { UserManagement } from '@/components/admin/UserManagement';
import {
  renderWithProviders,
  screen,
  waitFor,
} from '../../utils/test-providers';

const mockUseAdminGuard = jest.fn();
const mockUseActiveUsers = jest.fn();
const mockUseDeactivatedUsers = jest.fn();
const mockUseCreateUser = jest.fn();
const mockUseUpdateUser = jest.fn();
const mockUseDeleteUser = jest.fn();
const mockUseReactivateUser = jest.fn();
const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();

jest.mock('@/hooks/useAdminGuard', () => ({
  useAdminGuard: () => mockUseAdminGuard(),
}));

jest.mock('@/hooks/api/users', () => ({
  useActiveUsers: () => mockUseActiveUsers(),
  useDeactivatedUsers: () => mockUseDeactivatedUsers(),
  useCreateUser: () => mockUseCreateUser(),
  useUpdateUser: () => mockUseUpdateUser(),
  useDeleteUser: () => mockUseDeleteUser(),
  useReactivateUser: () => mockUseReactivateUser(),
}));

jest.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}));

jest.mock('@/components/admin/UserDialog', () => ({
  UserDialog: () => null,
}));

describe('UserManagement', () => {
  const activeRefetch = jest.fn();
  const inactiveRefetch = jest.fn();
  const deleteMutateAsync = jest.fn();
  const reactivateMutateAsync = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAdminGuard.mockReturnValue({
      isAdmin: true,
      isLoading: false,
    });

    mockUseActiveUsers.mockReturnValue({
      data: [
        {
          id: 1,
          firstName: 'Ada',
          lastName: 'Lovelace',
          name: 'Ada Lovelace',
          email: 'ada@example.com',
          role: 'ADMIN',
          userStatus: 'APPROVED',
          isActive: true,
          createdAt: '2026-01-01T00:00:00.000Z',
          lastLogin: '2026-02-01T00:00:00.000Z',
        },
      ],
      isLoading: false,
      refetch: activeRefetch,
    });

    mockUseDeactivatedUsers.mockReturnValue({
      data: [
        {
          id: 2,
          firstName: 'Grace',
          lastName: 'Hopper',
          name: 'Grace Hopper',
          email: 'grace@example.com',
          role: 'MANAGER',
          userStatus: 'SUSPENDED',
          isActive: false,
          createdAt: '2026-01-02T00:00:00.000Z',
          lastLogin: null,
        },
      ],
      isLoading: false,
      refetch: inactiveRefetch,
    });

    mockUseCreateUser.mockReturnValue({
      isPending: false,
      mutateAsync: jest.fn(),
    });
    mockUseUpdateUser.mockReturnValue({
      isPending: false,
      mutateAsync: jest.fn(),
    });
    mockUseDeleteUser.mockReturnValue({
      isPending: false,
      mutateAsync: deleteMutateAsync,
    });
    mockUseReactivateUser.mockReturnValue({
      isPending: false,
      mutateAsync: reactivateMutateAsync,
    });

    deleteMutateAsync.mockResolvedValue(undefined);
    reactivateMutateAsync.mockResolvedValue(undefined);
  });

  it('shows active and inactive user tabs', () => {
    renderWithProviders(<UserManagement />);

    expect(screen.getByText('Active (1)')).toBeInTheDocument();
    expect(screen.getByText('Inactive (1)')).toBeInTheDocument();
    expect(screen.getByText('1 active users')).toBeInTheDocument();
    expect(screen.getByText('ada@example.com')).toBeInTheDocument();
  });

  it('switches to inactive users and reactivates a user', async () => {
    const user = userEvent.setup();

    renderWithProviders(<UserManagement />);

    await user.click(screen.getByRole('tab', { name: 'Inactive (1)' }));

    expect(screen.getByText('1 inactive users')).toBeInTheDocument();
    expect(screen.getByText('grace@example.com')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Reactivate' }));

    await waitFor(() => {
      expect(reactivateMutateAsync).toHaveBeenCalledWith({
        id: 2,
        firstName: 'Grace',
        lastName: 'Hopper',
        email: 'grace@example.com',
        role: 'MANAGER',
      });
    });

    expect(mockToastSuccess).toHaveBeenCalledWith('User reactivated successfully');
    expect(activeRefetch).toHaveBeenCalled();
    expect(inactiveRefetch).toHaveBeenCalled();
  });
});
