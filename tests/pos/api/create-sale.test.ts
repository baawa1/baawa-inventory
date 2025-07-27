import { test, expect } from '@playwright/test';
import { testUserHelper, APPROVED_STAFF } from '../../e2e/test-user-helper';

test.describe('POS Create Sale API Tests', () => {
  test.beforeAll(async () => {
    await testUserHelper.initializeTestUsers();
  });

  test('should create sale successfully with valid data', async ({
    request,
  }) => {
    // Login as staff
    const loginResponse = await request.post('/api/auth/signin', {
      data: {
        email: APPROVED_STAFF.email,
        password: APPROVED_STAFF.password,
      },
    });

    expect(loginResponse.ok()).toBeTruthy();

    // Get cookies for authenticated request
    const cookies = loginResponse.headers()['set-cookie'];

    // Create sale data
    const saleData = {
      items: [
        {
          productId: 1, // Assuming product with ID 1 exists
          quantity: 2,
          price: 8500.0,
          total: 17000.0,
        },
      ],
      subtotal: 17000.0,
      discount: 0,
      total: 17000.0,
      paymentMethod: 'CASH',
      customerName: 'John Doe',
      customerPhone: '+2347087367278',
      customerEmail: 'john.doe@example.com',
      amountPaid: 17000.0,
      notes: 'Test sale',
    };

    // Create sale
    const createSaleResponse = await request.post('/api/pos/create-sale', {
      data: saleData,
      headers: {
        'Content-Type': 'application/json',
        ...(cookies && { Cookie: cookies }),
      },
    });

    expect(createSaleResponse.ok()).toBeTruthy();

    const responseData = await createSaleResponse.json();
    expect(responseData).toHaveProperty('success', true);
    expect(responseData).toHaveProperty('saleId');
    expect(responseData).toHaveProperty('transactionNumber');
    expect(responseData).toHaveProperty('message', 'Sale created successfully');

    console.log('✅ Create sale API works correctly');
  });

  test('should reject sale with invalid data', async ({ request }) => {
    // Login as staff
    const loginResponse = await request.post('/api/auth/signin', {
      data: {
        email: APPROVED_STAFF.email,
        password: APPROVED_STAFF.password,
      },
    });

    expect(loginResponse.ok()).toBeTruthy();

    // Get cookies for authenticated request
    const cookies = loginResponse.headers()['set-cookie'];

    // Create invalid sale data (negative quantity)
    const invalidSaleData = {
      items: [
        {
          productId: 1,
          quantity: -1, // Invalid negative quantity
          price: 8500.0,
          total: -8500.0,
        },
      ],
      subtotal: -8500.0,
      discount: 0,
      total: -8500.0,
      paymentMethod: 'CASH',
      amountPaid: -8500.0,
    };

    // Create sale
    const createSaleResponse = await request.post('/api/pos/create-sale', {
      data: invalidSaleData,
      headers: {
        'Content-Type': 'application/json',
        ...(cookies && { Cookie: cookies }),
      },
    });

    expect(createSaleResponse.status()).toBe(400);

    const errorData = await createSaleResponse.json();
    expect(errorData).toHaveProperty('error', 'Validation error');
    expect(errorData).toHaveProperty('details');

    console.log('✅ Invalid sale data properly rejected');
  });

  test('should reject sale without authentication', async ({ request }) => {
    // Create sale data without authentication
    const saleData = {
      items: [
        {
          productId: 1,
          quantity: 1,
          price: 8500.0,
          total: 8500.0,
        },
      ],
      subtotal: 8500.0,
      discount: 0,
      total: 8500.0,
      paymentMethod: 'CASH',
      amountPaid: 8500.0,
    };

    // Create sale without authentication
    const createSaleResponse = await request.post('/api/pos/create-sale', {
      data: saleData,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    expect(createSaleResponse.status()).toBe(401);

    const errorData = await createSaleResponse.json();
    expect(errorData).toHaveProperty('error', 'Authentication required');

    console.log('✅ Unauthenticated requests properly rejected');
  });

  test('should handle split payments correctly', async ({ request }) => {
    // Login as staff
    const loginResponse = await request.post('/api/auth/signin', {
      data: {
        email: APPROVED_STAFF.email,
        password: APPROVED_STAFF.password,
      },
    });

    expect(loginResponse.ok()).toBeTruthy();

    // Get cookies for authenticated request
    const cookies = loginResponse.headers()['set-cookie'];

    // Create sale data with split payments
    const saleData = {
      items: [
        {
          productId: 1,
          quantity: 1,
          price: 8500.0,
          total: 8500.0,
        },
      ],
      subtotal: 8500.0,
      discount: 0,
      total: 8500.0,
      paymentMethod: 'split',
      amountPaid: 8500.0,
      splitPayments: [
        {
          id: '1',
          amount: 5000.0,
          method: 'CASH',
        },
        {
          id: '2',
          amount: 3500.0,
          method: 'POS_MACHINE',
        },
      ],
    };

    // Create sale
    const createSaleResponse = await request.post('/api/pos/create-sale', {
      data: saleData,
      headers: {
        'Content-Type': 'application/json',
        ...(cookies && { Cookie: cookies }),
      },
    });

    expect(createSaleResponse.ok()).toBeTruthy();

    const responseData = await createSaleResponse.json();
    expect(responseData).toHaveProperty('success', true);
    expect(responseData).toHaveProperty('saleId');

    console.log('✅ Split payment sale created successfully');
  });
});
