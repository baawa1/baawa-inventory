import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { handleApiError } from '@/lib/api-error-handler-new';
import { prisma } from '@/lib/db';
import { sendReconciliationNotification } from '@/lib/notifications/stock-reconciliation';

export const POST = withAuth(
  async (
    request: AuthenticatedRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      const { id } = await params;
      const reconciliationId = parseInt(id);

      if (isNaN(reconciliationId)) {
        return NextResponse.json(
          { error: 'Invalid reconciliation ID' },
          { status: 400 }
        );
      }

      // Check if reconciliation exists and can be submitted
      const reconciliation = await prisma.stockReconciliation.findUnique({
        where: { id: reconciliationId },
        select: {
          id: true,
          status: true,
          createdById: true,
          title: true,
          items: {
            select: { id: true },
          },
        },
      });

      if (!reconciliation) {
        return NextResponse.json(
          { error: 'Stock reconciliation not found' },
          { status: 404 }
        );
      }

      // Check permissions - creator or admin can submit
      if (
        reconciliation.createdById !== parseInt(request.user.id) &&
        request.user.role !== 'ADMIN'
      ) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // Can only submit draft reconciliations
      if (reconciliation.status !== 'DRAFT') {
        return NextResponse.json(
          { error: 'Only draft reconciliations can be submitted' },
          { status: 400 }
        );
      }

      // Must have at least one item
      if (reconciliation.items.length === 0) {
        return NextResponse.json(
          { error: 'Cannot submit reconciliation without items' },
          { status: 400 }
        );
      }

      // Update status to pending and set submitted timestamp
      const updatedReconciliation = await prisma.stockReconciliation.update({
        where: { id: reconciliationId },
        data: {
          status: 'PENDING',
          submittedAt: new Date(),
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  stock: true,
                },
              },
            },
          },
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      // Send notification to admins about pending approval
      try {
        await sendReconciliationNotification({
          type: 'RECONCILIATION_SUBMITTED',
          reconciliationId: updatedReconciliation.id,
          reconciliationTitle: updatedReconciliation.title,
          createdBy: updatedReconciliation.createdBy,
        });
      } catch (notificationError) {
        console.error(
          'Failed to send reconciliation notification:',
          notificationError
        );
        // Don't fail the whole operation if notification fails
      }

      return NextResponse.json({
        success: true,
        message: 'Stock reconciliation submitted for approval',
        data: updatedReconciliation,
      });
    } catch (error) {
      return handleApiError(error);
    }
  }
);
