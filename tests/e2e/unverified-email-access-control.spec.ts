import { test, expect } from '@playwright/test';

// Use a single test user for all tests to save email tokens
const TEST_USER = {
  email: 'baawapays+test-unverified-access@gmail.com',
  firstName: 'Unverified',
  lastName: 'User',
  password: 'StrongPassword123!',
};

test.describe('Unverified Email Users Access Control', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing data before each test
    await page.goto('/');
  });

  test.describe('Registration and Email Verification Flow', () => {
    test('should redirect unverified users to verify-email page after registration', async ({
      page,
    }) => {
      // Register a new user
      await page.goto('/register');
      await page.waitForSelector('form');

      await page.fill('input[name="firstName"]', TEST_USER.firstName);
      await page.fill('input[name="lastName"]', TEST_USER.lastName);
      await page.fill('input[name="email"]', TEST_USER.email);
      await page.fill('input[name="password"]', TEST_USER.password);
      await page.fill('input[name="confirmPassword"]', TEST_USER.password);

      await page.click('button[type="submit"]');

      // Should be redirected to check-email page
      await page.waitForURL(/\/check-email/, { timeout: 10000 });
      expect(page.url()).toContain('/check-email');
      expect(page.url()).toContain(
        `email=${encodeURIComponent(TEST_USER.email)}`
      );

      // Verify the check-email page content
      await expect(
        page.locator('[data-slot="card-title"]:has-text("Check Your Email")')
      ).toBeVisible();
      await expect(
        page.locator(
          "text=We've sent a verification link to your email address"
        )
      ).toBeVisible();

      console.log(
        '✅ Registration successful - redirected to check-email page'
      );
    });

    test('should prevent unverified users from accessing dashboard', async ({
      page,
    }) => {
      // Register a new user
      await page.goto('/register');
      await page.waitForSelector('form');

      await page.fill('input[name="firstName"]', TEST_USER.firstName);
      await page.fill('input[name="lastName"]', TEST_USER.lastName);
      await page.fill('input[name="email"]', TEST_USER.email);
      await page.fill('input[name="password"]', TEST_USER.password);
      await page.fill('input[name="confirmPassword"]', TEST_USER.password);

      await page.click('button[type="submit"]');

      // Wait for redirect to check-email
      await page.waitForURL(/\/check-email/, { timeout: 10000 });

      // Try to access dashboard directly
      await page.goto('/dashboard');

      // Should be redirected to login since user is not authenticated
      await page.waitForURL(/\/login/, { timeout: 5000 });
      expect(page.url()).toContain('/login');

      console.log('✅ Unverified user correctly blocked from dashboard access');
    });

    test('should prevent unverified users from accessing POS', async ({
      page,
    }) => {
      // Register a new user
      await page.goto('/register');
      await page.waitForSelector('form');

      await page.fill('input[name="firstName"]', TEST_USER.firstName);
      await page.fill('input[name="lastName"]', TEST_USER.lastName);
      await page.fill('input[name="email"]', TEST_USER.email);
      await page.fill('input[name="password"]', TEST_USER.password);
      await page.fill('input[name="confirmPassword"]', TEST_USER.password);

      await page.click('button[type="submit"]');

      // Wait for redirect to check-email
      await page.waitForURL(/\/check-email/, { timeout: 10000 });

      // Try to access POS directly
      await page.goto('/pos');

      // Should be redirected to login since user is not authenticated
      await page.waitForURL(/\/login/, { timeout: 5000 });
      expect(page.url()).toContain('/login');

      console.log('✅ Unverified user correctly blocked from POS access');
    });

    test('should prevent unverified users from accessing inventory', async ({
      page,
    }) => {
      // Register a new user
      await page.goto('/register');
      await page.waitForSelector('form');

      await page.fill('input[name="firstName"]', TEST_USER.firstName);
      await page.fill('input[name="lastName"]', TEST_USER.lastName);
      await page.fill('input[name="email"]', TEST_USER.email);
      await page.fill('input[name="password"]', TEST_USER.password);
      await page.fill('input[name="confirmPassword"]', TEST_USER.password);

      await page.click('button[type="submit"]');

      // Wait for redirect to check-email
      await page.waitForURL(/\/check-email/, { timeout: 10000 });

      // Try to access inventory directly
      await page.goto('/inventory');

      // Should be redirected to login since user is not authenticated
      await page.waitForURL(/\/login/, { timeout: 5000 });
      expect(page.url()).toContain('/login');

      console.log('✅ Unverified user correctly blocked from inventory access');
    });

    test('should prevent unverified users from accessing admin panel', async ({
      page,
    }) => {
      // Register a new user
      await page.goto('/register');
      await page.waitForSelector('form');

      await page.fill('input[name="firstName"]', TEST_USER.firstName);
      await page.fill('input[name="lastName"]', TEST_USER.lastName);
      await page.fill('input[name="email"]', TEST_USER.email);
      await page.fill('input[name="password"]', TEST_USER.password);
      await page.fill('input[name="confirmPassword"]', TEST_USER.password);

      await page.click('button[type="submit"]');

      // Wait for redirect to check-email
      await page.waitForURL(/\/check-email/, { timeout: 10000 });

      // Try to access admin panel directly
      await page.goto('/admin');

      // Should be redirected to login since user is not authenticated
      await page.waitForURL(/\/login/, { timeout: 5000 });
      expect(page.url()).toContain('/login');

      console.log('✅ Unverified user correctly blocked from admin access');
    });
  });

  test.describe('Email Verification Process', () => {
    test('should allow access to verify-email page without authentication', async ({
      page,
    }) => {
      // Try to access verify-email page directly
      await page.goto('/verify-email');

      // Wait for the page to load
      await page.waitForLoadState('networkidle');

      // Check if we can access the page by looking for any card content
      const cardContent = page.locator('[data-slot="card-title"]');
      await expect(cardContent).toBeVisible();

      // Log the actual content for debugging
      const cardText = await cardContent.textContent();
      console.log(`Card content: "${cardText}"`);

      expect(page.url()).toContain('/verify-email');

      console.log('✅ Verify-email page accessible without authentication');
    });

    test('should allow access to check-email page without authentication', async ({
      page,
    }) => {
      // Try to access check-email page directly
      await page.goto('/check-email?email=test@example.com');

      // Should be able to access the page (it's a public route)
      await expect(
        page.locator('[data-slot="card-title"]:has-text("Check Your Email")')
      ).toBeVisible();

      expect(page.url()).toContain('/check-email');

      console.log('✅ Check-email page accessible without authentication');
    });
  });

  test.describe('Session Management for Unverified Users', () => {
    test('should maintain unverified status across page refreshes', async ({
      page,
    }) => {
      // Register a new user
      await page.goto('/register');
      await page.waitForSelector('form');

      await page.fill('input[name="firstName"]', TEST_USER.firstName);
      await page.fill('input[name="lastName"]', TEST_USER.lastName);
      await page.fill('input[name="email"]', TEST_USER.email);
      await page.fill('input[name="password"]', TEST_USER.password);
      await page.fill('input[name="confirmPassword"]', TEST_USER.password);

      await page.click('button[type="submit"]');

      // Wait for redirect to check-email
      await page.waitForURL(/\/check-email/, { timeout: 10000 });

      // Refresh the page
      await page.reload();

      // Should still be on check-email page
      expect(page.url()).toContain('/check-email');

      // Try to access protected route
      await page.goto('/dashboard');

      // Should be redirected to login
      await page.waitForURL(/\/login/, { timeout: 5000 });
      expect(page.url()).toContain('/login');

      console.log('✅ Unverified status maintained across page refreshes');
    });

    test('should redirect to login when trying to access protected routes after logout', async ({
      page,
    }) => {
      // Register a new user
      await page.goto('/register');
      await page.waitForSelector('form');

      await page.fill('input[name="firstName"]', TEST_USER.firstName);
      await page.fill('input[name="lastName"]', TEST_USER.lastName);
      await page.fill('input[name="email"]', TEST_USER.email);
      await page.fill('input[name="password"]', TEST_USER.password);
      await page.fill('input[name="confirmPassword"]', TEST_USER.password);

      await page.click('button[type="submit"]');

      // Wait for redirect to check-email
      await page.waitForURL(/\/check-email/, { timeout: 10000 });

      // Go to logout
      await page.goto('/logout');

      // Should redirect to login
      await page.waitForURL(/\/login/, { timeout: 5000 });

      // Try to access protected route
      await page.goto('/dashboard');

      // Should still be redirected to login
      await page.waitForURL(/\/login/, { timeout: 5000 });
      expect(page.url()).toContain('/login');

      console.log('✅ Properly redirected to login after logout');
    });
  });

  test.describe('Public Route Access', () => {
    test('should allow access to all public routes', async ({ page }) => {
      const publicRoutes = [
        '/',
        '/login',
        '/register',
        '/forgot-password',
        '/check-email?email=test@example.com',
        '/verify-email',
        '/pending-approval',
        '/unauthorized',
      ];

      for (const route of publicRoutes) {
        await page.goto(route);

        // Should be able to access public routes
        expect(page.url()).toContain(route.split('?')[0]); // Remove query params for comparison

        console.log(`✅ Public route ${route} accessible`);
      }
    });
  });
});
