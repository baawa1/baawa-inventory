#!/usr/bin/env node

/**
 * Console Logging Security Fix Script
 * Replaces insecure console.log statements with secure logging
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

const srcDir = path.join(__dirname, '../src');

// Files to process (TypeScript files in src directory)
const patterns = [
  'src/**/*.ts',
  'src/**/*.tsx',
  '!src/**/*.test.ts',
  '!src/**/*.test.tsx',
  '!src/**/*.spec.ts',
  '!src/**/*.spec.tsx',
  '!src/lib/utils/secure-logger.ts', // Don't modify the logger itself
];

// Console methods to replace
const consoleReplacements = {
  'console.log': 'secureLogger.info',
  'console.error': 'secureLogger.error',
  'console.warn': 'secureLogger.warn',
  'console.info': 'secureLogger.info',
  'console.debug': 'secureLogger.debug',
};

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let newContent = content;
    
    // Track if we need to add the import
    let needsImport = false;
    
    // Check if file already has console statements
    const hasConsoleStatements = Object.keys(consoleReplacements).some(
      pattern => content.includes(pattern)
    );
    
    if (!hasConsoleStatements) {
      return { modified: false, filePath };
    }
    
    // Replace console statements
    Object.entries(consoleReplacements).forEach(([oldPattern, newPattern]) => {
      const regex = new RegExp(oldPattern.replace('.', '\\.'), 'g');
      if (regex.test(newContent)) {
        newContent = newContent.replace(regex, newPattern);
        modified = true;
        needsImport = true;
      }
    });
    
    // Add import if needed and not already present
    if (needsImport && !content.includes("from '@/lib/utils/secure-logger'")) {
      // Find the last import statement
      const lines = newContent.split('\n');
      let lastImportIndex = -1;
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('import ') || lines[i].trim().startsWith('} from ')) {
          lastImportIndex = i;
        }
      }
      
      const importStatement = "import { secureLogger } from '@/lib/utils/secure-logger';";
      
      if (lastImportIndex >= 0) {
        lines.splice(lastImportIndex + 1, 0, importStatement);
      } else {
        // No imports found, add at the top
        lines.unshift(importStatement, '');
      }
      
      newContent = lines.join('\n');
    }
    
    if (modified) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      return { modified: true, filePath, changes: Object.keys(consoleReplacements).filter(pattern => content.includes(pattern)) };
    }
    
    return { modified: false, filePath };
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return { modified: false, filePath, error: error.message };
  }
}

async function main() {
  console.log('🔒 Starting console logging security fix...');
  console.log('📁 Scanning for TypeScript files...');
  
  try {
    // Get all TypeScript files
    const files = await glob(patterns, { cwd: path.dirname(srcDir) });
    console.log(`📄 Found ${files.length} files to process`);
    
    const results = {
      processed: 0,
      modified: 0,
      errors: 0,
      files: []
    };
    
    files.forEach(file => {
      const filePath = path.resolve(path.dirname(srcDir), file);
      const result = processFile(filePath);
      
      results.processed++;
      if (result.modified) {
        results.modified++;
        console.log(`✅ Modified: ${file}`);
        if (result.changes) {
          console.log(`   Replaced: ${result.changes.join(', ')}`);
        }
      } else if (result.error) {
        results.errors++;
        console.log(`❌ Error: ${file} - ${result.error}`);
      }
      
      results.files.push(result);
    });
    
    console.log('\n📊 Summary:');
    console.log(`   Files processed: ${results.processed}`);
    console.log(`   Files modified: ${results.modified}`);
    console.log(`   Errors: ${results.errors}`);
    
    if (results.modified > 0) {
      console.log('\n✅ Console logging security fix completed successfully!');
      console.log('ℹ️  All console statements have been replaced with secure logging.');
      console.log('ℹ️  Secure logging will only output in development mode.');
    } else {
      console.log('\n✅ No console statements found that needed replacement.');
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

// Run the script
main();