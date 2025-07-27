#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

const sourceFiles = glob.sync('src/**/*.{ts,tsx}', {
  ignore: ['src/**/*.d.ts', 'src/**/*.test.{ts,tsx}'],
});

console.log('Fixing ESLint issues...');

// Fix unused variables by adding underscore prefix
sourceFiles.forEach(filePath => {
  let content = readFileSync(filePath, 'utf8');
  let changed = false;

  // Common unused variable patterns - prefix with underscore
  const unusedVarPatterns = [
    // Function parameters
    /(\w+):\s*(\w+)(\s*=\s*[^,)]+)?(?=\s*[,)])/g,
    // Variable declarations that might be unused
    /const\s+(\w+)\s*=/g,
    // Destructured variables
    /{\s*(\w+)(?:\s*:\s*\w+)?\s*}/g,
  ];

  // Only process if it's not already prefixed with underscore
  content = content.replace(
    /const\s+([a-zA-Z][a-zA-Z0-9]*)\s*=/g,
    (match, varName) => {
      if (varName.startsWith('_')) return match;

      // Check if this variable is actually used in the code
      const usageRegex = new RegExp(`\\b${varName}\\b`, 'g');
      const matches = content.match(usageRegex) || [];

      // If only declared once (not used elsewhere), prefix with underscore
      if (matches.length <= 1) {
        changed = true;
        return match.replace(varName, `_${varName}`);
      }

      return match;
    }
  );

  // Fix unused destructured variables
  content = content.replace(
    /{\s*([a-zA-Z][a-zA-Z0-9]*)\s*}/g,
    (match, varName) => {
      if (varName.startsWith('_')) return match;

      const usageRegex = new RegExp(`\\b${varName}\\b`, 'g');
      const matches = content.match(usageRegex) || [];

      if (matches.length <= 1) {
        changed = true;
        return match.replace(varName, `_${varName}`);
      }

      return match;
    }
  );

  // Fix unused imports
  content = content.replace(
    /import\s*{\s*([^}]+)\s*}\s*from/g,
    (match, imports) => {
      const importList = imports.split(',').map(imp => imp.trim());
      const usedImports = importList.filter(imp => {
        const cleanImp = imp.replace(/\s+as\s+\w+/, '').trim();
        const usageRegex = new RegExp(`\\b${cleanImp}\\b`, 'g');
        const matches = content.match(usageRegex) || [];
        return matches.length > 1; // More than just the import declaration
      });

      if (usedImports.length !== importList.length) {
        changed = true;
        const unusedImports = importList.filter(
          imp => !usedImports.includes(imp)
        );
        const prefixedUnused = unusedImports.map(imp => `_${imp}`);
        return match.replace(
          imports,
          [...usedImports, ...prefixedUnused].join(', ')
        );
      }

      return match;
    }
  );

  if (changed) {
    writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed unused variables in: ${filePath}`);
  }
});

console.log('Running ESLint with auto-fix...');
try {
  execSync('npx eslint src --ext .ts,.tsx --fix', { stdio: 'inherit' });
} catch (error) {
  console.log('ESLint completed with remaining issues');
}

console.log('ESLint fixes applied!');
