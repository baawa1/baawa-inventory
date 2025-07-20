import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Validation schema for sync status updates
const syncStatusSchema = z.object({
  entityType: z.enum(["product", "category", "brand"]),
  entityId: z.number().int().positive(),
  status: z.enum(["synced", "failed"]),
  errorMessage: z.string().optional(),
  webhookUrl: z.string().url().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = syncStatusSchema.parse(body);

    // Update the sync status in ContentSync table
    await prisma.contentSync.upsert({
      where: {
        unique_entity_content_sync: {
          entity_type: validatedData.entityType,
          entity_id: validatedData.entityId,
        },
      },
      update: {
        sync_status: validatedData.status,
        last_sync_at: new Date(),
        sync_errors: validatedData.errorMessage || null,
        webhook_url: validatedData.webhookUrl || null,
      },
      create: {
        entity_type: validatedData.entityType,
        entity_id: validatedData.entityId,
        sync_status: validatedData.status,
        last_sync_at: new Date(),
        sync_errors: validatedData.errorMessage || null,
        webhook_url: validatedData.webhookUrl || null,
      },
    });

    // Also update the product sync fields if it's a product
    if (validatedData.entityType === "product") {
      await prisma.product.update({
        where: { id: validatedData.entityId },
        data: {
          syncStatus: validatedData.status,
          lastSyncAt: new Date(),
          syncErrors: validatedData.errorMessage || null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Sync status updated for ${validatedData.entityType} ${validatedData.entityId}`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    console.error("Sync status update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
