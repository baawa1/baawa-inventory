import { fireEvent } from '@testing-library/react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/auth/LoginForm';
import { renderWithProviders, screen, waitFor } from '../../utils/test-providers';

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const mockSignIn = signIn as jest.MockedFunction<typeof signIn>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe('LoginForm', () => {
  const mockPush = jest.fn();
  const mockRefresh = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    } as any);
  });

  it('renders login form correctly', () => {
    renderWithProviders(<LoginForm />);

    // Check for the correct title and description text
    expect(
      screen.getByText('Enter your credentials to access your account')
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('prevents form submission when fields are empty', async () => {
    renderWithProviders(<LoginForm />);

    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    // Submit the form with empty fields (default state)
    fireEvent.click(submitButton);

    // The most important test: Check that signIn was not called due to validation failure
    expect(mockSignIn).not.toHaveBeenCalled();

    // Additional verification: The button should still be enabled (not in loading state)
    expect(submitButton).not.toHaveTextContent('Signing in...');
    expect(submitButton).toHaveTextContent('Sign in');
  });

  it('submits form with valid credentials', async () => {
    mockSignIn.mockResolvedValue({ ok: true, error: null } as any);

    renderWithProviders(<LoginForm />);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('credentials', {
        email: 'test@example.com',
        password: 'password123',
        callbackUrl: '/dashboard',
        redirect: false,
      });
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('shows error message for invalid credentials', async () => {
    mockSignIn.mockResolvedValue({
      ok: false,
      error: 'Invalid credentials',
    } as any);

    renderWithProviders(<LoginForm />);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Invalid email or password. Please try again.')
      ).toBeInTheDocument();
    });
  });

  it('uses callback URL when provided', async () => {
    mockSignIn.mockResolvedValue({ ok: true, error: null } as any);

    renderWithProviders(<LoginForm callbackUrl="/admin/dashboard" />);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin/dashboard');
    });
  });

  it('shows loading state during submission', async () => {
    mockSignIn.mockImplementation(
      () =>
        new Promise(resolve =>
          setTimeout(() => resolve({ ok: true, error: null } as any), 100)
        )
    );

    renderWithProviders(<LoginForm />);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Signing in...' })
      ).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });
});
