import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { ChangePasswordForm } from '@/components/account/ChangePasswordForm';
import {
  renderWithProviders,
  screen,
  waitFor,
} from '../../utils/test-providers';

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const validPassword = 'Abcd123.';

describe('ChangePasswordForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock) = jest.fn();
  });

  it('renders the change password form', () => {
    renderWithProviders(<ChangePasswordForm />);

    expect(screen.getByLabelText('Current Password')).toBeInTheDocument();
    expect(screen.getByLabelText('New Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm New Password')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Use at least 8 characters with uppercase, lowercase, number, and any symbol. Any symbol is allowed, including . and @.'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Change Password' })
    ).toBeInTheDocument();
  });

  it('validates weak new passwords', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChangePasswordForm />);

    await user.type(screen.getByLabelText('Current Password'), 'old-password');
    await user.type(screen.getByLabelText('New Password'), 'weak');
    await user.click(screen.getByRole('button', { name: 'Change Password' }));

    await waitFor(() => {
      expect(
        screen.getByText('Password must be at least 8 characters')
      ).toBeInTheDocument();
    });
  });

  it('validates mismatched confirmation', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChangePasswordForm />);

    await user.type(screen.getByLabelText('Current Password'), 'old-password');
    await user.type(screen.getByLabelText('New Password'), validPassword);
    await user.type(
      screen.getByLabelText('Confirm New Password'),
      'DifferentPass123!'
    );
    await user.click(screen.getByRole('button', { name: 'Change Password' }));

    await waitFor(() => {
      expect(screen.getByText("Passwords don't match")).toBeInTheDocument();
    });
  });

  it('submits valid password change data', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Password changed successfully' }),
    });

    renderWithProviders(<ChangePasswordForm />);

    await user.type(screen.getByLabelText('Current Password'), 'old-password');
    await user.type(screen.getByLabelText('New Password'), validPassword);
    await user.type(screen.getByLabelText('Confirm New Password'), validPassword);
    await user.click(screen.getByRole('button', { name: 'Change Password' }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/users/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: 'old-password',
          newPassword: validPassword,
          confirmPassword: validPassword,
        }),
      });
    });

    expect(toast.success).toHaveBeenCalledWith(
      'Your password has been changed successfully.'
    );
  });

  it('shows server errors via toast', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Current password is incorrect' }),
    });

    renderWithProviders(<ChangePasswordForm />);

    await user.type(screen.getByLabelText('Current Password'), 'old-password');
    await user.type(screen.getByLabelText('New Password'), validPassword);
    await user.type(screen.getByLabelText('Confirm New Password'), validPassword);
    await user.click(screen.getByRole('button', { name: 'Change Password' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Current password is incorrect'
      );
    });
  });
});
