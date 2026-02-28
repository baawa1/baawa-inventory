import { NextRequest, NextResponse } from 'next/server';
import { auth } from '#root/auth';
import { prisma } from '@/lib/db';
import { USER_ROLES, hasRole } from '@/lib/auth/roles';
import { normalizeNigerianPhone } from '@/lib/utils/phone-utils';

const parseCustomerId = (rawId: string) => {
  const id = Number(rawId);
  if (!Number.isFinite(id) || id <= 0) {
    return null;
  }
  return id;
};

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (
      !hasRole(session.user.role, [
        USER_ROLES.ADMIN,
        USER_ROLES.MANAGER,
        USER_ROLES.STAFF,
      ])
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const customerId = parseCustomerId(resolvedParams.id);
    if (!customerId) {
      return NextResponse.json(
        { error: 'Invalid customer id' },
        { status: 400 }
      );
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

    const trimmedName = typeof name === 'string' ? name.trim() : '';
    const trimmedEmail =
      typeof email === 'string' ? email.trim().toLowerCase() : '';
    const trimmedPhone = typeof phone === 'string' ? phone.trim() : '';

    if (!trimmedName || !trimmedPhone) {
      return NextResponse.json(
        { error: 'Name and phone are required' },
        { status: 400 }
      );
    }

    if (trimmedEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        );
      }
    }

    const existingCustomer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    const normalizedPhoneResult = normalizeNigerianPhone(trimmedPhone);
    const normalizedPhone = normalizedPhoneResult.isValid
      ? normalizedPhoneResult.normalized
      : trimmedPhone;

    const updatedCustomer = await prisma.customer.update({
      where: { id: existingCustomer.id },
      data: {
        name: trimmedName,
        email: trimmedEmail || null,
        phone: normalizedPhone,
        city: city || null,
        state: state || null,
        postalCode: postalCode || null,
        country: country || 'Nigeria',
        customerType: customerType || 'individual',
        billingAddress: billingAddress || null,
        shippingAddress: shippingAddress || null,
        notes: notes || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedCustomer.id.toString(),
        name: updatedCustomer.name,
        email: updatedCustomer.email,
        phone: updatedCustomer.phone,
        city: updatedCustomer.city,
        state: updatedCustomer.state,
        postalCode: updatedCustomer.postalCode,
        country: updatedCustomer.country,
        customerType: updatedCustomer.customerType,
        billingAddress: updatedCustomer.billingAddress,
        shippingAddress: updatedCustomer.shippingAddress,
        notes: updatedCustomer.notes,
      },
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
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (
      !hasRole(session.user.role, [
        USER_ROLES.ADMIN,
        USER_ROLES.MANAGER,
        USER_ROLES.STAFF,
      ])
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const customerId = parseCustomerId(resolvedParams.id);
    if (!customerId) {
      return NextResponse.json(
        { error: 'Invalid customer id' },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        salesTransactions: {
          orderBy: {
            created_at: 'desc',
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    const customerTransactions = customer.salesTransactions;
    const totalSpent = customerTransactions.reduce(
      (sum, transaction) => sum + Number(transaction.total_amount),
      0
    );
    const totalOrders = customerTransactions.length;
    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
    const firstPurchase = customerTransactions[customerTransactions.length - 1];
    const lastPurchase = customerTransactions[0];

    const customerData = {
      id: customer.id.toString(),
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      city: customer.city,
      state: customer.state,
      postalCode: customer.postalCode,
      country: customer.country,
      customerType: customer.customerType,
      billingAddress: customer.billingAddress,
      shippingAddress: customer.shippingAddress,
      notes: customer.notes,
      totalSpent,
      totalOrders,
      averageOrderValue,
      lastPurchase: lastPurchase?.created_at?.toISOString() || null,
      firstPurchase: firstPurchase?.created_at?.toISOString() || null,
      daysSinceLastPurchase: lastPurchase?.created_at
        ? Math.floor(
            (Date.now() - lastPurchase.created_at.getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : null,
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
