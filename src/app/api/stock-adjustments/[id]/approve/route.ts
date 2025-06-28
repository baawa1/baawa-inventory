import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST /api/stock-adjustments/[id]/approve - Approve a stock adjustment
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can approve adjustments
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const supabase = await createServerSupabaseClient();
    const adjustmentId = parseInt(params.id);

    if (isNaN(adjustmentId)) {
      return NextResponse.json(
        { error: "Invalid adjustment ID" },
        { status: 400 }
      );
    }

    // Get the stock adjustment
    const { data: adjustment, error: fetchError } = await supabase
      .from("stock_adjustments")
      .select(
        `
        *,
        product:products(id, name, stock)
      `
      )
      .eq("id", adjustmentId)
      .eq("status", "PENDING")
      .single();

    if (fetchError || !adjustment) {
      return NextResponse.json(
        { error: "Stock adjustment not found or already processed" },
        { status: 404 }
      );
    }

    // Update the stock adjustment status
    const { error: updateError } = await supabase
      .from("stock_adjustments")
      .update({
        status: "APPROVED",
        approved_by: session.user.id,
        approved_at: new Date().toISOString(),
      })
      .eq("id", adjustmentId);

    if (updateError) {
      console.error("Error approving stock adjustment:", updateError);
      return NextResponse.json(
        { error: "Failed to approve stock adjustment" },
        { status: 500 }
      );
    }

    // Now update the product stock
    const { error: stockUpdateError } = await supabase
      .from("products")
      .update({ stock: adjustment.new_quantity })
      .eq("id", adjustment.product_id);

    if (stockUpdateError) {
      console.error("Error updating product stock:", stockUpdateError);
      // Rollback the approval
      await supabase
        .from("stock_adjustments")
        .update({
          status: "PENDING",
          approved_by: null,
          approved_at: null,
        })
        .eq("id", adjustmentId);

      return NextResponse.json(
        { error: "Failed to update product stock" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Stock adjustment approved successfully",
      adjustment: {
        id: adjustmentId,
        status: "APPROVED",
        productName: adjustment.product.name,
        oldStock: adjustment.old_quantity,
        newStock: adjustment.new_quantity,
        approvedBy: session.user.name,
      },
    });
  } catch (error) {
    console.error("Error in POST /api/stock-adjustments/[id]/approve:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/stock-adjustments/[id]/reject - Reject a stock adjustment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can reject adjustments
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const supabase = await createServerSupabaseClient();
    const adjustmentId = parseInt(params.id);
    const body = await request.json();
    const { rejectionReason } = body;

    if (isNaN(adjustmentId)) {
      return NextResponse.json(
        { error: "Invalid adjustment ID" },
        { status: 400 }
      );
    }

    if (!rejectionReason) {
      return NextResponse.json(
        { error: "Rejection reason is required" },
        { status: 400 }
      );
    }

    // Get the stock adjustment
    const { data: adjustment, error: fetchError } = await supabase
      .from("stock_adjustments")
      .select(
        `
        id, 
        status, 
        product:products!inner(name)
      `
      )
      .eq("id", adjustmentId)
      .eq("status", "PENDING")
      .single();

    if (fetchError || !adjustment) {
      return NextResponse.json(
        { error: "Stock adjustment not found or already processed" },
        { status: 404 }
      );
    }

    // Update the stock adjustment status
    const { error: updateError } = await supabase
      .from("stock_adjustments")
      .update({
        status: "REJECTED",
        approved_by: session.user.id,
        approved_at: new Date().toISOString(),
        rejection_reason: rejectionReason,
      })
      .eq("id", adjustmentId);

    if (updateError) {
      console.error("Error rejecting stock adjustment:", updateError);
      return NextResponse.json(
        { error: "Failed to reject stock adjustment" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Stock adjustment rejected successfully",
      adjustment: {
        id: adjustmentId,
        status: "REJECTED",
        productName: (adjustment.product as any).name,
        rejectedBy: session.user.name,
        rejectionReason,
      },
    });
  } catch (error) {
    console.error("Error in DELETE /api/stock-adjustments/[id]/reject:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
