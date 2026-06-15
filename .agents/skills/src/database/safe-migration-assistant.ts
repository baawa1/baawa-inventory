/**
 * Safe Migration Assistant Skill
 * Prevents destructive database operations and guides safe migrations
 */

import { FileUtils } from '../utils/file-utils.js';
import { SkillResult } from '../types/common.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface MigrationCheck {
  isSafe: boolean;
  warnings: string[];
  suggestions: string[];
  breakingChanges: string[];
}

export class SafeMigrationAssistant {
  private projectRoot: string;

  constructor() {
    this.projectRoot = FileUtils.getProjectRoot();
  }

  /**
   * Check if migration command is safe
   */
  async checkMigration(command: string): Promise<SkillResult<MigrationCheck>> {
    try {
      console.log('🔍 Analyzing migration command...\n');

      const check: MigrationCheck = {
        isSafe: true,
        warnings: [],
        suggestions: [],
        breakingChanges: []
      };

      // Check for destructive commands
      if (command.includes('migrate reset') || command.includes('migrate:reset')) {
        check.isSafe = false;
        check.warnings.push('🚨 CRITICAL: migrate reset will DELETE ALL DATA');
        check.warnings.push('This operation is IRREVERSIBLE and will drop your entire database');
        check.suggestions.push('Use "npx prisma db push" to sync schema without data loss');
        check.suggestions.push('Use "npx prisma migrate dev" to create a new migration');
        check.suggestions.push('If you must reset, backup your database first');

        return { success: true, data: check };
      }

      if (command.includes('db push --force-reset')) {
        check.isSafe = false;
        check.warnings.push('⚠️  WARNING: --force-reset will DELETE ALL DATA');
        check.suggestions.push('Remove --force-reset flag to sync without data loss');

        return { success: true, data: check };
      }

      // Check schema for breaking changes
      const schemaChanges = await this.detectSchemaChanges();
      check.breakingChanges = schemaChanges;

      if (schemaChanges.length > 0) {
        check.warnings.push(`Found ${schemaChanges.length} potential breaking changes`);
        check.suggestions.push('Review schema changes carefully before applying');
        check.suggestions.push('Consider creating a backup before migration');
      }

      // Safe commands
      if (command.includes('db push') && !command.includes('force')) {
        check.suggestions.push('✓ Safe: db push will sync schema without data loss');
      }

      if (command.includes('migrate dev')) {
        check.suggestions.push('✓ Safe: migrate dev will create a new migration');
        check.suggestions.push('Review generated migration SQL before applying');
      }

      if (command.includes('generate')) {
        check.suggestions.push('✓ Safe: generate only updates Prisma Client');
      }

      return { success: true, data: check };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Detect potentially breaking schema changes
   */
  private async detectSchemaChanges(): Promise<string[]> {
    const changes: string[] = [];
    const schemaPath = `${this.projectRoot}/prisma/schema.prisma`;

    if (!await FileUtils.fileExists(schemaPath)) {
      return changes;
    }

    try {
      // Run prisma migrate status to detect changes
      const { stdout } = await execAsync('npx prisma migrate status', {
        cwd: this.projectRoot
      });

      if (stdout.includes('not in sync') || stdout.includes('drift')) {
        changes.push('Schema is out of sync with database');
      }
    } catch (error) {
      // Migration status check failed, schema might have changes
      changes.push('Unable to determine schema status');
    }

    return changes;
  }

  /**
   * Suggest safe alternative
   */
  suggestAlternative(command: string): string {
    if (command.includes('migrate reset')) {
      return 'npx prisma db push';
    }

    if (command.includes('db push --force-reset')) {
      return 'npx prisma db push';
    }

    return command;
  }
}

export async function run(args?: string): Promise<void> {
  const assistant = new SafeMigrationAssistant();
  const command = args || process.argv.slice(2).join(' ');

  if (!command || command.trim() === '') {
    console.log('\n📋 Safe Migration Assistant\n');
    console.log('Usage: safe-migrate <prisma-command>\n');
    console.log('Example: safe-migrate "migrate reset"\n');
    console.log('This tool checks for destructive operations and suggests safe alternatives.\n');
    return;
  }

  const result = await assistant.checkMigration(command);

  if (result.success && result.data) {
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('  MIGRATION SAFETY CHECK');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log(`Command: ${command}\n`);

    if (!result.data.isSafe) {
      console.log('❌ UNSAFE OPERATION DETECTED\n');
      console.log('⚠️  Warnings:\n');
      result.data.warnings.forEach(w => console.log(`  ${w}`));
    } else if (result.data.warnings.length > 0) {
      console.log('⚠️  Warnings:\n');
      result.data.warnings.forEach(w => console.log(`  ${w}`));
    } else {
      console.log('✅ Operation appears safe\n');
    }

    if (result.data.breakingChanges.length > 0) {
      console.log('\n🔍 Breaking Changes Detected:\n');
      result.data.breakingChanges.forEach(c => console.log(`  • ${c}`));
    }

    if (result.data.suggestions.length > 0) {
      console.log('\n💡 Suggestions:\n');
      result.data.suggestions.forEach(s => console.log(`  ${s}`));
    }

    if (!result.data.isSafe) {
      const alternative = assistant.suggestAlternative(command);
      console.log(`\n✓ Safe alternative: ${alternative}\n`);
    }

    console.log('\n═══════════════════════════════════════════════════════════════\n');

    if (!result.data.isSafe) {
      process.exit(1);
    }
  } else {
    console.error('❌ Check failed:', result.error);
    process.exit(1);
  }
}
