/**
 * User Flow Validator Skill
 * Ensures proper user status transitions (PENDING → VERIFIED → APPROVED)
 */

import { FileUtils } from '../utils/file-utils.js';
import { AuditReport, SecurityIssue, SkillResult } from '../types/common.js';

interface UserStatus {
  name: string;
  nextStatus?: string;
  requiredActions: string[];
}

interface FlowValidation {
  status: string;
  hasRedirect: boolean;
  redirectPath?: string;
  issues: SecurityIssue[];
}

export class UserFlowValidator {
  private projectRoot: string;
  private statuses: Map<string, UserStatus> = new Map([
    ['PENDING', { name: 'PENDING', nextStatus: 'VERIFIED', requiredActions: ['email verification'] }],
    ['VERIFIED', { name: 'VERIFIED', nextStatus: 'APPROVED', requiredActions: ['admin approval'] }],
    ['APPROVED', { name: 'APPROVED', requiredActions: [] }],
    ['REJECTED', { name: 'REJECTED', requiredActions: [] }],
    ['SUSPENDED', { name: 'SUSPENDED', requiredActions: [] }]
  ]);

  constructor() {
    this.projectRoot = FileUtils.getProjectRoot();
  }

  /**
   * Main validation function
   */
  async validate(): Promise<SkillResult<AuditReport>> {
    try {
      console.log('🔍 Starting user flow validation...\n');

      // Step 1: Validate middleware redirects
      const middlewareIssues = await this.validateMiddleware();
      console.log(`✓ Validated middleware redirects\n`);

      // Step 2: Check API routes for status validation
      const apiIssues = await this.validateApiRoutes();
      console.log(`✓ Validated API route status checks\n`);

      // Step 3: Validate email verification flow
      const emailIssues = await this.validateEmailVerificationFlow();
      console.log(`✓ Validated email verification flow\n`);

      // Step 4: Validate admin approval flow
      const approvalIssues = await this.validateAdminApprovalFlow();
      console.log(`✓ Validated admin approval flow\n`);

      // Step 5: Check for status bypass vulnerabilities
      const bypassIssues = await this.checkForStatusBypass();
      console.log(`✓ Checked for status bypass vulnerabilities\n`);

      const allIssues = [
        ...middlewareIssues,
        ...apiIssues,
        ...emailIssues,
        ...approvalIssues,
        ...bypassIssues
      ];

      const report = this.generateReport(allIssues);

      return {
        success: true,
        data: report
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during validation'
      };
    }
  }

  /**
   * Validate middleware.ts for proper status-based redirects
   */
  private async validateMiddleware(): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];
    const middlewarePath = `${this.projectRoot}/src/middleware.ts`;

    if (!await FileUtils.fileExists(middlewarePath)) {
      issues.push({
        severity: 'error',
        riskLevel: 'critical',
        category: 'auth',
        message: 'middleware.ts not found - no user flow protection',
        location: { path: 'src/middleware.ts' },
        suggestion: 'Create middleware.ts to handle user status redirects'
      });
      return issues;
    }

    const content = await FileUtils.readFile(middlewarePath);
    const lines = content.split('\n');

    // Check for status enum import
    if (!content.includes('UserStatus')) {
      issues.push({
        severity: 'warning',
        riskLevel: 'medium',
        category: 'auth',
        message: 'UserStatus enum not imported in middleware',
        location: { path: 'src/middleware.ts' },
        suggestion: 'Import UserStatus enum for type-safe status checking'
      });
    }

    // Check for each status redirect
    const requiredRedirects = [
      { status: 'PENDING', path: '/verify-email', description: 'pending users to verify email' },
      { status: 'VERIFIED', path: '/pending-approval', description: 'verified users awaiting approval' },
      { status: 'REJECTED', path: '/account-rejected', description: 'rejected users' },
      { status: 'SUSPENDED', path: '/account-suspended', description: 'suspended users' }
    ];

    for (const redirect of requiredRedirects) {
      const hasStatusCheck = content.includes(redirect.status);
      const hasRedirectPath = content.includes(redirect.path);

      if (!hasStatusCheck || !hasRedirectPath) {
        issues.push({
          severity: 'error',
          riskLevel: 'high',
          category: 'auth',
          message: `Missing redirect for ${redirect.status} users`,
          location: { path: 'src/middleware.ts' },
          suggestion: `Add redirect to ${redirect.path} for ${redirect.description}`
        });
      }
    }

    // Check for infinite redirect loop prevention
    if (!content.includes('safeRedirect') && !content.match(/redirect.*loop/i)) {
      issues.push({
        severity: 'warning',
        riskLevel: 'low',
        category: 'auth',
        message: 'No obvious infinite redirect loop prevention',
        location: { path: 'src/middleware.ts' },
        suggestion: 'Implement safeRedirect function to prevent redirect loops'
      });
    }

    return issues;
  }

  /**
   * Validate API routes for status checks
   */
  private async validateApiRoutes(): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];
    const apiFiles = await FileUtils.findFiles('src/app/api/**/route.ts');

    // Routes that must check user status
    const statusSensitivePatterns = [
      'user',
      'profile',
      'finance',
      'transaction',
      'admin'
    ];

    for (const file of apiFiles) {
      const relativePath = FileUtils.getRelativePath(file);

      // Skip public routes
      if (this.isPublicRoute(relativePath)) {
        continue;
      }

      const isSensitive = statusSensitivePatterns.some(p => relativePath.includes(p));

      if (isSensitive) {
        const content = await FileUtils.readFile(file);

        // Check if route validates user status
        const hasStatusCheck = content.includes('user.status') ||
                              content.includes('status === ') ||
                              content.includes('UserStatus');

        if (!hasStatusCheck && content.includes('withAuth')) {
          issues.push({
            severity: 'warning',
            riskLevel: 'medium',
            category: 'auth',
            message: 'Sensitive route missing user status validation',
            location: { path: relativePath },
            suggestion: 'Verify user.status === "APPROVED" before processing'
          });
        }
      }
    }

    return issues;
  }

  /**
   * Validate email verification flow
   */
  private async validateEmailVerificationFlow(): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];

    // Check verify-email route
    const verifyPath = `${this.projectRoot}/src/app/api/auth/verify-email/route.ts`;

    if (!await FileUtils.fileExists(verifyPath)) {
      issues.push({
        severity: 'error',
        riskLevel: 'critical',
        category: 'auth',
        message: 'Email verification route not found',
        location: { path: 'src/app/api/auth/verify-email/route.ts' },
        suggestion: 'Create email verification route to handle PENDING → VERIFIED transition'
      });
    } else {
      const content = await FileUtils.readFile(verifyPath);

      // Check for token validation
      if (!content.includes('token') && !content.includes('verificationToken')) {
        issues.push({
          severity: 'error',
          riskLevel: 'high',
          category: 'auth',
          message: 'Email verification missing token validation',
          location: { path: 'src/app/api/auth/verify-email/route.ts' },
          suggestion: 'Validate verification token before updating status'
        });
      }

      // Check for status transition
      if (!content.includes('VERIFIED') && !content.includes('status')) {
        issues.push({
          severity: 'error',
          riskLevel: 'high',
          category: 'auth',
          message: 'Email verification missing status update to VERIFIED',
          location: { path: 'src/app/api/auth/verify-email/route.ts' },
          suggestion: 'Update user.status to VERIFIED after successful verification'
        });
      }

      // Check for token expiry validation
      if (!content.includes('expir') && !content.includes('Expir')) {
        issues.push({
          severity: 'warning',
          riskLevel: 'medium',
          category: 'auth',
          message: 'Email verification may not check token expiry',
          location: { path: 'src/app/api/auth/verify-email/route.ts' },
          suggestion: 'Validate verificationTokenExpiry before accepting token'
        });
      }
    }

    return issues;
  }

  /**
   * Validate admin approval flow
   */
  private async validateAdminApprovalFlow(): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];

    // Look for user approval routes
    const userApprovalFiles = await FileUtils.findFiles('src/app/api/**/approve*/**/*.ts');
    const userManagementFiles = await FileUtils.findFiles('src/app/api/users/**/route.ts');

    if (userApprovalFiles.length === 0 && userManagementFiles.length === 0) {
      issues.push({
        severity: 'warning',
        riskLevel: 'medium',
        category: 'auth',
        message: 'No obvious admin approval route found',
        location: { path: 'src/app/api/' },
        suggestion: 'Ensure there is a route for admins to approve VERIFIED users'
      });
    } else {
      // Check user management routes for approval logic
      for (const file of [...userApprovalFiles, ...userManagementFiles]) {
        const content = await FileUtils.readFile(file);
        const relativePath = FileUtils.getRelativePath(file);

        // Check if route updates status to APPROVED
        if (content.includes('status') && !content.includes('APPROVED')) {
          issues.push({
            severity: 'warning',
            riskLevel: 'low',
            category: 'auth',
            message: 'User management route may not handle APPROVED status',
            location: { path: relativePath },
            suggestion: 'Ensure admins can approve users by setting status to APPROVED'
          });
        }

        // Check for admin permission
        if (!content.includes('ADMIN') && !content.includes('withAdminPermission')) {
          issues.push({
            severity: 'error',
            riskLevel: 'high',
            category: 'permission',
            message: 'User approval route may not require ADMIN permission',
            location: { path: relativePath },
            suggestion: 'Restrict approval operations to ADMIN role only'
          });
        }
      }
    }

    return issues;
  }

  /**
   * Check for status bypass vulnerabilities
   */
  private async checkForStatusBypass(): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];
    const apiFiles = await FileUtils.findFiles('src/app/api/**/route.ts');

    for (const file of apiFiles) {
      const content = await FileUtils.readFile(file);
      const relativePath = FileUtils.getRelativePath(file);
      const lines = content.split('\n');

      // Check for direct status updates without validation
      lines.forEach((line, index) => {
        if (line.includes('status:') && (line.includes('APPROVED') || line.includes('VERIFIED'))) {
          // Check if it's in a create/update operation
          if (content.slice(Math.max(0, index - 5), index + 5).includes('create') ||
              content.slice(Math.max(0, index - 5), index + 5).includes('update')) {

            // Make sure it's admin-protected
            const sectionContent = content.slice(Math.max(0, index - 20), index + 5);
            if (!sectionContent.includes('ADMIN') && !relativePath.includes('admin')) {
              issues.push({
                severity: 'error',
                riskLevel: 'critical',
                category: 'auth',
                message: 'Potential status bypass - direct status update without admin check',
                location: { path: relativePath, line: index + 1 },
                suggestion: 'Ensure only ADMIN can set status to VERIFIED or APPROVED',
                code: line.trim()
              });
            }
          }
        }
      });
    }

    return issues;
  }

  /**
   * Check if route is public
   */
  private isPublicRoute(path: string): boolean {
    const publicPaths = [
      'auth/register',
      'auth/login',
      'auth/verify-email',
      'auth/forgot-password',
      'auth/reset-password'
    ];

    return publicPaths.some(p => path.includes(p));
  }

  /**
   * Generate validation report
   */
  private generateReport(issues: SecurityIssue[]): AuditReport {
    const issuesBySeverity = {
      critical: issues.filter(i => i.riskLevel === 'critical').length,
      high: issues.filter(i => i.riskLevel === 'high').length,
      medium: issues.filter(i => i.riskLevel === 'medium').length,
      low: issues.filter(i => i.riskLevel === 'low').length
    };

    const summary = `Validated user flow transitions (PENDING → VERIFIED → APPROVED). Found ${issues.length} potential issues with the flow.`;

    const recommendations = [
      '✓ Ensure middleware redirects all status types correctly',
      '✓ Validate email tokens with expiry checking',
      '✓ Restrict approval operations to ADMIN role only',
      '✓ Prevent direct status updates in non-admin routes',
      '✓ Implement redirect loop prevention'
    ];

    if (issuesBySeverity.critical > 0) {
      recommendations.unshift('🚨 CRITICAL: Fix status bypass vulnerabilities immediately');
    }

    return {
      timestamp: new Date(),
      skillName: 'User Flow Validator',
      totalIssues: issues.length,
      issuesBySeverity,
      issues,
      summary,
      recommendations
    };
  }

  /**
   * Format report for console output
   */
  static formatReport(report: AuditReport): string {
    let output = '\n';
    output += '═══════════════════════════════════════════════════════════════\n';
    output += '  USER FLOW VALIDATION REPORT\n';
    output += '═══════════════════════════════════════════════════════════════\n\n';

    output += `Generated: ${report.timestamp.toLocaleString()}\n\n`;

    output += '📊 SUMMARY\n';
    output += '─────────────────────────────────────────────────────────────\n';
    output += `${report.summary}\n\n`;

    output += '📈 ISSUES BY RISK LEVEL\n';
    output += '─────────────────────────────────────────────────────────────\n';
    output += `  Critical: ${report.issuesBySeverity.critical || 0}\n`;
    output += `  High:     ${report.issuesBySeverity.high || 0}\n`;
    output += `  Medium:   ${report.issuesBySeverity.medium || 0}\n`;
    output += `  Low:      ${report.issuesBySeverity.low || 0}\n\n`;

    if (report.issues.length > 0) {
      output += '🔍 ISSUES FOUND\n';
      output += '─────────────────────────────────────────────────────────────\n';

      const securityIssues = report.issues as SecurityIssue[];
      securityIssues.forEach((issue, index) => {
        const icon = issue.riskLevel === 'critical' ? '🚨' :
                     issue.riskLevel === 'high' ? '⚠️ ' :
                     issue.riskLevel === 'medium' ? '📋' : 'ℹ️ ';

        output += `\n${index + 1}. ${icon} [${issue.riskLevel.toUpperCase()}] ${issue.message}\n`;
        output += `   Location: ${issue.location.path}`;
        if (issue.location.line) {
          output += `:${issue.location.line}`;
        }
        output += '\n';

        if (issue.code) {
          output += `   Code: ${issue.code}\n`;
        }

        if (issue.suggestion) {
          output += `   💡 Suggestion: ${issue.suggestion}\n`;
        }
      });
      output += '\n';
    } else {
      output += '✅ No issues found! User flow is properly configured.\n\n';
    }

    output += '💡 RECOMMENDATIONS\n';
    output += '─────────────────────────────────────────────────────────────\n';
    report.recommendations.forEach(rec => {
      output += `  ${rec}\n`;
    });

    output += '\n═══════════════════════════════════════════════════════════════\n';

    return output;
  }
}

/**
 * Main export function for skill execution
 */
export async function run(): Promise<void> {
  const validator = new UserFlowValidator();
  const result = await validator.validate();

  if (result.success && result.data) {
    console.log(UserFlowValidator.formatReport(result.data));

    const critical = result.data.issuesBySeverity.critical || 0;
    const high = result.data.issuesBySeverity.high || 0;

    if (critical > 0 || high > 0) {
      process.exit(1);
    }
  } else {
    console.error('❌ Validation failed:', result.error);
    process.exit(1);
  }
}
