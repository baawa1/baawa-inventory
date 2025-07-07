import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { emailService } from "@/lib/email";
import { z } from "zod";

// Validation schema for email receipt
const emailReceiptSchema = z.object({
  customerEmail: z.string().email("Invalid email address"),
  saleId: z.string().min(1, "Sale ID is required"),
  customerName: z.string().optional(),
  receiptData: z.object({
    items: z.array(
      z.object({
        name: z.string(),
        quantity: z.number(),
        price: z.number(),
        total: z.number(),
      })
    ),
    subtotal: z.number(),
    discount: z.number(),
    total: z.number(),
    paymentMethod: z.string(),
    timestamp: z.string(),
    staffName: z.string(),
  }),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check user status and role
    const user = session.user;
    if (user.status !== "active") {
      return NextResponse.json(
        { error: "Account not active" },
        { status: 403 }
      );
    }

    if (!["ADMIN", "MANAGER", "STAFF"].includes(user.role || "")) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = emailReceiptSchema.parse(body);

    const { customerEmail, saleId, customerName, receiptData } = validatedData;

    // Send email receipt
    const emailSent = await emailService.sendReceiptEmail({
      to: customerEmail,
      customerName: customerName || "Customer",
      saleId,
      items: receiptData.items,
      subtotal: receiptData.subtotal,
      discount: receiptData.discount,
      total: receiptData.total,
      paymentMethod: receiptData.paymentMethod,
      timestamp: new Date(receiptData.timestamp),
      staffName: receiptData.staffName,
    });

    if (!emailSent) {
      return NextResponse.json(
        { error: "Failed to send email receipt" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Receipt sent successfully",
      saleId,
      customerEmail,
    });
  } catch (error) {
    console.error("Error sending email receipt:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
