#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function applyWordPressRemoval() {
  try {
    console.log('🚀 Removing WordPress integration fields...\n');

    // Drop wordpress_id from brands
    console.log('Removing wordpress_id from brands...');
    await prisma.$executeRawUnsafe(`ALTER TABLE "brands" DROP COLUMN IF EXISTS "wordpress_id"`);
    console.log('✓ Removed from brands\n');

    // Drop wordpress_id from categories
    console.log('Removing wordpress_id from categories...');
    await prisma.$executeRawUnsafe(`ALTER TABLE "categories" DROP COLUMN IF EXISTS "wordpress_id"`);
    console.log('✓ Removed from categories\n');

    // Drop wordpress_id from products
    console.log('Removing wordpress_id from products...');
    await prisma.$executeRawUnsafe(`ALTER TABLE "products" DROP COLUMN IF EXISTS "wordpress_id"`);
    console.log('✓ Removed from products\n');

    // Drop sync_stats from products
    console.log('Removing sync_stats from products...');
    await prisma.$executeRawUnsafe(`ALTER TABLE "products" DROP COLUMN IF EXISTS "sync_stats"`);
    console.log('✓ Removed from products\n');

    // Drop wordpress_id from coupons
    console.log('Removing wordpress_id from coupons...');
    await prisma.$executeRawUnsafe(`ALTER TABLE "coupons" DROP COLUMN IF EXISTS "wordpress_id"`);
    console.log('✓ Removed from coupons\n');

    // Drop wordpress_id from customers
    console.log('Removing wordpress_id from customers...');
    await prisma.$executeRawUnsafe(`ALTER TABLE "customers" DROP COLUMN IF EXISTS "wordpress_id"`);
    console.log('✓ Removed from customers\n');

    // Drop wordpress_id from sales_transactions
    console.log('Removing wordpress_id from sales_transactions...');
    await prisma.$executeRawUnsafe(`ALTER TABLE "sales_transactions" DROP COLUMN IF EXISTS "wordpress_id"`);
    console.log('✓ Removed from sales_transactions\n');

    console.log('✅ All WordPress integration fields removed successfully!\n');

  } catch (error) {
    if (error.message.includes('does not exist')) {
      console.log('✅ WordPress fields already removed (columns do not exist)\n');
    } else {
      console.error('❌ Error removing WordPress fields:', error);
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

applyWordPressRemoval();
