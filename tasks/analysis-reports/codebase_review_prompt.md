# Codebase Review: Prisma vs Supabase Usage Analysis

## Instructions for AI Assistant

You are tasked with analyzing my codebase to identify where Prisma and Supabase are being used for database operations. Your goal is to provide a comprehensive report that will help me refactor the code to use **only Prisma** consistently throughout the application.

## IMPORTANT: Analysis Only Mode
- **DO NOT** make any changes to the code
- **DO NOT** provide refactored code examples unless I explicitly ask
- **ONLY** analyze and report your findings
- Wait for my explicit approval before suggesting any modifications

## Analysis Requirements

### 1. File Scanning
Please scan all files in the project and identify:

#### Prisma Usage Patterns:
- Files importing `@prisma/client` or `PrismaClient`
- Files containing `prisma.` method calls (findMany, create, update, delete, etc.)
- Prisma schema files (`schema.prisma`)
- Prisma migration files
- Database seed files using Prisma
- Any Prisma-related configuration

#### Supabase Usage Patterns:
- Files importing `@supabase/supabase-js` or Supabase clients
- Files containing `supabase.from()`, `supabase.auth`, `supabase.storage` calls
- Direct SQL queries or RPC calls to Supabase
- Supabase real-time subscriptions
- Authentication code using Supabase Auth
- File upload code using Supabase Storage

### 2. Categorize Each Finding
For each file found, categorize the usage as:

**A. Pure Prisma** - Only uses Prisma for database operations
**B. Pure Supabase** - Only uses Supabase for database operations  
**C. Mixed Usage** - Uses both Prisma and Supabase in the same file
**D. Supabase Auth Only** - Uses Supabase only for authentication
**E. Supabase Storage Only** - Uses Supabase only for file storage
**F. Supabase Real-time Only** - Uses Supabase only for real-time features

### 3. Report Format

Please provide your findings in this exact format:

```markdown
# Prisma vs Supabase Usage Analysis Report

## Summary Statistics
- Total files scanned: [number]
- Files using Prisma: [number]
- Files using Supabase: [number]
- Files with mixed usage: [number]

## Category A: Pure Prisma Files
- `path/to/file1.ts` - [Brief description of what it does]
- `path/to/file2.ts` - [Brief description of what it does]

## Category B: Pure Supabase Database Files
- `path/to/file1.ts` - [Brief description of database operations]
- `path/to/file2.ts` - [Brief description of database operations]

## Category C: Mixed Usage Files (HIGH PRIORITY)
- `path/to/file1.ts` - Uses Prisma for [X] and Supabase for [Y]
- `path/to/file2.ts` - Uses Prisma for [X] and Supabase for [Y]

## Category D: Supabase Auth Only
- `path/to/file1.ts` - [Authentication-specific operations]
- `path/to/file2.ts` - [Authentication-specific operations]

## Category E: Supabase Storage Only
- `path/to/file1.ts` - [File upload/storage operations]
- `path/to/file2.ts` - [File upload/storage operations]

## Category F: Supabase Real-time Only
- `path/to/file1.ts` - [Real-time subscription operations]
- `path/to/file2.ts` - [Real-time subscription operations]

## Database Operations Analysis

### Prisma Operations Found:
- User management: [list files and operations]
- Product management: [list files and operations]
- Sales/transactions: [list files and operations]
- Inventory tracking: [list files and operations]
- Other: [list files and operations]

### Supabase Database Operations Found:
- User management: [list files and operations]
- Product management: [list files and operations]
- Sales/transactions: [list files and operations]
- Inventory tracking: [list files and operations]
- Other: [list files and operations]

## Potential Migration Challenges

### Missing Prisma Features:
- [List any Supabase features that don't have direct Prisma equivalents]

### Authentication Dependencies:
- [List files that mix auth with database operations]

### Real-time Dependencies:
- [List files that use Supabase real-time with database operations]

### Storage Dependencies:
- [List files that mix storage with database operations]

## Configuration Files
- Prisma configuration: [list prisma config files found]
- Supabase configuration: [list supabase config files found]
- Environment variables: [note which DB configs are present]

## Recommendations Priority Order
1. **Immediate**: Fix Category C (Mixed Usage) files first
2. **High**: Migrate Category B (Pure Supabase DB) files to Prisma
3. **Medium**: Decide on Auth strategy (keep Supabase Auth or migrate)
4. **Low**: Address storage and real-time features last
```

### 4. After Analysis
Once you complete the analysis, ask me:

"Analysis complete. I found [X] files with mixed usage and [Y] files using pure Supabase for database operations. Would you like me to:

A) Provide detailed migration steps for the mixed usage files
B) Show how to convert specific Supabase database operations to Prisma
C) Help design a migration strategy for the entire codebase
D) Focus on a specific category first

Please specify which option you'd prefer, or if you'd like me to focus on specific files from the analysis."

## Important Notes
- Focus on actual database CRUD operations, not just imports
- Note any complex queries that might be challenging to migrate
- Identify any Supabase-specific features (like RLS policies) that need consideration
- Flag any performance-critical sections that use either technology
- Note any TypeScript type conflicts between Prisma and Supabase types

Please begin your analysis now and provide the report in the exact format specified above.