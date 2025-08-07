// ===== STATUS GROUPING USAGE EXAMPLES =====
//
// This file demonstrates how to use the new status grouping constants
// in your API endpoints and database queries.
//
// Import the constants:
// import {
//   SUCCESSFUL_PAYMENT_STATUSES,
//   PENDING_STATUSES,
//   CANCELLED_REJECTED_STATUSES,
//   APPROVED_STATUSES,
//   DRAFT_STATUSES,
//   ACTIVE_PUBLISHED_STATUSES,
//   ALL_STATUSES
// } from '@/lib/constants';

// ===== EXAMPLE 1: REVENUE CALCULATIONS =====
//
// Before (hardcoded):
// const revenue = await prisma.salesTransaction.aggregate({
//   where: {
//     payment_status: { in: ['PAID', 'COMPLETED'] }
//   },
//   _sum: { total_amount: true }
// });
//
// After (using constant):
// const revenue = await prisma.salesTransaction.aggregate({
//   where: {
//     payment_status: { in: SUCCESSFUL_PAYMENT_STATUSES }
//   },
//   _sum: { total_amount: true }
// });

// ===== EXAMPLE 2: PENDING APPROVALS DASHBOARD =====
//
// Get all pending items across different models:
// const pendingItems = await Promise.all([
//   // Pending sales transactions
//   prisma.salesTransaction.findMany({
//     where: { payment_status: { in: PENDING_STATUSES } }
//   }),
//   // Pending stock reconciliations
//   prisma.stockReconciliation.findMany({
//     where: { status: { in: PENDING_STATUSES } }
//   }),
//   // Pending stock adjustments
//   prisma.stockAdjustment.findMany({
//     where: { status: { in: PENDING_STATUSES } }
//   })
// ]);

// ===== EXAMPLE 3: FAILED TRANSACTIONS REPORT =====
//
// Get all cancelled/rejected items:
// const failedTransactions = await prisma.salesTransaction.findMany({
//   where: { payment_status: { in: CANCELLED_REJECTED_STATUSES } }
// });

// ===== EXAMPLE 4: APPROVED ITEMS REPORT =====
//
// Get all approved items:
// const approvedItems = await Promise.all([
//   prisma.stockReconciliation.findMany({
//     where: { status: { in: APPROVED_STATUSES } }
//   }),
//   prisma.stockAdjustment.findMany({
//     where: { status: { in: APPROVED_STATUSES } }
//   })
// ]);

// ===== EXAMPLE 5: DRAFT ITEMS (WORK IN PROGRESS) =====
//
// Get all draft items:
// const draftItems = await prisma.stockReconciliation.findMany({
//   where: { status: { in: DRAFT_STATUSES } }
// });

// ===== EXAMPLE 6: ACTIVE CONTENT =====
//
// Get all published content:
// const activeContent = await prisma.aIContent.findMany({
//   where: { status: { in: ACTIVE_PUBLISHED_STATUSES } }
// });

// ===== EXAMPLE 7: COMPREHENSIVE STATUS FILTERING =====
//
// Create a flexible status filter function:
// function createStatusFilter(statusGroup: string) {
//   switch (statusGroup) {
//     case 'successful':
//       return { in: SUCCESSFUL_PAYMENT_STATUSES };
//     case 'pending':
//       return { in: PENDING_STATUSES };
//     case 'failed':
//       return { in: CANCELLED_REJECTED_STATUSES };
//     case 'approved':
//       return { in: APPROVED_STATUSES };
//     case 'draft':
//       return { in: DRAFT_STATUSES };
//     case 'active':
//       return { in: ACTIVE_PUBLISHED_STATUSES };
//     case 'all':
//       return { in: ALL_STATUSES };
//     default:
//       return { in: SUCCESSFUL_PAYMENT_STATUSES }; // Default to successful
//   }
// }
//
// Usage:
// const filter = createStatusFilter('pending');
// const items = await prisma.salesTransaction.findMany({
//   where: { payment_status: filter }
// });

// ===== EXAMPLE 8: API ENDPOINT WITH STATUS FILTERING =====
//
// export const GET = withAuth(async (request: AuthenticatedRequest) => {
//   const { searchParams } = new URL(request.url);
//   const statusFilter = searchParams.get('status') || 'successful';
//
//   const transactions = await prisma.salesTransaction.findMany({
//     where: {
//       payment_status: createStatusFilter(statusFilter)
//     }
//   });
//
//   return createApiResponse.success(transactions);
// });

// ===== EXAMPLE 9: DASHBOARD WIDGETS =====
//
// // Pending approvals widget
// const pendingCount = await prisma.stockReconciliation.count({
//   where: { status: { in: PENDING_STATUSES } }
// });
//
// // Successful transactions widget
// const successfulCount = await prisma.salesTransaction.count({
//   where: { payment_status: { in: SUCCESSFUL_PAYMENT_STATUSES } }
// });
//
// // Failed transactions widget
// const failedCount = await prisma.salesTransaction.count({
//   where: { payment_status: { in: CANCELLED_REJECTED_STATUSES } }
// });

// ===== EXAMPLE 10: EXPORT FUNCTIONS =====
//
// export async function exportTransactionsByStatus(statusGroup: string) {
//   const filter = createStatusFilter(statusGroup);
//
//   const transactions = await prisma.salesTransaction.findMany({
//     where: { payment_status: filter },
//     include: { sales_items: true }
//   });
//
//   return generateCSV(transactions);
// }

// ===== BENEFITS SUMMARY =====
//
// ✅ Single source of truth for status filtering
// ✅ Consistent behavior across all endpoints
// ✅ Easy to maintain and update
// ✅ Type-safe with TypeScript
// ✅ Self-documenting code
// ✅ Reduced chance of typos
// ✅ Easy to add new statuses to groups
// ✅ Centralized status management
