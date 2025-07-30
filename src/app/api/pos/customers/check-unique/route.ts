import { NextRequest, NextResponse } from 'next/server';
import { auth } from '#root/auth';
import { prisma } from '@/lib/db';
import { USER_ROLES, hasRole } from '@/lib/auth/roles';

export async function POST(request: NextRequest) {
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

    const { email, phone } = await request.json();

    // Validate input
    if (!email && !phone) {
      return NextResponse.json(
        { error: 'Email or phone number is required' },
        { status: 400 }
      );
    }

    const allResults = [];
    let exactMatches = 0;
    let partialMatches = 0;

    // 1. Check sales transactions (customers)
    if (email || phone) {
      const whereClause: any = {
        OR: [],
      };

      if (email) {
        const cleanEmail = email.trim().toLowerCase();
        whereClause.OR.push(
          {
            customer_email: {
              equals: cleanEmail,
              mode: 'insensitive',
            },
          },
          {
            customer_email: {
              contains: cleanEmail,
              mode: 'insensitive',
            },
          }
        );
      }

      if (phone) {
        const cleanPhone = phone.trim();
        const digitsOnly = cleanPhone.replace(/\D/g, '');
        whereClause.OR.push(
          {
            customer_phone: {
              equals: cleanPhone,
            },
          },
          {
            customer_phone: {
              contains: digitsOnly,
            },
          }
        );
      }

      // Check for existing customers
      const existingCustomers = await prisma.salesTransaction.groupBy({
        by: ['customer_email', 'customer_name', 'customer_phone'],
        where: whereClause,
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

      // Transform the results
      const customers = existingCustomers
        .filter(
          customer =>
            customer.customer_email ||
            customer.customer_name ||
            customer.customer_phone
        )
        .map(customer => ({
          id: `customer-${customer.customer_email || customer.customer_phone}`,
          name: customer.customer_name || 'Unknown',
          email: customer.customer_email || '',
          phone: customer.customer_phone || '',
          totalOrders: customer._count.id,
          totalSpent: Number(customer._sum.total_amount || 0),
          lastPurchase:
            customer._max.created_at?.toISOString() || new Date().toISOString(),
          type: 'customer',
        }));

      allResults.push(...customers);

      // Count exact and partial matches
      if (email) {
        const cleanEmail = email.trim().toLowerCase();
        exactMatches += customers.filter(
          c => c.email.toLowerCase() === cleanEmail
        ).length;
        partialMatches += customers.filter(
          c =>
            c.email.toLowerCase().includes(cleanEmail) &&
            c.email.toLowerCase() !== cleanEmail
        ).length;
      }

      if (phone) {
        const cleanPhone = phone.trim();
        const digitsOnly = cleanPhone.replace(/\D/g, '');
        exactMatches += customers.filter(
          c =>
            c.phone === cleanPhone || c.phone?.replace(/\D/g, '') === digitsOnly
        ).length;
        partialMatches += customers.filter(
          c =>
            c.phone?.includes(digitsOnly) &&
            c.phone !== cleanPhone &&
            c.phone?.replace(/\D/g, '') !== digitsOnly
        ).length;
      }
    }

    // 2. Check users table (staff/employees)
    if (email || phone) {
      const userWhereClause: any = {
        OR: [],
        isActive: true, // Only active users
      };

      if (email) {
        const cleanEmail = email.trim().toLowerCase();
        userWhereClause.OR.push(
          {
            email: {
              equals: cleanEmail,
              mode: 'insensitive',
            },
          },
          {
            email: {
              contains: cleanEmail,
              mode: 'insensitive',
            },
          }
        );
      }

      if (phone) {
        const cleanPhone = phone.trim();
        const digitsOnly = cleanPhone.replace(/\D/g, '');
        userWhereClause.OR.push(
          {
            phone: {
              equals: cleanPhone,
              mode: 'insensitive',
            },
          },
          {
            phone: {
              contains: digitsOnly,
              mode: 'insensitive',
            },
          }
        );
      }

      const users = await prisma.user.findMany({
        where: userWhereClause,
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

      // Transform user data
      const userResults = users.map(user => ({
        id: `user-${user.id}`,
        name: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        phone: user.phone || '',
        totalOrders: 0,
        totalSpent: 0,
        lastPurchase: user.createdAt?.toISOString() || new Date().toISOString(),
        type: 'user',
        role: user.role,
      }));

      allResults.push(...userResults);

      // Count exact and partial matches for users
      if (email) {
        const cleanEmail = email.trim().toLowerCase();
        exactMatches += userResults.filter(
          u => u.email.toLowerCase() === cleanEmail
        ).length;
        partialMatches += userResults.filter(
          u =>
            u.email.toLowerCase().includes(cleanEmail) &&
            u.email.toLowerCase() !== cleanEmail
        ).length;
      }

      if (phone) {
        const cleanPhone = phone.trim();
        const digitsOnly = cleanPhone.replace(/\D/g, '');
        exactMatches += userResults.filter(
          u =>
            u.phone === cleanPhone || u.phone?.replace(/\D/g, '') === digitsOnly
        ).length;
        partialMatches += userResults.filter(
          u =>
            u.phone?.includes(digitsOnly) &&
            u.phone !== cleanPhone &&
            u.phone?.replace(/\D/g, '') !== digitsOnly
        ).length;
      }
    }

    const hasExactMatch = exactMatches > 0;
    const hasPartialMatch = partialMatches > 0;

    // Generate appropriate message
    let message = 'Customer information is unique';
    if (hasExactMatch) {
      message = `Customer with this ${email ? 'email' : 'phone'} already exists`;
    } else if (hasPartialMatch) {
      message = `Found similar customer information. Please review before proceeding.`;
    }

    return NextResponse.json({
      exists: hasExactMatch,
      hasPartialMatches: hasPartialMatch,
      customers: allResults,
      message: message,
      exactMatches: exactMatches,
      partialMatches: partialMatches,
    });
  } catch (error) {
    console.error('Error checking customer uniqueness:', error);
    return NextResponse.json(
      { error: 'Failed to check customer uniqueness' },
      { status: 500 }
    );
  }
}
