#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function backupVariantData() {
  try {
    console.log('📦 Starting ProductVariant data backup...\n');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, '../backups');

    // Create backups directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Backup file path
    const backupFile = path.join(backupDir, `variant-backup-${timestamp}.json`);

    // Fetch all variant data with related info
    const variants = await prisma.productVariant.findMany({
      include: {
        products: {
          select: {
            id: true,
            name: true,
            sku: true,
            stock: true,
            categoryId: true,
            brandId: true
          }
        }
      }
    });

    // Fetch sales items with variants
    const salesWithVariants = await prisma.salesItem.findMany({
      where: { variant_id: { not: null } },
      include: {
        product_variants: {
          select: { id: true, name: true, sku: true }
        },
        products: {
          select: { id: true, name: true, sku: true }
        },
        sales_transactions: {
          select: { id: true, created_at: true, total_amount: true }
        }
      }
    });

    // Fetch stock adjustments with variants
    const adjustmentsWithVariants = await prisma.stockAdjustment.findMany({
      where: { variant_id: { not: null } },
      include: {
        product_variants: {
          select: { id: true, name: true, sku: true }
        },
        products: {
          select: { id: true, name: true, sku: true }
        }
      }
    });

    // Create backup data
    const backupData = {
      timestamp: new Date().toISOString(),
      summary: {
        totalVariants: variants.length,
        productsWithVariants: await prisma.product.count({ where: { hasVariants: true } }),
        salesWithVariantRef: salesWithVariants.length,
        adjustmentsWithVariantRef: adjustmentsWithVariants.length
      },
      variants,
      salesWithVariants,
      adjustmentsWithVariants
    };

    // Write backup file
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));

    console.log('✅ Backup complete!');
    console.log(`📁 Backup saved to: ${backupFile}`);
    console.log(`\n📊 Backup Summary:`);
    console.log(`   - Variants backed up: ${variants.length}`);
    console.log(`   - Products with variants: ${backupData.summary.productsWithVariants}`);
    console.log(`   - Sales with variant refs: ${salesWithVariants.length}`);
    console.log(`   - Adjustments with variant refs: ${adjustmentsWithVariants.length}`);

    // Create CSV export for easy viewing
    const csvFile = path.join(backupDir, `variant-backup-${timestamp}.csv`);
    const csvHeader = 'Variant ID,Variant Name,Variant SKU,Color,Size,Material,Stock,Product ID,Product Name,Product SKU,Product Stock\n';
    const csvRows = variants.map(v => {
      return `${v.id},"${v.name}","${v.sku}","${v.color || ''}","${v.size || ''}","${v.material || ''}",${v.current_stock},${v.products?.id || ''},"${v.products?.name || ''}","${v.products?.sku || ''}",${v.products?.stock || 0}`;
    }).join('\n');

    fs.writeFileSync(csvFile, csvHeader + csvRows);
    console.log(`📄 CSV export saved to: ${csvFile}\n`);

    return backupFile;

  } catch (error) {
    console.error('❌ Error backing up variant data:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

backupVariantData();
