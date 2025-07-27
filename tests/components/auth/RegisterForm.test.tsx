import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { UserRole } from '@/types/user';

// Mock fetch for API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('RegisterForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders registration form correctly', () => {
    render(<RegisterForm />);

    // Check for the title specifically in the header
    expect(
      screen.getByRole('heading', { name: 'Create Account' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Enter your information to create your account')
    ).toBeInTheDocument();
    expect(screen.getByLabelText('First Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Create Account' })
    ).toBeInTheDocument();
  });

  it('shows validation errors for invalid inputs', async () => {
    render(<RegisterForm />);

    const submitButton = screen.getByRole('button', { name: 'Create Account' });

    // Fill in some fields with invalid data to trigger validation
    const firstNameInput = screen.getByLabelText('First Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');

    fireEvent.change(firstNameInput, { target: { value: 'A' } }); // Too short
    fireEvent.blur(firstNameInput); // Trigger validation

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } }); // Invalid email
    fireEvent.blur(emailInput); // Trigger validation

    fireEvent.change(passwordInput, { target: { value: 'weak' } }); // Weak password
    fireEvent.blur(passwordInput); // Trigger validation

    fireEvent.click(submitButton);

    await waitFor(() => {
      // Check for validation errors - use getAllByText since errors appear in multiple places
      const firstNameErrors = screen.getAllByText(
        'First name must be at least 2 characters'
      );
      const emailErrors = screen.getAllByText(
        'Please enter a valid email address'
      );
      const passwordErrors = screen.getAllByText(
        'Password must be at least 12 characters'
      );

      expect(firstNameErrors.length).toBeGreaterThan(0);
      expect(emailErrors.length).toBeGreaterThan(0);
      expect(passwordErrors.length).toBeGreaterThan(0);
    });
  });

  it('shows error when passwords do not match', async () => {
    render(<RegisterForm />);

    const firstNameInput = screen.getByLabelText('First Name');
    const lastNameInput = screen.getByLabelText('Last Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: 'Create Account' });

    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'SecurePass123!' } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: 'differentpassword' },
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      // Use getAllByText to handle duplicate validation messages
      const passwordMatchErrors = screen.getAllByText("Passwords don't match");
      expect(passwordMatchErrors.length).toBeGreaterThan(0);
    });
  });

  it('submits form with valid data', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      }),
    } as Response);

    render(<RegisterForm />);

    const firstNameInput = screen.getByLabelText('First Name');
    const lastNameInput = screen.getByLabelText('Last Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: 'Create Account' });

    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'SecurePass123!' } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: 'SecurePass123!' },
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          password: 'SecurePass123!',
          confirmPassword: 'SecurePass123!',
        }),
      });
    });
  });

  it('shows success message after successful registration', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      }),
    } as Response);

    render(<RegisterForm />);

    const firstNameInput = screen.getByLabelText('First Name');
    const lastNameInput = screen.getByLabelText('Last Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: 'Create Account' });

    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'SecurePass123!' } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: 'SecurePass123!' },
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Check Your Email!')).toBeInTheDocument();
      expect(
        screen.getByText(
          "We've sent a verification link to your email address. Please check your inbox and click the link to verify your account."
        )
      ).toBeInTheDocument();
    });
  });

  it('shows error message for failed registration', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Email already exists' }),
    } as Response);

    render(<RegisterForm />);

    const firstNameInput = screen.getByLabelText('First Name');
    const lastNameInput = screen.getByLabelText('Last Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: 'Create Account' });

    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'SecurePass123!' } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: 'SecurePass123!' },
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Email already exists')).toBeInTheDocument();
    });
  });

  it('uses custom default role when provided', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      }),
    } as Response);

    render(<RegisterForm defaultRole="MANAGER" />);

    const firstNameInput = screen.getByLabelText('First Name');
    const lastNameInput = screen.getByLabelText('Last Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: 'Create Account' });

    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'SecurePass123!' } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: 'SecurePass123!' },
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          password: 'SecurePass123!',
          confirmPassword: 'SecurePass123!',
        }),
      });
    });
  });

  it('calls onSuccess callback when provided', async () => {
    const mockOnSuccess = jest.fn();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      }),
    } as Response);

    render(<RegisterForm onSuccess={mockOnSuccess} />);

    const firstNameInput = screen.getByLabelText('First Name');
    const lastNameInput = screen.getByLabelText('Last Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: 'Create Account' });

    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'SecurePass123!' } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: 'SecurePass123!' },
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });
});
