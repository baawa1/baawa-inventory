import { NextRequest, NextResponse } from 'next/server';
import { auth } from '#root/auth';
import { prisma } from '@/lib/db';
import { USER_ROLES, hasRole } from '@/lib/auth/roles';

export async function PUT(
  request: NextRequest,
  { params }: { params: { email: string } }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to update customer data
    if (
      !hasRole(session.user.role, [
        USER_ROLES.ADMIN,
        USER_ROLES.MANAGER,
        USER_ROLES.STAFF,
      ])
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const customerEmail = decodeURIComponent(params.email);
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

    // Update all sales transactions for this customer
    const updateResult = await prisma.salesTransaction.updateMany({
      where: {
        customer_email: customerEmail,
      },
      data: {
        customer_name: name,
        customer_email: email.toLowerCase(),
        customer_phone: phone || null,
      },
    });

    if (updateResult.count === 0) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Return the updated customer data
    const updatedCustomer = {
      id: customerEmail, // Using email as ID for consistency
      name,
      email: email.toLowerCase(),
      phone: phone || null,
      // Note: We can't return the full customer analytics data here
      // as it's calculated from multiple transactions
    };

    return NextResponse.json({
      success: true,
      data: updatedCustomer,
      message: 'Customer updated successfully',
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { email: string } }
) {
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

    const customerEmail = decodeURIComponent(params.email);

    // Get customer data from sales transactions
    const customerTransactions = await prisma.salesTransaction.findMany({
      where: {
        customer_email: customerEmail,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    if (customerTransactions.length === 0) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Calculate customer analytics
    const totalSpent = customerTransactions.reduce(
      (sum, transaction) => sum + Number(transaction.total_amount),
      0
    );
    const totalOrders = customerTransactions.length;
    const averageOrderValue = totalSpent / totalOrders;
    const firstPurchase = customerTransactions[customerTransactions.length - 1];
    const lastPurchase = customerTransactions[0];

    const customerData = {
      id: customerEmail,
      name: lastPurchase.customer_name,
      email: lastPurchase.customer_email,
      phone: lastPurchase.customer_phone,
      totalSpent,
      totalOrders,
      averageOrderValue,
      lastPurchase: lastPurchase.created_at.toISOString(),
      firstPurchase: firstPurchase.created_at.toISOString(),
      daysSinceLastPurchase: Math.floor(
        (Date.now() - lastPurchase.created_at.getTime()) / (1000 * 60 * 60 * 24)
      ),
    };

    return NextResponse.json({
      success: true,
      data: customerData,
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
