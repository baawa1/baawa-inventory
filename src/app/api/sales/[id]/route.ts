import { auth } from '#root/auth';
import { NextRequest, NextResponse } from 'next/server';
import { canAccessPOS } from '@/lib/auth/roles';
import { InventoryService } from '@/lib/inventory-service';
import { transformDatabaseResponse } from '@/lib/api-response';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/sales/[id] - Get a specific sales transaction
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has required permissions
    if (!canAccessPOS(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    // Validate ID
    const salesId = parseInt(id);
    if (isNaN(salesId)) {
      return NextResponse.json(
        { error: 'Invalid sales transaction ID' },
        { status: 400 }
      );
    }

    const salesTransaction =
      await InventoryService.getSalesTransaction(salesId);

    if (!salesTransaction) {
      return NextResponse.json(
        { error: 'Sales transaction not found' },
        { status: 404 }
      );
    }

    const transactionRecord = salesTransaction as any;

    const splitPayments = transactionRecord.split_payments || [];
    const ledgerPayments = transactionRecord.transaction_payments || [];
    const splitPaidTotal = splitPayments.reduce(
      (sum: number, payment: any) => {
        // Exclude debt from split payment total (debt is tracked separately in transaction_payments)
        if (payment.payment_method === 'debt') {
          return sum;
        }
        return sum + Number(payment.amount || 0);
      },
      0
    );
    const ledgerPaidTotal = ledgerPayments.reduce(
      (sum: number, payment: any) => sum + Number(payment.amount || 0),
      0
    );
    const totalPaid = splitPaidTotal + ledgerPaidTotal;
    const balanceDue = Math.max(
      0,
      Number(transactionRecord.total_amount) - totalPaid
    );

    const transformedTransaction: any = {
      ...transformDatabaseResponse(salesTransaction),
      subtotal: Number(transactionRecord.subtotal),
      discountAmount: Number(transactionRecord.discount_amount),
      taxAmount: Number(transactionRecord.tax_amount),
      totalAmount: Number(transactionRecord.total_amount),
      amountPaid: Number(totalPaid.toFixed(2)),
      balanceDue: Number(balanceDue.toFixed(2)),
      splitPayments: splitPayments.map((payment: any) => ({
        id: payment.id,
        amount: Number(payment.amount),
        method: payment.payment_method,
        createdAt: payment.created_at,
      })),
      transactionPayments: ledgerPayments.map((payment: any) => ({
        id: payment.id,
        amount: Number(payment.amount),
        method: payment.payment_method,
        note: payment.note,
        paymentDate: payment.payment_date,
        recordedById: payment.recorded_by,
        recordedBy: payment.recordedBy
          ? {
              id: payment.recordedBy.id,
              firstName: payment.recordedBy.firstName,
              lastName: payment.recordedBy.lastName,
              email: payment.recordedBy.email,
            }
          : null,
        createdAt: payment.created_at,
      })),
    };

    return NextResponse.json({ data: transformedTransaction });
  } catch (error) {
    console.error('Error in GET /api/sales/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/sales/[id] - Update a sales transaction
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has required permissions
    if (!canAccessPOS(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    // Validate ID
    const salesId = parseInt(id);
    if (isNaN(salesId)) {
      return NextResponse.json(
        { error: 'Invalid sales transaction ID' },
        { status: 400 }
      );
    }

    const updatedTransaction = await InventoryService.updateSalesTransaction(
      salesId,
      {
        ...body,
        userId: parseInt(session.user.id),
      }
    );

    return NextResponse.json({
      data: updatedTransaction,
      message: 'Sales transaction updated successfully',
    });
  } catch (error) {
    console.error('Error in PATCH /api/sales/[id]:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/sales/[id] - Void a sales transaction
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has required permissions
    if (!canAccessPOS(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const { reason } = await request.json();

    // Validate ID
    const salesId = parseInt(id);
    if (isNaN(salesId)) {
      return NextResponse.json(
        { error: 'Invalid sales transaction ID' },
        { status: 400 }
      );
    }

    if (!reason) {
      return NextResponse.json(
        { error: 'Void reason is required' },
        { status: 400 }
      );
    }

    const voidedTransaction = await InventoryService.voidSalesTransaction(
      salesId,
      parseInt(session.user.id),
      reason
    );

    return NextResponse.json({
      data: voidedTransaction,
      message: 'Sales transaction voided successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /api/sales/[id]:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
