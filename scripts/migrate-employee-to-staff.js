#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

console.log("🔄 Starting EMPLOYEE → STAFF role migration...\n");

// Files that need EMPLOYEE → STAFF migration
const filesToMigrate = [
  // Core authentication files
  "auth.ts",
  "src/lib/auth-service.ts",
  "src/lib/roles.ts",
  "src/lib/api-auth-middleware.ts",
  "src/lib/auth-rbac.ts",
  "src/lib/validations/user.ts",
  "src/lib/db-service.ts",
  "src/lib/auth/roles.ts",

  // API routes
  "src/app/api/admin/approve-user/route.ts",
  "src/app/api/users/[id]/route.ts",
  "src/app/api/auth/register/route.ts",

  // Dashboard pages
  "src/app/(dashboard)/inventory/products/page.tsx",
  "src/app/(dashboard)/pos/page.tsx",
  "src/app/(dashboard)/inventory/products/[id]/edit/page.tsx",
  "src/app/(dashboard)/inventory/products/manage/page.tsx",
  "src/app/(dashboard)/inventory/stock-reconciliations/[id]/page.tsx",

  // Type definitions
  "src/types/user.ts",
  "src/types/app.ts",

  // Components
  "src/components/inventory/QuickActions.tsx",
  "src/components/inventory/ProductListRefactored.tsx",
  "src/components/inventory/ProductList.tsx",
  "src/components/admin/UserForm.tsx",
  "src/components/admin/UserTable.tsx",
  "src/components/admin/types/user.ts",
];

// Patterns to find and replace
const replacements = [
  // Enum values and constants
  { find: /EMPLOYEE: "EMPLOYEE"/g, replace: 'STAFF: "STAFF"' },
  { find: /USER_ROLES\.EMPLOYEE/g, replace: "USER_ROLES.STAFF" },
  { find: /"EMPLOYEE"/g, replace: '"STAFF"' },
  { find: /'EMPLOYEE'/g, replace: "'STAFF'" },

  // Array references
  {
    find: /\["ADMIN", "MANAGER", "EMPLOYEE"\]/g,
    replace: '["ADMIN", "MANAGER", "STAFF"]',
  },
  {
    find: /\["ADMIN", "MANAGER", "EMPLOYEE"\]/g,
    replace: '["ADMIN", "MANAGER", "STAFF"]',
  },

  // Type definitions
  {
    find: /"ADMIN" \| "MANAGER" \| "EMPLOYEE"/g,
    replace: '"ADMIN" | "MANAGER" | "STAFF"',
  },

  // Comments and documentation
  { find: /EMPLOYEE role/g, replace: "STAFF role" },
  { find: /Employee/g, replace: "Staff" },
  { find: /employee/g, replace: "staff" },

  // SelectItem values
  {
    find: /<SelectItem value="EMPLOYEE">Employee<\/SelectItem>/g,
    replace: '<SelectItem value="STAFF">Staff</SelectItem>',
  },

  // Switch case statements
  { find: /case "EMPLOYEE":/g, replace: 'case "STAFF":' },

  // Default role assignments
  { find: /role: "EMPLOYEE"/g, replace: 'role: "STAFF"' },
  { find: /\|\| "EMPLOYEE"/g, replace: '|| "STAFF"' },

  // Permission definitions
  { find: /EMPLOYEE: {/g, replace: "STAFF: {" },
];

let totalFiles = 0;
let totalReplacements = 0;

function migrateFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, "utf8");
  let fileReplacements = 0;
  let hasChanges = false;

  // Apply all replacements
  for (const replacement of replacements) {
    const matches = content.match(replacement.find);
    if (matches) {
      content = content.replace(replacement.find, replacement.replace);
      fileReplacements += matches.length;
      hasChanges = true;
    }
  }

  if (hasChanges) {
    fs.writeFileSync(fullPath, content, "utf8");
    console.log(`✅ ${filePath} - ${fileReplacements} replacements`);
    totalFiles++;
    totalReplacements += fileReplacements;
  } else {
    console.log(`ℹ️  ${filePath} - no changes needed`);
  }
}

// Process all files
console.log("Processing files...\n");
for (const file of filesToMigrate) {
  migrateFile(file);
}

console.log(`\n🎉 Migration completed!`);
console.log(`📊 Summary:`);
console.log(`   - Files modified: ${totalFiles}`);
console.log(`   - Total replacements: ${totalReplacements}`);
console.log(`\n✅ All EMPLOYEE references have been migrated to STAFF`);
console.log(
  `\n⚠️  Note: You may need to update tests and other files manually`
);
console.log(
  `📝 Remember to update your database to use STAFF role for existing users`
);
