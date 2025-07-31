# Database Migration Workflow

## Overview

This document describes the permanent solution for handling Prisma migrations with Supabase, which resolves the direct URL connection issue.

## Problem

When using Prisma with Supabase, the `DIRECT_URL` is not accessible from local machines, causing migration commands to fail with connection errors.

## Solution

We've created a custom migration script that automatically handles this issue by:

1. Temporarily removing the `directUrl` from the schema during migrations
2. Running the migration command using the pooled connection
3. Restoring the original schema afterward

## Usage

### Quick Commands

```bash
# Check migration status
npm run db:status

# Deploy pending migrations
npm run db:deploy

# Create and apply new migration
npm run db:dev -- --name add_new_table

# Resolve failed migration
npm run db:resolve 20250730224530_add_split_payments_table

# Reset migration state (use with caution)
npm run db:reset --confirm
```

### Direct Script Usage

```bash
# Check migration status
node scripts/migrate.js status

# Deploy pending migrations
node scripts/migrate.js deploy

# Create and apply new migration
node scripts/migrate.js dev --name add_new_table

# Resolve failed migration
node scripts/migrate.js resolve 20250730224530_add_split_payments_table

# Reset migration state (use with caution)
node scripts/migrate.js reset --confirm
```

## How It Works

1. **Backup**: The script creates a backup of your current `schema.prisma`
2. **Modify**: Temporarily removes the `directUrl` line from the schema
3. **Execute**: Runs the Prisma migration command using the pooled connection
4. **Restore**: Restores the original schema with `directUrl` intact
5. **Cleanup**: Removes the backup file

## Safety Features

- **Automatic Backup**: Your schema is always backed up before modification
- **Guaranteed Restoration**: The schema is restored even if the migration fails
- **Process Handling**: Handles SIGINT and SIGTERM to ensure cleanup
- **Error Recovery**: Provides clear error messages and exit codes

## Migration Workflow

### Development Workflow

1. **Make schema changes** in `prisma/schema.prisma`
2. **Create migration**: `npm run db:dev -- --name descriptive_name`
3. **Review migration** in `prisma/migrations/`
4. **Test locally** to ensure it works
5. **Commit changes** to version control

### Production Deployment

1. **Deploy code** to production
2. **Run migrations**: `npm run db:deploy`
3. **Verify status**: `npm run db:status`

### Troubleshooting

#### Failed Migration State

If a migration fails and leaves the database in an inconsistent state:

```bash
# Check what failed
npm run db:status

# If the table exists but migration failed, resolve it
npm run db:resolve <migration_name>

# Then deploy remaining migrations
npm run db:deploy
```

#### Schema Conflicts

If you encounter schema conflicts:

```bash
# Check current status
npm run db:status

# If needed, reset migration state (WARNING: This will reset all migrations)
npm run db:reset --confirm

# Then redeploy all migrations
npm run db:deploy
```

## Environment Variables

Ensure your `.env` file has both URLs:

```env
# Pooled connection (for normal operations)
DATABASE_URL="postgresql://postgres.bhwywfigcyotkxbujivm:password@aws-0-eu-west-2.pooler.supabase.com:5432/postgres"

# Direct connection (for migrations, handled by script)
DIRECT_URL="postgresql://postgres:password@db.bhwywfigcyotkxbujivm.supabase.co:5432/postgres"
```

## Best Practices

1. **Always use the migration script** instead of direct Prisma commands
2. **Test migrations locally** before deploying to production
3. **Use descriptive migration names** that explain the change
4. **Review migration files** before applying them
5. **Keep migrations small and focused** on single changes
6. **Backup your database** before major migrations

## Troubleshooting Common Issues

### Connection Errors

If you see connection errors:

1. Verify your `.env` file has correct URLs
2. Check that your Supabase project is active
3. Ensure your IP is not blocked by Supabase
4. Try the migration script instead of direct Prisma commands

### Migration State Issues

If migrations are in an inconsistent state:

1. Use `npm run db:status` to check current state
2. Use `npm run db:resolve` to fix failed migrations
3. Use `npm run db:deploy` to apply pending migrations

### Schema Conflicts

If the schema doesn't match the database:

1. Use `npm run db:status` to see differences
2. Use `npm run db:reset --confirm` to reset (WARNING: destructive)
3. Use `npm run db:deploy` to reapply all migrations

## Support

If you encounter issues:

1. Check this documentation first
2. Review the migration script logs
3. Verify your environment variables
4. Check Supabase project status
5. Contact the development team

## Migration Script Details

The migration script (`scripts/migrate.js`) provides:

- **Automatic schema backup and restoration**
- **Safe handling of direct URL issues**
- **Comprehensive error handling**
- **Process interruption handling**
- **Clear logging and feedback**

This ensures that migrations work reliably regardless of the direct URL accessibility issues. 