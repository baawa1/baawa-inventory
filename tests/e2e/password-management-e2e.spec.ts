import { test, expect } from '@playwright/test';
import { TestAuthHelper } from './test-auth-helper';
import { APPROVED_ADMIN } from './test-user-helper';

process.env.E2E_USE_TEST_AUTH = '1';

const validPassword = 'Abcd123.';

test.describe('Password Management Browser Flows', () => {
  test('register accepts the relaxed password rule and redirects to check-email', async ({
    page,
  }) => {
    await page.route('/api/auth/register', async route => {
      const body = JSON.parse(route.request().postData() || '{}');

      expect(body.password).toBe(validPassword);
      expect(body.confirmPassword).toBe(validPassword);

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Registration successful',
        }),
      });
    });

    await page.goto('/register');

    await page.getByTestId('firstName-input').fill('Jane');
    await page.getByTestId('lastName-input').fill('Doe');
    await page.getByTestId('email-input').fill('jane.password.flow@example.com');
    await page.getByTestId('password-input').fill(validPassword);
    await page.getByTestId('confirmPassword-input').fill(validPassword);
    await page.getByTestId('register-button').click();

    await expect(page).toHaveURL(
      /\/check-email\?email=jane\.password\.flow%40example\.com/
    );
  });

  test('register blocks passwords without a symbol before submit', async ({
    page,
  }) => {
    await page.goto('/register');

    await page.getByTestId('firstName-input').fill('Jane');
    await page.getByTestId('lastName-input').fill('Doe');
    await page.getByTestId('email-input').fill('jane.validation@example.com');
    await page.getByTestId('password-input').fill('StrongPass123');
    await page.getByTestId('confirmPassword-input').fill('StrongPass123');
    await page.getByTestId('register-button').click();

    await expect(
      page.getByTestId('password-error')
    ).toBeVisible();
  });

  test('approved users can submit a password change with the relaxed rule', async ({
    page,
  }) => {
    await TestAuthHelper.loginUser(page, APPROVED_ADMIN);

    await page.route('/api/users/change-password', async route => {
      const body = JSON.parse(route.request().postData() || '{}');

      expect(body.currentPassword).toBe(APPROVED_ADMIN.password);
      expect(body.newPassword).toBe(validPassword);
      expect(body.confirmPassword).toBe(validPassword);

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Password changed successfully',
        }),
      });
    });

    await page.goto('/account');
    await page.getByRole('tab', { name: 'Security' }).click();

    const newPasswordInput = page.locator('input[name="newPassword"]');
    const confirmPasswordInput = page.locator('input[name="confirmPassword"]');

    await page.getByLabel('Current Password').fill(APPROVED_ADMIN.password);
    await newPasswordInput.fill(validPassword);
    await confirmPasswordInput.fill(validPassword);
    await page.getByRole('button', { name: 'Change Password' }).click();

    await expect(newPasswordInput).toHaveValue('');
    await expect(confirmPasswordInput).toHaveValue('');
  });

  test('approved users see password validation errors on account security form', async ({
    page,
  }) => {
    await TestAuthHelper.loginUser(page, APPROVED_ADMIN);
    await page.goto('/account');
    await page.getByRole('tab', { name: 'Security' }).click();

    const newPasswordInput = page.locator('input[name="newPassword"]');

    await page.getByLabel('Current Password').fill(APPROVED_ADMIN.password);
    await newPasswordInput.fill('weak');
    await page.getByRole('button', { name: 'Change Password' }).click();

    await expect(
      page.getByText('Password must be at least 8 characters')
    ).toBeVisible();
  });
});
