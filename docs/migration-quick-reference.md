# Migration Quick Reference

## 🚀 Quick Commands

| Command | Description |
|---------|-------------|
| `npm run db:status` | Check migration status |
| `npm run db:deploy` | Deploy pending migrations |
| `npm run db:dev -- --name add_table` | Create new migration |
| `npm run db:resolve <name>` | Resolve failed migration |
| `npm run db:reset --confirm` | Reset migration state |

## 📋 Common Workflows

### Daily Development
```bash
# Check if database is up to date
npm run db:status

# If changes needed, create migration
npm run db:dev -- --name descriptive_name
```

### Production Deployment
```bash
# Deploy all pending migrations
npm run db:deploy

# Verify deployment
npm run db:status
```

### Troubleshooting
```bash
# Check what's wrong
npm run db:status

# Fix failed migration
npm run db:resolve <migration_name>

# Deploy remaining migrations
npm run db:deploy
```

## ⚠️ Important Notes

- **Always use these commands** instead of direct `npx prisma migrate` commands
- **Test locally** before deploying to production
- **Backup database** before major migrations
- **Use descriptive names** for migrations

## 🔧 How It Works

The script automatically:
1. Backs up your schema
2. Removes `directUrl` temporarily
3. Runs the migration
4. Restores your schema
5. Cleans up

## 📞 Need Help?

1. Check `docs/database-migration-workflow.md` for detailed documentation
2. Review the migration script logs
3. Verify your `.env` file has correct URLs 