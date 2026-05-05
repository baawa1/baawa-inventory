import userEvent from '@testing-library/user-event';
import { UserForm } from '@/components/admin/UserForm';
import {
  renderWithProviders,
  screen,
  waitFor,
} from '../../utils/test-providers';

const validPassword = 'Abcd123.';

describe('UserForm', () => {
  const onSubmitAction = jest.fn();
  const onCancelAction = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    onSubmitAction.mockResolvedValue(undefined);
  });

  it('validates weak passwords when creating a user', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <UserForm
        onSubmitAction={onSubmitAction}
        onCancelAction={onCancelAction}
        isSubmitting={false}
      />
    );

    await user.type(screen.getByLabelText('First Name'), 'Jane');
    await user.type(screen.getByLabelText('Last Name'), 'Doe');
    await user.type(screen.getByLabelText('Email'), 'jane@example.com');
    await user.type(screen.getByLabelText('Password'), 'weak');
    await user.type(screen.getByLabelText('Confirm Password'), 'weak');
    await user.click(screen.getByRole('button', { name: 'Create User' }));

    await waitFor(() => {
      expect(
        screen.getByText('Password must be at least 8 characters')
      ).toBeInTheDocument();
    });

    expect(onSubmitAction).not.toHaveBeenCalled();
  });

  it('validates password confirmation when creating a user', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <UserForm
        onSubmitAction={onSubmitAction}
        onCancelAction={onCancelAction}
        isSubmitting={false}
      />
    );

    await user.type(screen.getByLabelText('First Name'), 'Jane');
    await user.type(screen.getByLabelText('Last Name'), 'Doe');
    await user.type(screen.getByLabelText('Email'), 'jane@example.com');
    await user.type(screen.getByLabelText('Password'), validPassword);
    await user.type(
      screen.getByLabelText('Confirm Password'),
      'DifferentPass123!'
    );
    await user.click(screen.getByRole('button', { name: 'Create User' }));

    await waitFor(() => {
      expect(screen.getByText("Passwords don't match")).toBeInTheDocument();
    });
  });

  it('submits valid create-user data with the relaxed password rule', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <UserForm
        onSubmitAction={onSubmitAction}
        onCancelAction={onCancelAction}
        isSubmitting={false}
      />
    );

    await user.type(screen.getByLabelText('First Name'), 'Jane');
    await user.type(screen.getByLabelText('Last Name'), 'Doe');
    await user.type(screen.getByLabelText('Email'), 'jane@example.com');
    await user.type(screen.getByLabelText('Password'), validPassword);
    await user.type(screen.getByLabelText('Confirm Password'), validPassword);
    await user.click(screen.getByRole('button', { name: 'Create User' }));

    await waitFor(() => {
      expect(onSubmitAction).toHaveBeenCalledWith({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        role: 'STAFF',
        userStatus: 'APPROVED',
        password: validPassword,
        confirmPassword: validPassword,
      });
    });
  });

  it('hides password fields when editing an existing user', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <UserForm
        user={{
          id: 1,
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@example.com',
          role: 'MANAGER',
          userStatus: 'APPROVED',
          isActive: true,
          createdAt: new Date().toISOString(),
        }}
        onSubmitAction={onSubmitAction}
        onCancelAction={onCancelAction}
        isSubmitting={false}
      />
    );

    expect(screen.queryByLabelText('Password')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Confirm Password')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Update User' }));

    await waitFor(() => {
      expect(onSubmitAction).toHaveBeenCalledWith({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        role: 'MANAGER',
        userStatus: 'APPROVED',
      });
    });
  });

  it('calls onCancelAction when cancel is pressed', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <UserForm
        onSubmitAction={onSubmitAction}
        onCancelAction={onCancelAction}
        isSubmitting={false}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancelAction).toHaveBeenCalled();
  });
});
