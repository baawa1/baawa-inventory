import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // Bypass auth for debugging - get data directly from Prisma
    const categoriesData = await prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 10,
    });

    const brandsData = await prisma.brand.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 10,
    });

    return NextResponse.json({
      categories: {
        data: categoriesData || [],
        error: null,
      },
      brands: {
        data: brandsData || [],
        error: null,
      },
      message: "Debug data fetched successfully",
    });
  } catch (error) {
    console.error("Debug API error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error },
      { status: 500 }
    );
  }
}
