#!/usr/bin/env node

const fs = require("fs");

console.log("🚀 Starting Auth.js v5 migration...");

// Server-side files that need getServerSession → auth() migration
const serverMigrations = [
  // Dashboard pages
  "src/app/(dashboard)/inventory/categories/page.tsx",
  "src/app/(dashboard)/inventory/stock-history/page.tsx",
  "src/app/(dashboard)/inventory/low-stock/page.tsx",
  "src/app/(dashboard)/inventory/suppliers/page.tsx",
  "src/app/(dashboard)/inventory/stock-reconciliations/page.tsx",
  "src/app/(dashboard)/inventory/categories/add/page.tsx",
  "src/app/(dashboard)/inventory/suppliers/add/page.tsx",
  "src/app/(dashboard)/inventory/products/add/page.tsx",
  "src/app/(dashboard)/inventory/products/archived/page.tsx",
  "src/app/(dashboard)/inventory/products/manage/page.tsx",
  "src/app/(dashboard)/inventory/suppliers/[id]/page.tsx",
  "src/app/(dashboard)/inventory/products/[id]/edit/page.tsx",
  "src/app/(dashboard)/inventory/stock-reconciliations/add/page.tsx",
  "src/app/(dashboard)/inventory/stock-reconciliations/[id]/page.tsx",
  "src/app/(dashboard)/inventory/stock-reconciliations/[id]/edit/page.tsx",

  // API routes
  "src/app/api/categories/simple/route.ts",
  "src/app/api/debug/session/route.ts",
  "src/app/api/admin/audit-logs/route.ts",
  "src/app/api/stock-additions/route.ts",
  "src/app/api/stock-additions/[id]/route.ts",
  "src/app/api/stock-additions/export/route.ts",
  "src/app/api/suppliers/route.ts",
  "src/app/api/suppliers/[id]/route.ts",
  "src/app/api/suppliers/simple/route.ts",
  "src/app/api/brands/[id]/route.ts",
  "src/app/api/sales/[id]/route.ts",
  "src/app/api/stock-reconciliations/route.ts",
  "src/app/api/stock-reconciliations/[id]/route.ts",
  "src/app/api/stock-reconciliations/[id]/approve/route.ts",
  "src/app/api/stock-reconciliations/[id]/reject/route.ts",
  "src/app/api/stock-reconciliations/[id]/submit/route.ts",
  "src/app/api/products/[id]/images/route.ts",
];

function migrateServerFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, "utf8");
  let modified = false;

  // Replace imports
  if (content.includes("getServerSession")) {
    console.log(`📝 Migrating: ${filePath}`);

    // Update imports
    content = content.replace(
      /import\s*{\s*getServerSession\s*}\s*from\s*["']next-auth["'];\s*\n/g,
      ""
    );
    content = content.replace(
      /import\s*{\s*getServerSession\s*}\s*from\s*["']next-auth\/next["'];\s*\n/g,
      ""
    );
    content = content.replace(
      /import\s*{\s*authOptions\s*}\s*from\s*["']@\/lib\/auth["'];\s*\n/g,
      ""
    );

    // Add auth import
    if (!content.includes("import { auth }")) {
      const importDepth = (filePath.match(/\//g) || []).length - 2; // src/app/... depth
      const authImportPath = "../".repeat(importDepth) + "auth";

      // Find a good place to insert the import
      const firstImportMatch = content.match(/^import .+;$/m);
      if (firstImportMatch) {
        content = content.replace(
          firstImportMatch[0],
          `import { auth } from "${authImportPath}";\n${firstImportMatch[0]}`
        );
      }
    }

    // Replace function calls
    content = content.replace(
      /const\s+session\s*=\s*await\s+getServerSession\(authOptions\);/g,
      "const session = await auth();"
    );

    // Update session checks to be more consistent
    content = content.replace(
      /if\s*\(\s*!session\?\?\.user\s*\)/g,
      "if (!session?.user)"
    );
    content = content.replace(
      /if\s*\(\s*!session\s*\)/g,
      "if (!session?.user)"
    );

    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated: ${filePath}`);
  }
}

// Migrate server files
console.log("\n📋 Migrating server-side files...");
serverMigrations.forEach(migrateServerFile);

// Client-side files
const clientFiles = [
  "src/hooks/useUserStatusValidation.ts",
  "src/hooks/api/session.ts",
  "src/hooks/api/session-migration.ts",
  "src/hooks/useCSRF.ts",
  "src/hooks/useAdminGuard.ts",
  "src/lib/session-management.ts",
  "src/lib/auth-rbac.ts",
  "src/components/inventory/SupplierDetailView.tsx",
  "src/components/pos/TransactionHistory.tsx",
  "src/components/pos/POSInterface.tsx",
  "src/components/inventory/SupplierList.tsx",
  "src/components/inventory/BrandList.tsx",
  "src/components/inventory/SupplierDetailModal.tsx",
  "src/app/verify-email/page.tsx",
  "src/app/pending-approval/page.tsx",
];

function migrateClientFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, "utf8");
  let modified = false;

  if (content.includes("next-auth/react")) {
    console.log(`📝 Migrating client file: ${filePath}`);

    // For now, comment out the next-auth/react usage as it needs custom implementation
    content = content.replace(
      /import\s*{[^}]*}\s*from\s*["']next-auth\/react["'];?\s*\n/g,
      "// TODO: Migrate to Auth.js v5 - temporarily commented out\n// $&"
    );

    // Comment out useSession usage
    content = content.replace(
      /const\s*{\s*[^}]*\s*}\s*=\s*useSession\(\);?/g,
      "// TODO: Implement Auth.js v5 session handling\n  // $&"
    );

    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated: ${filePath}`);
  }
}

// Migrate client files (temporary commenting approach)
console.log(
  "\n📋 Temporarily commenting out client-side next-auth/react usage..."
);
clientFiles.forEach(migrateClientFile);

console.log("\n🎉 Auth.js v5 migration script completed!");
console.log("\n📝 Next steps:");
console.log("1. Review the migrated files");
console.log("2. Implement custom Auth.js v5 client-side patterns");
console.log("3. Test authentication flows");
console.log("4. Remove commented code once replacements are implemented");
