/**
 * Pre-commit Security Checker Skill
 * Run security checks before committing code
 */

import { FileUtils } from '../utils/file-utils.js';
import { SecurityIssue, SkillResult } from '../types/common.js';

export class PreCommitChecker {
  private projectRoot: string;

  constructor() {
    this.projectRoot = FileUtils.getProjectRoot();
  }

  async check(files?: string[]): Promise<SkillResult<SecurityIssue[]>> {
    try {
      console.log('🔍 Running pre-commit security checks...\n');

      const issues: SecurityIssue[] = [];

      // Get staged files or provided files
      const filesToCheck = files || await this.getStagedFiles();

      if (filesToCheck.length === 0) {
        return {
          success: true,
          data: [],
          warnings: ['No files to check']
        };
      }

      console.log(`Checking ${filesToCheck.length} files...\n`);

      // Check for hardcoded secrets
      const secretIssues = await this.checkForSecrets(filesToCheck);
      issues.push(...secretIssues);

      // Check for missing permission validations
      const permissionIssues = await this.checkPermissions(filesToCheck);
      issues.push(...permissionIssues);

      // Check for SQL injection risks
      const sqlIssues = await this.checkSQLInjection(filesToCheck);
      issues.push(...sqlIssues);

      // Check for console.log statements
      const consoleIssues = await this.checkConsoleStatements(filesToCheck);
      issues.push(...consoleIssues);

      console.log(`✓ Security check complete\n`);
      console.log(`Found ${issues.length} potential security issues\n`);

      return {
        success: issues.filter(i => i.severity === 'error').length === 0,
        data: issues
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async getStagedFiles(): Promise<string[]> {
    // Simple implementation - in production use git command
    return [];
  }

  private async checkForSecrets(files: string[]): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];
    const secretPatterns = [
      { pattern: /api[_-]?key\s*=\s*['"][^'"]+['"]/gi, name: 'API Key' },
      { pattern: /password\s*=\s*['"][^'"]+['"]/gi, name: 'Password' },
      { pattern: /secret\s*=\s*['"][^'"]+['"]/gi, name: 'Secret' },
      { pattern: /token\s*=\s*['"][^'"]+['"]/gi, name: 'Token' },
      { pattern: /Bearer\s+[A-Za-z0-9\-._~+/]+=*/g, name: 'Bearer Token' }
    ];

    for (const file of files) {
      try {
        const content = await FileUtils.readFile(file);
        const relativePath = FileUtils.getRelativePath(file);

        // Skip .env files - they're expected to have secrets
        if (relativePath.includes('.env')) {
          continue;
        }

        const lines = content.split('\n');

        secretPatterns.forEach(({ pattern, name }) => {
          lines.forEach((line, index) => {
            if (pattern.test(line)) {
              issues.push({
                severity: 'error',
                riskLevel: 'critical',
                category: 'exposure',
                message: `Potential hardcoded ${name} detected`,
                location: { path: relativePath, line: index + 1 },
                suggestion: `Move ${name} to environment variables`,
                code: line.trim()
              });
            }
          });
        });
      } catch (error) {
        // File might not exist or be readable
      }
    }

    return issues;
  }

  private async checkPermissions(files: string[]): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];

    for (const file of files) {
      if (!file.includes('api/') || !file.includes('route.ts')) {
        continue;
      }

      try {
        const content = await FileUtils.readFile(file);
        const relativePath = FileUtils.getRelativePath(file);

        // Check if it's a protected endpoint
        const hasExport = content.includes('export const');

        if (hasExport && !content.includes('withAuth') && !content.includes('withPermission')) {
          // Check if it's a public endpoint
          const isPublic = ['auth/register', 'auth/login', 'auth/verify', 'health'].some(
            p => relativePath.includes(p)
          );

          if (!isPublic) {
            issues.push({
              severity: 'warning',
              riskLevel: 'high',
              category: 'auth',
              message: 'API route missing authentication wrapper',
              location: { path: relativePath },
              suggestion: 'Add withAuth() or withPermission() wrapper'
            });
          }
        }
      } catch (error) {
        // File might not exist
      }
    }

    return issues;
  }

  private async checkSQLInjection(files: string[]): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];

    for (const file of files) {
      try {
        const content = await FileUtils.readFile(file);
        const relativePath = FileUtils.getRelativePath(file);

        // Check for raw SQL queries (we use Prisma, so this is rare)
        const rawSQLPatterns = [
          /\$queryRaw/g,
          /\$executeRaw/g,
          /`SELECT .* FROM/gi,
          /`INSERT INTO/gi
        ];

        const lines = content.split('\n');

        rawSQLPatterns.forEach(pattern => {
          lines.forEach((line, index) => {
            if (pattern.test(line) && !line.includes('prisma.')) {
              issues.push({
                severity: 'warning',
                riskLevel: 'high',
                category: 'injection',
                message: 'Potential SQL injection risk with raw query',
                location: { path: relativePath, line: index + 1 },
                suggestion: 'Use Prisma ORM methods instead of raw SQL',
                code: line.trim()
              });
            }
          });
        });
      } catch (error) {
        // File might not exist
      }
    }

    return issues;
  }

  private async checkConsoleStatements(files: string[]): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];

    for (const file of files) {
      // Skip test files and scripts
      if (file.includes('.test.') || file.includes('scripts/')) {
        continue;
      }

      try {
        const content = await FileUtils.readFile(file);
        const relativePath = FileUtils.getRelativePath(file);
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          if (line.includes('console.log') && !line.trim().startsWith('//')) {
            issues.push({
              severity: 'info',
              riskLevel: 'low',
              category: 'other',
              message: 'console.log statement found',
              location: { path: relativePath, line: index + 1 },
              suggestion: 'Remove console.log or use proper logger',
              code: line.trim()
            });
          }
        });
      } catch (error) {
        // File might not exist
      }
    }

    return issues;
  }
}

export async function run(args?: string): Promise<void> {
  const checker = new PreCommitChecker();
  const result = await checker.check();

  if (result.success !== undefined && result.data) {
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('  PRE-COMMIT SECURITY CHECK');
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (result.data.length === 0) {
      console.log('✅ No security issues found!\n');
    } else {
      console.log(`Found ${result.data.length} issues:\n`);

      const critical = result.data.filter(i => i.riskLevel === 'critical');
      const high = result.data.filter(i => i.riskLevel === 'high');
      const medium = result.data.filter(i => i.riskLevel === 'medium');
      const low = result.data.filter(i => i.riskLevel === 'low');

      if (critical.length > 0) {
        console.log(`🚨 Critical: ${critical.length}`);
        critical.forEach(issue => {
          console.log(`  ${issue.location.path}:${issue.location.line || ''}`);
          console.log(`  ${issue.message}`);
          if (issue.code) console.log(`  Code: ${issue.code}`);
          console.log();
        });
      }

      if (high.length > 0) {
        console.log(`⚠️  High: ${high.length}`);
        high.forEach(issue => {
          console.log(`  ${issue.location.path}:${issue.location.line || ''} - ${issue.message}`);
        });
        console.log();
      }

      if (medium.length > 0) {
        console.log(`📋 Medium: ${medium.length}`);
      }

      if (low.length > 0) {
        console.log(`ℹ️  Low: ${low.length}`);
      }
    }

    console.log('\n═══════════════════════════════════════════════════════════════\n');

    if (!result.success) {
      console.error('❌ Pre-commit check failed! Fix critical issues before committing.\n');
      process.exit(1);
    }
  } else {
    console.error('❌ Check failed:', result.error);
    process.exit(1);
  }
}
