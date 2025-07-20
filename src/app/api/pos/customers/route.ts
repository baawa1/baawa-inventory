import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { prisma } from "@/lib/db";

interface CustomerData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  totalSpent: number;
  totalOrders: number;
  lastPurchase: string;
  averageOrderValue: number;
  rank: number;
}

export async function GET(_request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to view customer data
    if (!["ADMIN", "MANAGER", "STAFF"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Aggregate customer data from sales transactions
    const customers = await prisma.salesTransaction.groupBy({
      by: ["customer_email", "customer_name", "customer_phone"],
      where: {
        customer_email: {
          not: null,
        },
        payment_status: "paid",
      },
      _sum: {
        total_amount: true,
      },
      _count: {
        id: true,
      },
      _max: {
        created_at: true,
      },
    });

    // Transform the data into the format expected by the frontend
    const customerData: CustomerData[] = customers
      .filter((customer: any) => customer.customer_email) // Ensure we have email
      .map((customer: any, index: number) => {
        const totalSpent = customer._sum.total_amount || 0;
        const totalOrders = customer._count.id;
        const averageOrderValue =
          totalOrders > 0 ? Number(totalSpent) / totalOrders : 0;

        return {
          id: customer.customer_email || "",
          name: customer.customer_name || "Unknown Customer",
          email: customer.customer_email || "",
          phone: customer.customer_phone,
          totalSpent: Number(totalSpent),
          totalOrders,
          lastPurchase:
            customer._max.created_at?.toISOString() || new Date().toISOString(),
          averageOrderValue,
          rank: index + 1, // Will be recalculated after sorting
        };
      })
      .sort((a: CustomerData, b: CustomerData) => b.totalSpent - a.totalSpent) // Sort by total spent descending
      .map((customer: CustomerData, index: number) => ({
        ...customer,
        rank: index + 1,
      }));

    return NextResponse.json(customerData);
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}
