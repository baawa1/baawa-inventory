import { NextRequest, NextResponse } from 'next/server';
import { auth } from '#root/auth';
import { prisma } from '@/lib/db';
import { USER_ROLES, hasRole } from '@/lib/auth/roles';
import { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';
import { SUCCESSFUL_PAYMENT_STATUSES } from '@/lib/constants';
import { getPhoneSearchPatterns } from '@/lib/utils/phone-utils';

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
    const limit = parseInt(searchParams.get('limit') || '100');

    // If no search query, return all active customers (limited by limit)
    if (!searchQuery) {
      try {
        const customers = await prisma.customer.findMany({
          where: {
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            city: true,
            state: true,
            postalCode: true,
            country: true,
            customerType: true,
            billingAddress: true,
            shippingAddress: true,
            notes: true,
            createdAt: true,
            salesTransactions: {
              where: {
                payment_status: {
                  in: SUCCESSFUL_PAYMENT_STATUSES,
                },
              },
              select: {
                id: true,
                total_amount: true,
                created_at: true,
                payment_status: true,
              },
              orderBy: {
                created_at: 'desc',
              },
            },
          },
          take: limit,
          orderBy: {
            createdAt: 'desc',
          },
        });

        // Transform customer data with proper calculations
        const allCustomers = customers.map((customer: any, index: number) => {
          const successfulTransactions = customer.salesTransactions || [];
          const totalSpent = successfulTransactions.reduce(
            (sum: number, t: any) => sum + Number(t.total_amount || 0),
            0
          );
          const totalOrders = successfulTransactions.length;
          const averageOrderValue =
            totalOrders > 0 ? totalSpent / totalOrders : 0;
          const lastPurchase =
            successfulTransactions[0]?.created_at || customer.createdAt;

          return {
            id: customer.id.toString(),
            name: customer.name || 'Unknown Customer',
            email: customer.email || '',
            phone: customer.phone || '',
            city: customer.city || '',
            state: customer.state || '',
            postalCode: customer.postalCode || '',
            country: customer.country || 'Nigeria',
            customerType: customer.customerType || 'individual',
            billingAddress: customer.billingAddress || '',
            shippingAddress: customer.shippingAddress || '',
            notes: customer.notes || '',
            source: 'customer_table',
            lastPurchase: lastPurchase,
            lastAmount: successfulTransactions[0]
              ? Number(successfulTransactions[0].total_amount)
              : undefined,
            priority: 1,
            totalSpent: totalSpent,
            totalOrders: totalOrders,
            averageOrderValue: averageOrderValue,
            rank: index + 1,
          };
        });

        return NextResponse.json(allCustomers);
      } catch (error) {
        logger.error('Error fetching all customers', {
          error: error instanceof Error ? error.message : String(error),
        });
        return NextResponse.json(
          { error: 'Failed to fetch customers' },
          { status: 500 }
        );
      }
    }

    // Check if search query looks like a phone number or email
    const digitsOnly = searchQuery.replace(/\D/g, '');
    const isPhoneSearch = digitsOnly.length >= 5 && digitsOnly.length <= 15;
    const isEmailSearch = searchQuery.includes('@') && searchQuery.length >= 5;

    const results: Array<{
      id: string;
      name: string;
      email: string;
      phone?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
      customerType?: string;
      billingAddress?: string;
      shippingAddress?: string;
      notes?: string;
      source?: string;
      lastPurchase?: Date | string;
      lastAmount?: number;
      priority?: number;
      totalSpent?: number;
      totalOrders?: number;
      averageOrderValue?: number;
      rank?: number;
      type?: string;
      role?: string;
    }> = [];

    // 1. Search in Customer table first (prioritize dedicated customer records)
    if (searchQuery) {
      interface CustomerSearchCondition {
        phone?: { equals?: string; contains?: string; mode?: 'insensitive' };
        email?: { equals?: string; contains?: string; mode?: 'insensitive' };
        name?: { contains?: string; mode?: 'insensitive' };
      }
      const customerSearchConditions: CustomerSearchCondition[] = [];

      if (isPhoneSearch) {
        // For phone searches, use normalized phone patterns
        const phonePatterns = getPhoneSearchPatterns(searchQuery);

        // Add exact matches for all phone patterns
        phonePatterns.forEach(pattern => {
          customerSearchConditions.push({
            phone: {
              equals: pattern,
              mode: 'insensitive' as const,
            },
          });
        });

        // Add partial match using digits only
        customerSearchConditions.push({
          phone: {
            contains: digitsOnly,
            mode: 'insensitive' as const,
          },
        });
      } else if (isEmailSearch) {
        // For email searches, try exact match first, then partial match
        customerSearchConditions.push(
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
        // For general searches, search across all fields
        customerSearchConditions.push(
          {
            email: {
              contains: searchQuery,
              mode: 'insensitive' as const,
            },
          },
          {
            name: {
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

      // Search in Customer table
      try {
        const customers = await prisma.customer.findMany({
          where: {
            AND: [
              { isActive: true },
              {
                OR: customerSearchConditions,
              },
            ],
          },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            city: true,
            state: true,
            postalCode: true,
            country: true,
            customerType: true,
            billingAddress: true,
            shippingAddress: true,
            notes: true,
            createdAt: true,
            salesTransactions: {
              where: {
                payment_status: {
                  in: SUCCESSFUL_PAYMENT_STATUSES,
                },
              },
              select: {
                id: true,
                total_amount: true,
                created_at: true,
                payment_status: true,
              },
              orderBy: {
                created_at: 'desc',
              },
            },
          },
          take: limit,
          orderBy: {
            createdAt: 'desc',
          },
        });

        // Transform customer data with proper calculations
        customers.forEach((customer: any) => {
          const successfulTransactions = customer.salesTransactions || [];
          const totalSpent = successfulTransactions.reduce(
            (sum: number, t: any) => sum + Number(t.total_amount || 0),
            0
          );
          const totalOrders = successfulTransactions.length;
          const averageOrderValue =
            totalOrders > 0 ? totalSpent / totalOrders : 0;
          const lastPurchase =
            successfulTransactions[0]?.created_at || customer.createdAt;

          results.push({
            id: customer.id.toString(),
            name: customer.name || 'Unknown Customer',
            email: customer.email || '',
            phone: customer.phone || '',
            city: customer.city || '',
            state: customer.state || '',
            postalCode: customer.postalCode || '',
            country: customer.country || 'Nigeria',
            customerType: customer.customerType || 'individual',
            billingAddress: customer.billingAddress || '',
            shippingAddress: customer.shippingAddress || '',
            notes: customer.notes || '',
            source: 'customer_table',
            lastPurchase: lastPurchase,
            lastAmount: successfulTransactions[0]
              ? Number(successfulTransactions[0].total_amount)
              : undefined,
            priority: 1, // Higher priority for dedicated customer records
            totalSpent: totalSpent,
            totalOrders: totalOrders,
            averageOrderValue: averageOrderValue,
          });
        });
      } catch (error) {
        logger.error('Error searching customers table', {
          error: error instanceof Error ? error.message : String(error),
          searchQuery,
        });
      }
    }

    // 2. Search in users table (staff/employees) - removed sales transaction legacy search
    // as customer fields have been moved to dedicated Customer table

    // 3. Search in users table (staff/employees)
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
        city: '',
        state: '',
        postalCode: '',
        country: 'Nigeria',
        customerType: 'individual',
        billingAddress: '',
        shippingAddress: '',
        notes: '',
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
      return (a.rank || 0) - (b.rank || 0);
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
    logger.error('Error fetching customers', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
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
    const {
      name,
      email,
      phone,
      city,
      state,
      postalCode,
      country,
      customerType,
      billingAddress,
      shippingAddress,
      notes,
    } = body;

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
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        email: email.toLowerCase(),
      },
    });

    if (existingCustomer) {
      return NextResponse.json(
        { error: 'Customer with this email already exists' },
        { status: 409 }
      );
    }

    // Create a new customer in the dedicated Customer table
    const newCustomerRecord = await prisma.customer.create({
      data: {
        name,
        email: email.toLowerCase(),
        phone: phone || null,
        city: city || null,
        state: state || null,
        postalCode: postalCode || null,
        country: country || 'Nigeria',
        customerType: customerType || 'individual',
        billingAddress: billingAddress || null,
        shippingAddress: shippingAddress || null,
        notes: notes || null,
        isActive: true,
      },
    });

    const newCustomer = {
      id: newCustomerRecord.id.toString(),
      name: newCustomerRecord.name,
      email: newCustomerRecord.email,
      phone: newCustomerRecord.phone,
      city: newCustomerRecord.city,
      state: newCustomerRecord.state,
      postalCode: newCustomerRecord.postalCode,
      country: newCustomerRecord.country,
      customerType: newCustomerRecord.customerType,
      billingAddress: newCustomerRecord.billingAddress,
      shippingAddress: newCustomerRecord.shippingAddress,
      notes: newCustomerRecord.notes,
      totalSpent: 0,
      totalOrders: 0,
      lastPurchase: newCustomerRecord.createdAt?.toISOString() || null,
      averageOrderValue: 0,
      rank: 1,
    };

    return NextResponse.json({
      success: true,
      data: newCustomer,
      message: 'Customer created successfully',
    });
  } catch (error) {
    logger.error('Error creating customer', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
