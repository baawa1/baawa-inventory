#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SCHEMA_PATH = path.join(__dirname, '../prisma/schema.prisma');
const BACKUP_PATH = path.join(__dirname, '../prisma/schema.prisma.backup');

function backupSchema() {
  console.log('📋 Backing up current schema...');
  fs.copyFileSync(SCHEMA_PATH, BACKUP_PATH);
}

function restoreSchema() {
  console.log('📋 Restoring original schema...');
  if (fs.existsSync(BACKUP_PATH)) {
    fs.copyFileSync(BACKUP_PATH, SCHEMA_PATH);
    fs.unlinkSync(BACKUP_PATH);
  }
}

function removeDirectUrl() {
  console.log('🔧 Temporarily removing directUrl for migration...');
  let schemaContent = fs.readFileSync(SCHEMA_PATH, 'utf8');
  
  // Remove directUrl line
  schemaContent = schemaContent.replace(/^\s*directUrl\s*=\s*env\("DIRECT_URL"\)\s*$/gm, '');
  
  // Clean up any extra whitespace
  schemaContent = schemaContent.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  fs.writeFileSync(SCHEMA_PATH, schemaContent);
}

function runCommand(command, description) {
  console.log(`\n🔄 ${description}...`);
  try {
    const output = execSync(command, { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    console.log(`✅ ${description} completed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    return false;
  }
}

function main() {
  const command = process.argv[2];
  
  if (!command) {
    console.log(`
🚀 Prisma Migration Helper

Usage:
  node scripts/migrate.js <command>

Commands:
  status     - Check migration status
  deploy     - Deploy pending migrations
  dev        - Create and apply new migration
  reset      - Reset migration state (use with caution)
  resolve    - Resolve failed migrations

Examples:
  node scripts/migrate.js status
  node scripts/migrate.js deploy
  node scripts/migrate.js dev --name add_new_table
    `);
    process.exit(1);
  }

  console.log('🚀 Starting Prisma Migration Helper...\n');

  try {
    // Backup original schema
    backupSchema();

    // Remove directUrl temporarily
    removeDirectUrl();

    // Run the requested command
    let success = false;
    
    switch (command) {
      case 'status':
        success = runCommand('npx prisma migrate status', 'Checking migration status');
        break;
        
      case 'deploy':
        success = runCommand('npx prisma migrate deploy', 'Deploying migrations');
        break;
        
      case 'dev':
        const args = process.argv.slice(3).join(' ');
        success = runCommand(`npx prisma migrate dev ${args}`, 'Creating and applying migration');
        break;
        
      case 'reset':
        console.log('⚠️  WARNING: This will reset your migration state!');
        const confirm = process.argv[3];
        if (confirm !== '--confirm') {
          console.log('Add --confirm to proceed with reset');
          process.exit(1);
        }
        success = runCommand('npx prisma migrate reset --force', 'Resetting migration state');
        break;
        
      case 'resolve':
        const migrationName = process.argv[3];
        if (!migrationName) {
          console.log('❌ Please provide migration name: node scripts/migrate.js resolve <migration_name>');
          process.exit(1);
        }
        success = runCommand(`npx prisma migrate resolve --applied ${migrationName}`, `Resolving migration ${migrationName}`);
        break;
        
      default:
        console.log(`❌ Unknown command: ${command}`);
        process.exit(1);
    }

    if (success) {
      console.log('\n🎉 Migration operation completed successfully!');
    } else {
      console.log('\n❌ Migration operation failed!');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  } finally {
    // Always restore the schema
    restoreSchema();
    console.log('\n✅ Schema restored to original state');
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n⚠️  Process interrupted, restoring schema...');
  restoreSchema();
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n⚠️  Process terminated, restoring schema...');
  restoreSchema();
  process.exit(1);
});

main(); 