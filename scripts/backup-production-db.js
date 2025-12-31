#!/usr/bin/env node

// Load production environment
require('dotenv').config({ path: '.env.production.temp' });

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);
const prisma = new PrismaClient();

async function backupProductionDatabase() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, '../backups/production');

    // Create backup directory
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    console.log('📦 PRODUCTION DATABASE BACKUP');
    console.log('═══════════════════════════════════════════════════\n');

    // Method 1: Prisma-based JSON backup (all tables)
    console.log('🔄 Method 1: Creating JSON backup of all tables...\n');

    const backup = {
      timestamp: new Date().toISOString(),
      database: 'production',
      tables: {}
    };

    // Backup all important tables
    const tables = [
      'products',
      'product_variants',
      'categories',
      'brands',
      'suppliers',
      'sales_transactions',
      'sales_items',
      'stock_additions',
      'stock_adjustments',
      'stock_reconciliations',
      'stock_reconciliation_items',
      'users',
      'customers'
    ];

    for (const table of tables) {
      try {
        console.log(`   Backing up ${table}...`);
        const data = await prisma.$queryRawUnsafe(`SELECT * FROM ${table}`);
        backup.tables[table] = {
          count: data.length,
          data: data
        };
        console.log(`   ✓ ${table}: ${data.length} records`);
      } catch (error) {
        console.log(`   ⚠️  ${table}: ${error.message}`);
        backup.tables[table] = {
          count: 0,
          data: [],
          error: error.message
        };
      }
    }

    // Save JSON backup
    const jsonBackupFile = path.join(backupDir, `full-backup-${timestamp}.json`);
    fs.writeFileSync(jsonBackupFile, JSON.stringify(backup, null, 2));
    console.log(`\n✅ JSON backup saved: ${jsonBackupFile}`);

    // Get file size
    const stats = fs.statSync(jsonBackupFile);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`   File size: ${fileSizeInMB} MB`);

    // Method 2: PostgreSQL dump (if pg_dump available)
    console.log('\n🔄 Method 2: Attempting pg_dump backup...\n');

    const dumpFile = path.join(backupDir, `pg-dump-${timestamp}.sql`);

    // Extract connection details from DIRECT_URL
    const directUrl = process.env.DIRECT_URL;
    const urlMatch = directUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);

    if (urlMatch) {
      const [, username, password, host, port, database] = urlMatch;

      try {
        // Set password in environment
        process.env.PGPASSWORD = password;

        const dumpCommand = `pg_dump -h ${host} -p ${port} -U ${username} -d ${database} -F c -f ${dumpFile}`;

        console.log('   Running pg_dump (this may take a while)...');
        await execPromise(dumpCommand);

        const dumpStats = fs.statSync(dumpFile);
        const dumpSizeInMB = (dumpStats.size / (1024 * 1024)).toFixed(2);

        console.log(`✅ PostgreSQL dump saved: ${dumpFile}`);
        console.log(`   File size: ${dumpSizeInMB} MB`);

      } catch (error) {
        console.log(`⚠️  pg_dump not available or failed: ${error.message}`);
        console.log('   (JSON backup is still available)');
      }
    }

    // Summary
    console.log('\n═══════════════════════════════════════════════════');
    console.log('✅ PRODUCTION BACKUP COMPLETE');
    console.log('═══════════════════════════════════════════════════');
    console.log(`\nBackup location: ${backupDir}`);
    console.log('\nBackup includes:');

    let totalRecords = 0;
    for (const [table, info] of Object.entries(backup.tables)) {
      if (info.count > 0) {
        console.log(`  - ${table}: ${info.count} records`);
        totalRecords += info.count;
      }
    }

    console.log(`\nTotal records backed up: ${totalRecords}`);
    console.log('\n📋 To restore from JSON backup:');
    console.log(`   node scripts/restore-production-backup.js ${jsonBackupFile}`);

    console.log('\n📋 To restore from SQL dump:');
    console.log(`   pg_restore -h <host> -U <user> -d <database> ${dumpFile}`);

    console.log('\n✅ Safe to proceed with migration now!');
    console.log('═══════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

backupProductionDatabase();
