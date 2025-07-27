import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

// Mock fetch
global.fetch = jest.fn();

describe('ForgotPasswordForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the forgot password form', () => {
    render(<ForgotPasswordForm />);

    expect(screen.getByText('Reset Password')).toBeInTheDocument();
    expect(
      screen.getByText(
        "Enter your email address and we'll send you a reset link"
      )
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Send Reset Link' })
    ).toBeInTheDocument();
  });

  it('validates email input', async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    const emailInput = screen.getByPlaceholderText('Enter your email');
    const submitButton = screen.getByRole('button', {
      name: 'Send Reset Link',
    });

    // Type invalid email
    await user.type(emailInput, 'invalid-email');
    await user.tab(); // Trigger blur event to validate

    // Wait a bit to let React Hook Form process the validation
    await waitFor(
      () => {
        expect(
          screen.getByText('Please enter a valid email address')
        ).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('submits form with valid email', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Reset email sent' }),
    });

    render(<ForgotPasswordForm />);

    const emailInput = screen.getByPlaceholderText('Enter your email');
    const submitButton = screen.getByRole('button', {
      name: 'Send Reset Link',
    });

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: 'test@example.com' }),
      });
    });
  });

  it('shows success message after submission', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Reset email sent' }),
    });

    render(<ForgotPasswordForm />);

    const emailInput = screen.getByPlaceholderText('Enter your email');
    const submitButton = screen.getByRole('button', {
      name: 'Send Reset Link',
    });

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Check Your Email')).toBeInTheDocument();
      expect(
        screen.getByText(/If an account with that email exists/)
      ).toBeInTheDocument();
    });
  });

  it('shows error message on API failure', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Server error' }),
    });

    render(<ForgotPasswordForm />);

    const emailInput = screen.getByPlaceholderText('Enter your email');
    const submitButton = screen.getByRole('button', {
      name: 'Send Reset Link',
    });

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
  });

  it('allows resending email after success', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'Reset email sent' }),
    });

    render(<ForgotPasswordForm />);

    const emailInput = screen.getByPlaceholderText('Enter your email');
    const submitButton = screen.getByRole('button', {
      name: 'Send Reset Link',
    });

    // Submit form
    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText('Check Your Email')).toBeInTheDocument();
    });

    // Click "Send Another Email" button
    const resendButton = screen.getByRole('button', {
      name: 'Send Another Email',
    });
    await user.click(resendButton);

    // Should return to form
    await waitFor(() => {
      expect(screen.getByText('Reset Password')).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('Enter your email')
      ).toBeInTheDocument();
    });
  });
});
