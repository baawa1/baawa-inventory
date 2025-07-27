import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Validation schemas
const syncSingleSchema = z.object({
  entityType: z.enum(['product', 'category', 'brand']),
  entityId: z.number().int().positive(),
});

const syncBulkSchema = z.object({
  entityType: z.enum(['product', 'category', 'brand']),
  entityIds: z.array(z.number().int().positive()).min(1).max(100),
});

const requestSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('sync-single'),
    ...syncSingleSchema.shape,
  }),
  z.object({
    action: z.literal('sync-bulk'),
    ...syncBulkSchema.shape,
  }),
]);

async function handler(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = requestSchema.parse(body);

    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'Webhook URL not configured' },
        { status: 500 }
      );
    }

    switch (validatedData.action) {
      case 'sync-single':
        return await handleSyncSingle(validatedData, webhookUrl);

      case 'sync-bulk':
        return await handleSyncBulk(validatedData, webhookUrl);

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    console.error('Webhook sync API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleSyncSingle(
  data: { entityType: string; entityId: number },
  webhookUrl: string
) {
  try {
    // Get entity data based on type
    let entity;

    switch (data.entityType) {
      case 'product':
        entity = await prisma.product.findUnique({
          where: { id: data.entityId },
          include: {
            category: true,
            brand: true,
            supplier: true,
          },
        });
        break;

      case 'category':
        entity = await prisma.category.findUnique({
          where: { id: data.entityId },
        });
        break;

      case 'brand':
        entity = await prisma.brand.findUnique({
          where: { id: data.entityId },
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid entity type' },
          { status: 400 }
        );
    }

    if (!entity) {
      return NextResponse.json(
        { error: `${data.entityType} not found` },
        { status: 404 }
      );
    }

    // Prepare webhook payload
    const payload = {
      entityType: data.entityType,
      entityId: data.entityId,
      data: entity,
      timestamp: new Date().toISOString(),
    };

    // Send to webhook
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!webhookResponse.ok) {
      throw new Error(`Webhook failed: ${webhookResponse.statusText}`);
    }

    // Update sync status in ContentSync table
    await prisma.contentSync.upsert({
      where: {
        unique_entity_content_sync: {
          entity_type: data.entityType,
          entity_id: data.entityId,
        },
      },
      update: {
        sync_status: 'pending',
        last_sync_at: new Date(),
        webhook_url: webhookUrl,
        retry_count: {
          increment: 1,
        },
      },
      create: {
        entity_type: data.entityType,
        entity_id: data.entityId,
        sync_status: 'pending',
        last_sync_at: new Date(),
        webhook_url: webhookUrl,
      },
    });

    // Also update the product sync fields if it's a product
    if (data.entityType === 'product') {
      await prisma.product.update({
        where: { id: data.entityId },
        data: {
          syncStatus: 'pending',
          lastSyncAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `${data.entityType} queued for sync`,
      entityId: data.entityId,
    });
  } catch (error) {
    console.error('Sync single error:', error);
    return NextResponse.json(
      { error: 'Failed to sync entity' },
      { status: 500 }
    );
  }
}

async function handleSyncBulk(
  data: { entityType: string; entityIds: number[] },
  webhookUrl: string
) {
  try {
    // Get entities data based on type
    let entities;

    switch (data.entityType) {
      case 'product':
        entities = await prisma.product.findMany({
          where: { id: { in: data.entityIds } },
          include: {
            category: true,
            brand: true,
            supplier: true,
          },
        });
        break;

      case 'category':
        entities = await prisma.category.findMany({
          where: { id: { in: data.entityIds } },
        });
        break;

      case 'brand':
        entities = await prisma.brand.findMany({
          where: { id: { in: data.entityIds } },
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid entity type' },
          { status: 400 }
        );
    }

    if (entities.length === 0) {
      return NextResponse.json({ error: 'No entities found' }, { status: 404 });
    }

    // Prepare webhook payload
    const payload = {
      entityType: data.entityType,
      entityIds: data.entityIds,
      data: entities,
      timestamp: new Date().toISOString(),
    };

    // Send to webhook
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!webhookResponse.ok) {
      throw new Error(`Webhook failed: ${webhookResponse.statusText}`);
    }

    // Update sync status for all entities
    await Promise.all(
      data.entityIds.map(entityId =>
        prisma.contentSync.upsert({
          where: {
            unique_entity_content_sync: {
              entity_type: data.entityType,
              entity_id: entityId,
            },
          },
          update: {
            sync_status: 'pending',
            last_sync_at: new Date(),
            webhook_url: webhookUrl,
            retry_count: {
              increment: 1,
            },
          },
          create: {
            entity_type: data.entityType,
            entity_id: entityId,
            sync_status: 'pending',
            last_sync_at: new Date(),
            webhook_url: webhookUrl,
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: `${entities.length} ${data.entityType}s queued for sync`,
      entityIds: data.entityIds,
    });
  } catch (error) {
    console.error('Sync bulk error:', error);
    return NextResponse.json(
      { error: 'Failed to sync entities' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handler);
