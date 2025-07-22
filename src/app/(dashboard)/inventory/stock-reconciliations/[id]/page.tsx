import { auth } from "../../../../../../auth";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { StockReconciliationDetail } from "@/components/inventory/StockReconciliationDetail";

export const metadata = {
  title: "Stock Reconciliation Details - BaaWA Inventory POS",
  description: "View and manage stock reconciliation details",
};

interface ReconciliationDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReconciliationDetailPage({
  params,
}: ReconciliationDetailPageProps) {
  const session = await auth();

  // Check role permissions - only staff and above can access inventory
  if (
    !session?.user ||
    !["ADMIN", "MANAGER", "STAFF"].includes(session.user.role)
  ) {
    redirect("/unauthorized");
  }

  const resolvedParams = await params;
  const reconciliationId = parseInt(resolvedParams.id);

  if (isNaN(reconciliationId)) {
    notFound();
  }

  // Fetch reconciliation with related data
  const reconciliation = await prisma.stockReconciliation.findUnique({
    where: { id: reconciliationId },
    include: {
      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
        },
      },
      approvedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
        },
      },
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              barcode: true,
              price: true,
            },
          },
        },
      },
    },
  });

  if (!reconciliation) {
    notFound();
  }

  // Transform data for component
  const transformedReconciliation = {
    id: reconciliation.id,
    title: reconciliation.title,
    description: reconciliation.description,
    status: reconciliation.status,
    createdAt: reconciliation.created_at.toISOString(),
    submittedAt: reconciliation.submitted_at?.toISOString(),
    approvedAt: reconciliation.approved_at?.toISOString(),
    notes: reconciliation.notes,
    createdBy: reconciliation.createdBy,
    approvedBy: reconciliation.approvedBy,
    items: reconciliation.items.map((item) => ({
      id: item.id,
      productId: item.product_id,
      systemCount: item.system_count,
      physicalCount: item.physical_count,
      discrepancy: item.discrepancy,
      estimatedImpact: item.estimated_impact,
      discrepancyReason: item.discrepancy_reason,
      notes: item.notes,
      product: item.product,
    })),
  };

  return (
    <StockReconciliationDetail
      reconciliation={transformedReconciliation}
      user={session.user}
    />
  );
}
