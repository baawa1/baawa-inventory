#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

console.log("🔄 Fixing auth import paths...\n");

// Files that need auth import path fixes
const pathFixMappings = [
  // Dashboard pages - need more ../
  {
    pattern: "src/app/(dashboard)/inventory/categories/add/page.tsx",
    incorrect: "../../../../auth",
    correct: "../../../../../../auth",
  },
  {
    pattern: "src/app/(dashboard)/inventory/low-stock/page.tsx",
    incorrect: "../../../auth",
    correct: "../../../../../auth",
  },
  {
    pattern: "src/app/(dashboard)/inventory/products/[id]/edit/page.tsx",
    incorrect: "../../../../../auth",
    correct: "../../../../../../auth",
  },
  {
    pattern: "src/app/(dashboard)/inventory/products/add/page.tsx",
    incorrect: "../../../../auth",
    correct: "../../../../../../auth",
  },
  {
    pattern: "src/app/(dashboard)/inventory/products/archived/page.tsx",
    incorrect: "../../../../auth",
    correct: "../../../../../../auth",
  },
  {
    pattern: "src/app/(dashboard)/inventory/products/manage/page.tsx",
    incorrect: "../../../../auth",
    correct: "../../../../../../auth",
  },
  {
    pattern: "src/app/(dashboard)/inventory/stock-reconciliations/page.tsx",
    incorrect: "../../../auth",
    correct: "../../../../../auth",
  },
  {
    pattern: "src/app/(dashboard)/inventory/stock-reconciliations/add/page.tsx",
    incorrect: "../../../../auth",
    correct: "../../../../../../auth",
  },
  {
    pattern:
      "src/app/(dashboard)/inventory/stock-reconciliations/[id]/page.tsx",
    incorrect: "../../../../auth",
    correct: "../../../../../../auth",
  },
  {
    pattern:
      "src/app/(dashboard)/inventory/stock-reconciliations/[id]/edit/page.tsx",
    incorrect: "../../../../../auth",
    correct: "../../../../../../../auth",
  },
  {
    pattern: "src/app/(dashboard)/inventory/suppliers/page.tsx",
    incorrect: "../../../auth",
    correct: "../../../../../auth",
  },
  {
    pattern: "src/app/(dashboard)/inventory/suppliers/add/page.tsx",
    incorrect: "../../../../auth",
    correct: "../../../../../../auth",
  },
  {
    pattern: "src/app/(dashboard)/inventory/suppliers/[id]/page.tsx",
    incorrect: "../../../../auth",
    correct: "../../../../../../auth",
  },
  {
    pattern: "src/app/(dashboard)/inventory/stock-history/page.tsx",
    incorrect: "../../../auth",
    correct: "../../../../../auth",
  },
];

let totalFiles = 0;
let totalFixes = 0;

function fixFile(mapping) {
  const fullPath = path.join(process.cwd(), mapping.pattern);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${mapping.pattern}`);
    return;
  }

  let content = fs.readFileSync(fullPath, "utf8");
  const importPattern = new RegExp(
    `import\\s*{\\s*auth\\s*}\\s*from\\s*["']${mapping.incorrect.replace(/\//g, "\\/")}["'];?`,
    "g"
  );

  if (importPattern.test(content)) {
    content = content.replace(
      importPattern,
      `import { auth } from "${mapping.correct}";`
    );
    fs.writeFileSync(fullPath, content, "utf8");
    console.log(`✅ Fixed: ${mapping.pattern}`);
    totalFiles++;
    totalFixes++;
  } else {
    console.log(`ℹ️  No fix needed: ${mapping.pattern}`);
  }
}

// Process all mappings
console.log("Processing import fixes...\n");
for (const mapping of pathFixMappings) {
  fixFile(mapping);
}

console.log(`\n🎉 Import fixes completed!`);
console.log(`📊 Summary:`);
console.log(`   - Files fixed: ${totalFiles}`);
console.log(`   - Total fixes: ${totalFixes}`);
console.log(`\n✅ Auth import paths have been corrected`);
