#!/usr/bin/env node

// Load production environment
require('dotenv').config({ path: '.env.production.temp' });

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function checkProductionVariantData() {
  try {
    console.log('🔍 Checking PRODUCTION ProductVariant data...');
    console.log('⚠️  DATABASE: PRODUCTION (READ-ONLY CHECK)\n');

    // Check variant count
    const variantCount = await prisma.productVariant.count();
    console.log(`📊 ProductVariant records: ${variantCount}`);

    // Check products with hasVariants flag
    const productsWithVariants = await prisma.product.count({
      where: { hasVariants: true }
    });
    console.log(`📦 Products with hasVariants=true: ${productsWithVariants}`);

    // Check sales items with variant_id
    const salesWithVariants = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM sales_items WHERE variant_id IS NOT NULL
    `;
    console.log(`🛒 Sales items with variant_id: ${salesWithVariants[0].count}`);

    // Check stock adjustments with variant_id
    const adjustmentsWithVariants = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM stock_adjustments WHERE variant_id IS NOT NULL
    `;
    console.log(`📝 Stock adjustments with variant_id: ${adjustmentsWithVariants[0].count}`);

    console.log('\n✅ Check complete!');
    console.log('\n📋 Summary:');
    console.log(`   - Total variant records: ${variantCount}`);
    console.log(`   - Products using variants: ${productsWithVariants}`);
    console.log(`   - Sales referencing variants: ${salesWithVariants[0].count}`);
    console.log(`   - Adjustments referencing variants: ${adjustmentsWithVariants[0].count}`);

    if (variantCount > 0) {
      console.log('\n⚠️  WARNING: Production has variant data!');
      console.log('   You should backup this data before proceeding.');
    } else {
      console.log('\n✅ Production ProductVariant table is empty - safe to remove');
    }

  } catch (error) {
    console.error('❌ Error checking production data:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkProductionVariantData();
