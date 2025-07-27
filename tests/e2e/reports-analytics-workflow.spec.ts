import { test, expect } from '@playwright/test';
import {
  testUserHelper,
  APPROVED_ADMIN,
  APPROVED_MANAGER,
  APPROVED_STAFF,
} from './test-user-helper';

test.describe('Reports & Analytics Workflow', () => {
  test.beforeAll(async () => {
    await testUserHelper.initializeTestUsers();
  });

  test.describe('1. Dashboard Analytics', () => {
    test('should display dashboard metrics for admin', async ({ page }) => {
      // Login as admin
      await page.goto('/test-data');
      await page.evaluate(email => {
        localStorage.setItem('test-user-email', email);
        localStorage.setItem('test-user-status', 'APPROVED');
        localStorage.setItem('test-user-role', 'ADMIN');
      }, APPROVED_ADMIN.email);

      // Navigate to dashboard
      await page.goto('/dashboard');
      await expect(page).toHaveURL('/dashboard');

      // Should see dashboard elements
      await expect(page.locator('text=Dashboard')).toBeVisible();
      await expect(page.locator('text=Sales')).toBeVisible();
      await expect(page.locator('text=Inventory')).toBeVisible();
      await expect(page.locator('text=Products')).toBeVisible();
      await expect(page.locator('text=Revenue')).toBeVisible();

      console.log('✅ Dashboard displays all metrics for admin');
    });

    test('should display dashboard metrics for manager', async ({ page }) => {
      // Login as manager
      await page.goto('/test-data');
      await page.evaluate(email => {
        localStorage.setItem('test-user-email', email);
        localStorage.setItem('test-user-status', 'APPROVED');
        localStorage.setItem('test-user-role', 'MANAGER');
      }, APPROVED_MANAGER.email);

      // Navigate to dashboard
      await page.goto('/dashboard');
      await expect(page).toHaveURL('/dashboard');

      // Should see dashboard elements
      await expect(page.locator('text=Dashboard')).toBeVisible();
      await expect(page.locator('text=Sales')).toBeVisible();
      await expect(page.locator('text=Inventory')).toBeVisible();

      console.log('✅ Dashboard displays metrics for manager');
    });

    test('should display dashboard metrics for staff', async ({ page }) => {
      // Login as staff
      await page.goto('/test-data');
      await page.evaluate(email => {
        localStorage.setItem('test-user-email', email);
        localStorage.setItem('test-user-status', 'APPROVED');
        localStorage.setItem('test-user-role', 'STAFF');
      }, APPROVED_STAFF.email);

      // Navigate to dashboard
      await page.goto('/dashboard');
      await expect(page).toHaveURL('/dashboard');

      // Should see basic dashboard elements
      await expect(page.locator('text=Dashboard')).toBeVisible();

      console.log('✅ Dashboard displays basic metrics for staff');
    });
  });

  test.describe('2. Inventory Reports', () => {
    test('should allow manager to access inventory reports', async ({
      page,
    }) => {
      // Login as manager
      await page.goto('/test-data');
      await page.evaluate(email => {
        localStorage.setItem('test-user-email', email);
        localStorage.setItem('test-user-status', 'APPROVED');
        localStorage.setItem('test-user-role', 'MANAGER');
      }, APPROVED_MANAGER.email);

      // Navigate to inventory reports
      await page.goto('/inventory/reports');
      await expect(page).toHaveURL('/inventory/reports');

      // Should see reports interface
      await expect(page.locator('text=Reports')).toBeVisible();
      await expect(page.locator('text=Inventory Reports')).toBeVisible();

      console.log('✅ Manager can access inventory reports');
    });

    test('should allow admin to access inventory reports', async ({ page }) => {
      // Login as admin
      await page.goto('/test-data');
      await page.evaluate(email => {
        localStorage.setItem('test-user-email', email);
        localStorage.setItem('test-user-status', 'APPROVED');
        localStorage.setItem('test-user-role', 'ADMIN');
      }, APPROVED_ADMIN.email);

      // Navigate to inventory reports
      await page.goto('/inventory/reports');
      await expect(page).toHaveURL('/inventory/reports');

      // Should see reports interface
      await expect(page.locator('text=Reports')).toBeVisible();
      await expect(page.locator('text=Inventory Reports')).toBeVisible();

      console.log('✅ Admin can access inventory reports');
    });

    test('should block staff from inventory reports', async ({ page }) => {
      // Login as staff
      await page.goto('/test-data');
      await page.evaluate(email => {
        localStorage.setItem('test-user-email', email);
        localStorage.setItem('test-user-status', 'APPROVED');
        localStorage.setItem('test-user-role', 'STAFF');
      }, APPROVED_STAFF.email);

      // Try to access inventory reports
      await page.goto('/inventory/reports');
      await expect(page).toHaveURL('/unauthorized');

      console.log('✅ Staff correctly blocked from inventory reports');
    });

    test('should display low stock report', async ({ page }) => {
      // Login as manager
      await page.goto('/test-data');
      await page.evaluate(email => {
        localStorage.setItem('test-user-email', email);
        localStorage.setItem('test-user-status', 'APPROVED');
        localStorage.setItem('test-user-role', 'MANAGER');
      }, APPROVED_MANAGER.email);

      // Navigate to low stock page
      await page.goto('/inventory/low-stock');
      await expect(page).toHaveURL('/inventory/low-stock');

      // Should see low stock interface
      await expect(page.locator('text=Low Stock')).toBeVisible();
      await expect(page.locator('text=Products')).toBeVisible();

      console.log('✅ Low stock report displayed');
    });

    test('should display stock value report', async ({ page }) => {
      // Login as manager
      await page.goto('/test-data');
      await page.evaluate(email => {
        localStorage.setItem('test-user-email', email);
        localStorage.setItem('test-user-status', 'APPROVED');
        localStorage.setItem('test-user-role', 'MANAGER');
      }, APPROVED_MANAGER.email);

      // Navigate to inventory reports
      await page.goto('/inventory/reports');

      // Should see stock value metrics
      await expect(page.locator('text=Stock Value')).toBeVisible();
      await expect(page.locator('text=Total Value')).toBeVisible();

      console.log('✅ Stock value report displayed');
    });
  });

  test.describe('3. Sales Reports', () => {
    test('should allow manager to access sales reports', async ({ page }) => {
      // Login as manager
      await page.goto('/test-data');
      await page.evaluate(email => {
        localStorage.setItem('test-user-email', email);
        localStorage.setItem('test-user-status', 'APPROVED');
        localStorage.setItem('test-user-role', 'MANAGER');
      }, APPROVED_MANAGER.email);

      // Navigate to POS history (sales reports)
      await page.goto('/pos/history');
      await expect(page).toHaveURL('/pos/history');

      // Should see transaction history
      await expect(page.locator('text=Transaction History')).toBeVisible();
      await expect(page.locator('text=Sales')).toBeVisible();

      console.log('✅ Manager can access sales reports');
    });

    test('should allow staff to access transaction history', async ({
      page,
    }) => {
      // Login as staff
      await page.goto('/test-data');
      await page.evaluate(email => {
        localStorage.setItem('test-user-email', email);
        localStorage.setItem('test-user-status', 'APPROVED');
        localStorage.setItem('test-user-role', 'STAFF');
      }, APPROVED_STAFF.email);

      // Navigate to POS history
      await page.goto('/pos/history');
      await expect(page).toHaveURL('/pos/history');

      // Should see transaction history
      await expect(page.locator('text=Transaction History')).toBeVisible();

      console.log('✅ Staff can access transaction history');
    });

    test('should display sales metrics', async ({ page }) => {
      // Login as manager
      await page.goto('/test-data');
      await page.evaluate(email => {
        localStorage.setItem('test-user-email', email);
        localStorage.setItem('test-user-status', 'APPROVED');
        localStorage.setItem('test-user-role', 'MANAGER');
      }, APPROVED_MANAGER.email);

      // Navigate to POS history
      await page.goto('/pos/history');

      // Should see sales metrics
      await expect(page.locator('text=Total Sales')).toBeVisible();
      await expect(page.locator('text=Transactions')).toBeVisible();

      console.log('✅ Sales metrics displayed');
    });

    test('should filter transactions by date', async ({ page }) => {
      // Login as manager
      await page.goto('/test-data');
      await page.evaluate(email => {
        localStorage.setItem('test-user-email', email);
        localStorage.setItem('test-user-status', 'APPROVED');
        localStorage.setItem('test-user-role', 'MANAGER');
      }, APPROVED_MANAGER.email);

      // Navigate to POS history
      await page.goto('/pos/history');

      // Should see date filter options
      await expect(page.locator('text=Date Range')).toBeVisible();
      await expect(page.locator('text=Filter')).toBeVisible();

      console.log('✅ Date filtering available');
    });
  });

  test.describe('4. Supplier Reports', () => {
    test('should allow manager to access supplier reports', async ({
      page,
    }) => {
      // Login as manager
      await page.goto('/test-data');
      await page.evaluate(email => {
        localStorage.setItem('test-user-email', email);
        localStorage.setItem('test-user-status', 'APPROVED');
        localStorage.setItem('test-user-role', 'MANAGER');
      }, APPROVED_MANAGER.email);

      // Navigate to suppliers
      await page.goto('/inventory/suppliers');
      await expect(page).toHaveURL('/inventory/suppliers');

      // Should see supplier management interface
      await expect(page.locator('text=Suppliers')).toBeVisible();
      await expect(page.locator('text=Add Supplier')).toBeVisible();

      console.log('✅ Manager can access supplier reports');
    });

    test('should display supplier performance metrics', async ({ page }) => {
      // Login as manager
      await page.goto('/test-data');
      await page.evaluate(email => {
        localStorage.setItem('test-user-email', email);
        localStorage.setItem('test-user-status', 'APPROVED');
        localStorage.setItem('test-user-role', 'MANAGER');
      }, APPROVED_MANAGER.email);

      // Navigate to suppliers
      await page.goto('/inventory/suppliers');

      // Should see supplier metrics
      await expect(page.locator('text=Total Suppliers')).toBeVisible();
      await expect(page.locator('text=Active Suppliers')).toBeVisible();

      console.log('✅ Supplier performance metrics displayed');
    });
  });

  test.describe('6. Data Export Functionality', () => {
    test('should allow export of inventory data', async ({ page }) => {
      // Login as manager
      await page.goto('/test-data');
      await page.evaluate(email => {
        localStorage.setItem('test-user-email', email);
        localStorage.setItem('test-user-status', 'APPROVED');
        localStorage.setItem('test-user-role', 'MANAGER');
      }, APPROVED_MANAGER.email);

      // Navigate to inventory reports
      await page.goto('/inventory/reports');

      // Should see export options
      await expect(page.locator('text=Export')).toBeVisible();
      await expect(page.locator('text=CSV')).toBeVisible();

      console.log('✅ Inventory data export available');
    });

    test('should allow export of sales data', async ({ page }) => {
      // Login as manager
      await page.goto('/test-data');
      await page.evaluate(email => {
        localStorage.setItem('test-user-email', email);
        localStorage.setItem('test-user-status', 'APPROVED');
        localStorage.setItem('test-user-role', 'MANAGER');
      }, APPROVED_MANAGER.email);

      // Navigate to POS history
      await page.goto('/pos/history');

      // Should see export options
      await expect(page.locator('text=Export')).toBeVisible();
      await expect(page.locator('text=Download')).toBeVisible();

      console.log('✅ Sales data export available');
    });
  });

  test.describe('7. Analytics Charts and Graphs', () => {
    test('should display sales charts', async ({ page }) => {
      // Login as manager
      await page.goto('/test-data');
      await page.evaluate(email => {
        localStorage.setItem('test-user-email', email);
        localStorage.setItem('test-user-status', 'APPROVED');
        localStorage.setItem('test-user-role', 'MANAGER');
      }, APPROVED_MANAGER.email);

      // Navigate to dashboard
      await page.goto('/dashboard');

      // Should see sales charts
      await expect(page.locator('text=Sales Chart')).toBeVisible();
      await expect(page.locator('text=Revenue')).toBeVisible();

      console.log('✅ Sales charts displayed');
    });

    test('should display inventory charts', async ({ page }) => {
      // Login as manager
      await page.goto('/test-data');
      await page.evaluate(email => {
        localStorage.setItem('test-user-email', email);
        localStorage.setItem('test-user-status', 'APPROVED');
        localStorage.setItem('test-user-role', 'MANAGER');
      }, APPROVED_MANAGER.email);

      // Navigate to inventory reports
      await page.goto('/inventory/reports');

      // Should see inventory charts
      await expect(page.locator('text=Stock Levels')).toBeVisible();
      await expect(page.locator('text=Category Distribution')).toBeVisible();

      console.log('✅ Inventory charts displayed');
    });

    test('should display performance metrics', async ({ page }) => {
      // Login as manager
      await page.goto('/test-data');
      await page.evaluate(email => {
        localStorage.setItem('test-user-email', email);
        localStorage.setItem('test-user-status', 'APPROVED');
        localStorage.setItem('test-user-role', 'MANAGER');
      }, APPROVED_MANAGER.email);

      // Navigate to dashboard
      await page.goto('/dashboard');

      // Should see performance metrics
      await expect(page.locator('text=Performance')).toBeVisible();
      await expect(page.locator('text=Metrics')).toBeVisible();

      console.log('✅ Performance metrics displayed');
    });
  });

  test.describe('8. Real-time Dashboard Updates', () => {
    test('should update dashboard in real-time', async ({ page }) => {
      // Login as manager
      await page.goto('/test-data');
      await page.evaluate(email => {
        localStorage.setItem('test-user-email', email);
        localStorage.setItem('test-user-status', 'APPROVED');
        localStorage.setItem('test-user-role', 'MANAGER');
      }, APPROVED_MANAGER.email);

      // Navigate to dashboard
      await page.goto('/dashboard');

      // Should see real-time indicators
      await expect(page.locator('text=Live')).toBeVisible();
      await expect(page.locator('text=Updated')).toBeVisible();

      console.log('✅ Real-time dashboard updates available');
    });

    test('should refresh data automatically', async ({ page }) => {
      // Login as manager
      await page.goto('/test-data');
      await page.evaluate(email => {
        localStorage.setItem('test-user-email', email);
        localStorage.setItem('test-user-status', 'APPROVED');
        localStorage.setItem('test-user-role', 'MANAGER');
      }, APPROVED_MANAGER.email);

      // Navigate to dashboard
      await page.goto('/dashboard');

      // Should see refresh indicators
      await expect(page.locator('text=Auto-refresh')).toBeVisible();

      console.log('✅ Auto-refresh functionality available');
    });
  });

  test.describe('9. Report Scheduling', () => {
    test('should allow report scheduling for admin', async ({ page }) => {
      // Login as admin
      await page.goto('/test-data');
      await page.evaluate(email => {
        localStorage.setItem('test-user-email', email);
        localStorage.setItem('test-user-status', 'APPROVED');
        localStorage.setItem('test-user-role', 'ADMIN');
      }, APPROVED_ADMIN.email);

      // Navigate to reports
      await page.goto('/inventory/reports');

      // Should see scheduling options
      await expect(page.locator('text=Schedule')).toBeVisible();
      await expect(page.locator('text=Email Reports')).toBeVisible();

      console.log('✅ Report scheduling available for admin');
    });

    test('should block non-admin from report scheduling', async ({ page }) => {
      // Login as manager
      await page.goto('/test-data');
      await page.evaluate(email => {
        localStorage.setItem('test-user-email', email);
        localStorage.setItem('test-user-status', 'APPROVED');
        localStorage.setItem('test-user-role', 'MANAGER');
      }, APPROVED_MANAGER.email);

      // Navigate to reports
      await page.goto('/inventory/reports');

      // Should not see scheduling options
      await expect(page.locator('text=Schedule')).not.toBeVisible();

      console.log('✅ Non-admin correctly blocked from report scheduling');
    });
  });

  test.describe('10. Custom Report Builder', () => {
    test('should allow admin to create custom reports', async ({ page }) => {
      // Login as admin
      await page.goto('/test-data');
      await page.evaluate(email => {
        localStorage.setItem('test-user-email', email);
        localStorage.setItem('test-user-status', 'APPROVED');
        localStorage.setItem('test-user-role', 'ADMIN');
      }, APPROVED_ADMIN.email);

      // Navigate to reports
      await page.goto('/inventory/reports');

      // Should see custom report builder
      await expect(page.locator('text=Custom Reports')).toBeVisible();
      await expect(page.locator('text=Build Report')).toBeVisible();

      console.log('✅ Custom report builder available for admin');
    });

    test('should allow filtering and sorting in reports', async ({ page }) => {
      // Login as manager
      await page.goto('/test-data');
      await page.evaluate(email => {
        localStorage.setItem('test-user-email', email);
        localStorage.setItem('test-user-status', 'APPROVED');
        localStorage.setItem('test-user-role', 'MANAGER');
      }, APPROVED_MANAGER.email);

      // Navigate to reports
      await page.goto('/inventory/reports');

      // Should see filtering options
      await expect(page.locator('text=Filter')).toBeVisible();
      await expect(page.locator('text=Sort')).toBeVisible();

      console.log('✅ Filtering and sorting available in reports');
    });
  });
});
