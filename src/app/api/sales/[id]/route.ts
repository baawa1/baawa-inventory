import { auth } from "../../../../../auth";
import { NextRequest, NextResponse } from "next/server";
import { canAccessPOS } from "@/lib/auth/roles";
import { InventoryService } from "@/lib/inventory-service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/sales/[id] - Get a specific sales transaction
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has required permissions
    if (!canAccessPOS(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // Validate ID
    const salesId = parseInt(id);
    if (isNaN(salesId)) {
      return NextResponse.json(
        { error: "Invalid sales transaction ID" },
        { status: 400 }
      );
    }

    const salesTransaction =
      await InventoryService.getSalesTransaction(salesId);

    if (!salesTransaction) {
      return NextResponse.json(
        { error: "Sales transaction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: salesTransaction });
  } catch (error) {
    console.error("Error in GET /api/sales/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/sales/[id] - Update a sales transaction
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has required permissions
    if (!canAccessPOS(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    // Validate ID
    const salesId = parseInt(id);
    if (isNaN(salesId)) {
      return NextResponse.json(
        { error: "Invalid sales transaction ID" },
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
      message: "Sales transaction updated successfully",
    });
  } catch (error) {
    console.error("Error in PATCH /api/sales/[id]:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/sales/[id] - Void a sales transaction
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has required permissions
    if (!canAccessPOS(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const { reason } = await request.json();

    // Validate ID
    const salesId = parseInt(id);
    if (isNaN(salesId)) {
      return NextResponse.json(
        { error: "Invalid sales transaction ID" },
        { status: 400 }
      );
    }

    if (!reason) {
      return NextResponse.json(
        { error: "Void reason is required" },
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
      message: "Sales transaction voided successfully",
    });
  } catch (error) {
    console.error("Error in DELETE /api/sales/[id]:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
