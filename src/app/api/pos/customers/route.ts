import { NextRequest, NextResponse } from 'next/server';
import { auth } from '#root/auth';
import { prisma } from '@/lib/db';
import { USER_ROLES, hasRole } from '@/lib/auth/roles';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to view customer data
    if (
      !hasRole(session.user.role, [
        USER_ROLES.ADMIN,
        USER_ROLES.MANAGER,
        USER_ROLES.STAFF,
      ])
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get search query from URL parameters
    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get('search')?.trim();
    const limit = parseInt(searchParams.get('limit') || '10');

    // If no search query, return empty results
    if (!searchQuery) {
      return NextResponse.json([]);
    }

    // Check if search query looks like a phone number or email
    const digitsOnly = searchQuery.replace(/\D/g, '');
    const isPhoneSearch = digitsOnly.length >= 5 && digitsOnly.length <= 15;
    const isEmailSearch = searchQuery.includes('@') && searchQuery.length >= 5;

    const results: any[] = [];

    // 1. Search in sales transactions (existing customers)
    if (searchQuery) {
      const searchConditions: Prisma.SalesTransactionWhereInput[] = [];

      if (isPhoneSearch) {
        // For phone searches, try exact match first, then partial match
        searchConditions.push(
          {
            customer_phone: {
              equals: searchQuery,
              mode: 'insensitive' as const,
            },
          },
          {
            customer_phone: {
              contains: digitsOnly,
              mode: 'insensitive' as const,
            },
          }
        );
      } else if (isEmailSearch) {
        // For email searches, try exact match first, then partial match
        searchConditions.push(
          {
            customer_email: {
              equals: searchQuery.toLowerCase(),
              mode: 'insensitive' as const,
            },
          },
          {
            customer_email: {
              contains: searchQuery,
              mode: 'insensitive' as const,
            },
          }
        );
      } else {
        // For general searches, search across all fields
        searchConditions.push(
          {
            customer_email: {
              contains: searchQuery,
              mode: 'insensitive' as const,
            },
          },
          {
            customer_name: {
              contains: searchQuery,
              mode: 'insensitive' as const,
            },
          },
          {
            customer_phone: {
              contains: searchQuery,
              mode: 'insensitive' as const,
            },
          }
        );
      }

      // Aggregate customer data from sales transactions
      const customers = await prisma.salesTransaction.groupBy({
        by: ['customer_email', 'customer_name', 'customer_phone'],
        where: {
          OR: searchConditions,
        },
        _sum: {
          total_amount: true,
        },
        _count: {
          id: true,
        },
        _max: {
          created_at: true,
        },
      });

      // Transform the customer data
      const customerData = customers
        .filter(
          customer =>
            customer.customer_email ||
            customer.customer_name ||
            customer.customer_phone
        )
        .map((customer, index) => {
          const totalSpent = customer._sum.total_amount || 0;
          const totalOrders = customer._count.id;
          const averageOrderValue =
            totalOrders > 0 ? Number(totalSpent) / totalOrders : 0;

          return {
            id: `customer-${customer.customer_email || customer.customer_phone || index}`,
            name: customer.customer_name || 'Unknown Customer',
            email: customer.customer_email || '',
            phone: customer.customer_phone || '',
            totalSpent: Number(totalSpent),
            totalOrders,
            lastPurchase:
              customer._max.created_at?.toISOString() ||
              new Date().toISOString(),
            averageOrderValue,
            rank: index + 1,
            type: 'customer', // Mark as customer
          };
        });

      results.push(...customerData);
    }

    // 2. Search in users table (staff/employees)
    if (searchQuery) {
      const userSearchConditions: Prisma.UserWhereInput[] = [];

      if (isPhoneSearch) {
        userSearchConditions.push(
          {
            phone: {
              equals: searchQuery,
              mode: 'insensitive' as const,
            },
          },
          {
            phone: {
              contains: digitsOnly,
              mode: 'insensitive' as const,
            },
          }
        );
      } else if (isEmailSearch) {
        userSearchConditions.push(
          {
            email: {
              equals: searchQuery.toLowerCase(),
              mode: 'insensitive' as const,
            },
          },
          {
            email: {
              contains: searchQuery,
              mode: 'insensitive' as const,
            },
          }
        );
      } else {
        userSearchConditions.push(
          {
            email: {
              contains: searchQuery,
              mode: 'insensitive' as const,
            },
          },
          {
            firstName: {
              contains: searchQuery,
              mode: 'insensitive' as const,
            },
          },
          {
            lastName: {
              contains: searchQuery,
              mode: 'insensitive' as const,
            },
          },
          {
            phone: {
              contains: searchQuery,
              mode: 'insensitive' as const,
            },
          }
        );
      }

      const users = await prisma.user.findMany({
        where: {
          OR: userSearchConditions,
          isActive: true, // Only active users
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          createdAt: true,
        },
      });

      // Transform user data to match customer format
      const userData = users.map((user, index) => ({
        id: `user-${user.id}`,
        name: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        phone: user.phone || '',
        totalSpent: 0, // Users don't have spending data
        totalOrders: 0, // Users don't have order data
        lastPurchase: user.createdAt?.toISOString() || new Date().toISOString(),
        averageOrderValue: 0,
        rank: results.length + index + 1,
        type: 'user', // Mark as user
        role: user.role, // Include role for users
      }));

      results.push(...userData);
    }

    // Sort results with exact matches first, then by type (users first), then by rank
    const sortedResults = results.sort((a, b) => {
      // Prioritize exact matches
      if (isPhoneSearch) {
        const aExactMatch =
          a.phone === searchQuery || a.phone?.replace(/\D/g, '') === digitsOnly;
        const bExactMatch =
          b.phone === searchQuery || b.phone?.replace(/\D/g, '') === digitsOnly;

        if (aExactMatch && !bExactMatch) return -1;
        if (!aExactMatch && bExactMatch) return 1;
      }

      if (isEmailSearch) {
        const aExactMatch = a.email.toLowerCase() === searchQuery.toLowerCase();
        const bExactMatch = b.email.toLowerCase() === searchQuery.toLowerCase();

        if (aExactMatch && !bExactMatch) return -1;
        if (!aExactMatch && bExactMatch) return 1;
      }

      // Then prioritize users (staff) over customers
      if (a.type === 'user' && b.type === 'customer') return -1;
      if (a.type === 'customer' && b.type === 'user') return 1;

      // Then sort by rank
      return a.rank - b.rank;
    });

    // Apply limit and update final ranks
    const limitedResults = sortedResults
      .slice(0, limit)
      .map((result, index) => ({
        ...result,
        rank: index + 1,
      }));

    return NextResponse.json(limitedResults);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to create customer data
    if (
      !hasRole(session.user.role, [
        USER_ROLES.ADMIN,
        USER_ROLES.MANAGER,
        USER_ROLES.STAFF,
      ])
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, phone } = body;

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if customer already exists (by email)
    const existingCustomer = await prisma.salesTransaction.findFirst({
      where: {
        customer_email: email.toLowerCase(),
      },
    });

    if (existingCustomer) {
      return NextResponse.json(
        { error: 'Customer with this email already exists' },
        { status: 409 }
      );
    }

    // Create a new customer by creating a placeholder transaction
    // This is a workaround since we don't have a separate customers table
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const transactionNumber = `CUST-${timestamp}-${randomSuffix}`;

    const newCustomerTransaction = await prisma.salesTransaction.create({
      data: {
        transaction_number: transactionNumber,
        customer_name: name,
        customer_email: email.toLowerCase(),
        customer_phone: phone || null,
        total_amount: new Prisma.Decimal(0),
        payment_status: 'completed',
        payment_method: 'customer_creation',
        created_at: new Date(),
        updated_at: new Date(),
        // Add other required fields with default values
        subtotal: new Prisma.Decimal(0),
        tax_amount: new Prisma.Decimal(0),
        discount_amount: new Prisma.Decimal(0),
        user_id: parseInt(session.user.id),
        transaction_type: 'customer_creation',
        notes: 'Customer created via management interface',
      },
    });

    const newCustomer = {
      id: email.toLowerCase(),
      name,
      email: email.toLowerCase(),
      phone: phone || null,
      totalSpent: 0,
      totalOrders: 1,
      lastPurchase: newCustomerTransaction.created_at?.toISOString() || null,
      averageOrderValue: 0,
      rank: 1,
      firstPurchase: newCustomerTransaction.created_at?.toISOString() || null,
      daysSinceLastPurchase: 0,
      customerLifetimeValue: 0,
      purchaseFrequency: 0,
    };

    return NextResponse.json({
      success: true,
      data: newCustomer,
      message: 'Customer created successfully',
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
