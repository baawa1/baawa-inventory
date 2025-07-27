import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../../../auth';
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

    // Build where clause for checking uniqueness
    const whereClause: any = {
      OR: [],
    };

    if (email) {
      whereClause.OR.push({
        customer_email: {
          equals: email.trim().toLowerCase(),
          mode: 'insensitive',
        },
      });
    }

    if (phone) {
      whereClause.OR.push({
        customer_phone: {
          equals: phone.trim(),
        },
      });
    }

    // Check for existing customers
    const existingCustomers = await prisma.salesTransaction.groupBy({
      by: ['customer_email', 'customer_name', 'customer_phone'],
      where: whereClause,
      _count: {
        id: true,
      },
    });

    // Transform the results to match the expected format
    const customers = existingCustomers.map(customer => ({
      id: `${customer.customer_email || customer.customer_phone}`,
      name: customer.customer_name || 'Unknown',
      email: customer.customer_email || '',
      phone: customer.customer_phone || '',
      totalOrders: customer._count.id,
      totalSpent: 0, // We could calculate this if needed
    }));

    return NextResponse.json({
      exists: customers.length > 0,
      customers: customers,
      message:
        customers.length > 0
          ? 'Customer with this information already exists'
          : 'Customer information is unique',
    });
  } catch (error) {
    console.error('Error checking customer uniqueness:', error);
    return NextResponse.json(
      { error: 'Failed to check customer uniqueness' },
      { status: 500 }
    );
  }
}
