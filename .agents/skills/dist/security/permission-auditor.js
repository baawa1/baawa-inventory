/**
 * Permission Auditor Skill
 * Validates permission checks across API routes and components
 */
import { FileUtils } from '../utils/file-utils.js';
export class PermissionAuditor {
    projectRoot;
    permissions = new Map();
    constructor() {
        this.projectRoot = FileUtils.getProjectRoot();
    }
    /**
     * Main audit function
     */
    async audit() {
        try {
            console.log('🔍 Starting permission audit...\n');
            // Step 1: Load permission definitions
            await this.loadPermissionDefinitions();
            console.log(`✓ Loaded ${this.permissions.size} permission definitions\n`);
            // Step 2: Analyze API routes
            const routes = await this.analyzeApiRoutes();
            console.log(`✓ Analyzed ${routes.length} API routes\n`);
            // Step 3: Analyze middleware
            const middlewareIssues = await this.analyzeMiddleware();
            console.log(`✓ Analyzed middleware patterns\n`);
            // Step 4: Check for hardcoded role logic
            const hardcodedIssues = await this.findHardcodedRoleLogic();
            console.log(`✓ Checked for hardcoded role logic\n`);
            // Step 5: Generate report
            const allIssues = [
                ...routes.flatMap(r => r.issues),
                ...middlewareIssues,
                ...hardcodedIssues
            ];
            const report = this.generateReport(allIssues, routes);
            return {
                success: true,
                data: report,
                warnings: report.issuesBySeverity.warning ? [`Found ${report.issuesBySeverity.warning} warnings`] : []
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error during audit'
            };
        }
    }
    /**
     * Load permission definitions from auth-rbac.ts
     */
    async loadPermissionDefinitions() {
        const rbacPath = `${this.projectRoot}/src/lib/auth-rbac.ts`;
        if (!await FileUtils.fileExists(rbacPath)) {
            throw new Error('auth-rbac.ts not found');
        }
        const content = await FileUtils.readFile(rbacPath);
        // Extract permission constants (simplified parsing)
        const permissionPattern = /'([A-Z_]+)':\s*\[([^\]]+)\]/g;
        let match;
        while ((match = permissionPattern.exec(content)) !== null) {
            const [, permission, rolesStr] = match;
            const roles = rolesStr.split(',').map(r => r.trim().replace(/['"]/g, ''));
            this.permissions.set(permission, { name: permission, roles });
        }
    }
    /**
     * Analyze all API routes for permission checks
     */
    async analyzeApiRoutes() {
        const apiFiles = await FileUtils.findFiles('src/app/api/**/route.ts');
        const analyses = [];
        for (const file of apiFiles) {
            const content = await FileUtils.readFile(file);
            const relativePath = FileUtils.getRelativePath(file);
            const analysis = {
                path: relativePath,
                hasAuth: false,
                hasPermissionCheck: false,
                permissions: [],
                issues: []
            };
            // Check for authentication wrapper
            if (content.includes('withAuth') || content.includes('AuthenticatedRequest')) {
                analysis.hasAuth = true;
            }
            // Check for permission checks
            if (content.includes('withPermission') || content.includes('hasPermission')) {
                analysis.hasPermissionCheck = true;
                // Extract permission names
                const permMatches = content.match(/'([A-Z_]+)'/g);
                if (permMatches) {
                    analysis.permissions = permMatches.map(m => m.replace(/'/g, ''));
                }
            }
            // Identify issues
            if (!analysis.hasAuth) {
                // Check if it's intentionally public
                const isPublicRoute = this.isPublicRoute(relativePath);
                if (!isPublicRoute) {
                    analysis.issues.push({
                        severity: 'error',
                        riskLevel: 'high',
                        category: 'auth',
                        message: 'Missing authentication wrapper (withAuth)',
                        location: { path: relativePath, line: 1 },
                        suggestion: 'Wrap route handlers with withAuth() middleware'
                    });
                }
            }
            // Check for sensitive routes without permission checks
            if (analysis.hasAuth && !analysis.hasPermissionCheck) {
                const isSensitiveRoute = this.isSensitiveRoute(relativePath, content);
                if (isSensitiveRoute) {
                    analysis.issues.push({
                        severity: 'warning',
                        riskLevel: 'medium',
                        category: 'permission',
                        message: 'Sensitive route without explicit permission check',
                        location: { path: relativePath, line: 1 },
                        suggestion: 'Add withPermission() or hasPermission() check'
                    });
                }
            }
            // Validate permission names
            for (const perm of analysis.permissions) {
                if (!this.permissions.has(perm)) {
                    analysis.issues.push({
                        severity: 'error',
                        riskLevel: 'high',
                        category: 'permission',
                        message: `Unknown permission: ${perm}`,
                        location: { path: relativePath },
                        suggestion: 'Check permission name against auth-rbac.ts definitions'
                    });
                }
            }
            analyses.push(analysis);
        }
        return analyses;
    }
    /**
     * Analyze middleware.ts for proper auth flow
     */
    async analyzeMiddleware() {
        const issues = [];
        const middlewarePath = `${this.projectRoot}/src/middleware.ts`;
        if (!await FileUtils.fileExists(middlewarePath)) {
            issues.push({
                severity: 'error',
                riskLevel: 'critical',
                category: 'auth',
                message: 'middleware.ts not found',
                location: { path: 'src/middleware.ts' },
                suggestion: 'Create middleware.ts to handle route protection'
            });
            return issues;
        }
        const content = await FileUtils.readFile(middlewarePath);
        // Check for proper status validation
        if (!content.includes('UserStatus') && !content.includes('status')) {
            issues.push({
                severity: 'warning',
                riskLevel: 'medium',
                category: 'auth',
                message: 'Middleware may not validate user status (PENDING/VERIFIED/APPROVED)',
                location: { path: 'src/middleware.ts' },
                suggestion: 'Ensure middleware checks user status for proper flow'
            });
        }
        // Check for session validation
        if (!content.includes('session') && !content.includes('getServerSession')) {
            issues.push({
                severity: 'error',
                riskLevel: 'high',
                category: 'auth',
                message: 'Middleware missing session validation',
                location: { path: 'src/middleware.ts' },
                suggestion: 'Add session validation using NextAuth'
            });
        }
        return issues;
    }
    /**
     * Find hardcoded role checks instead of using RBAC
     */
    async findHardcodedRoleLogic() {
        const issues = [];
        const apiFiles = await FileUtils.findFiles('src/app/api/**/route.ts');
        for (const file of apiFiles) {
            const content = await FileUtils.readFile(file);
            const lines = content.split('\n');
            const relativePath = FileUtils.getRelativePath(file);
            // Look for hardcoded role checks
            const hardcodedPatterns = [
                /user\.role\s*===\s*['"]ADMIN['"]/,
                /role\s*===\s*['"]MANAGER['"]/,
                /user\.role\s*===\s*['"]STAFF['"]/
            ];
            lines.forEach((line, index) => {
                if (hardcodedPatterns.some(pattern => pattern.test(line))) {
                    // Check if it's already using hasPermission
                    if (!line.includes('hasPermission') && !line.includes('hasRole')) {
                        issues.push({
                            severity: 'warning',
                            riskLevel: 'low',
                            category: 'permission',
                            message: 'Hardcoded role check detected',
                            location: { path: relativePath, line: index + 1 },
                            suggestion: 'Use hasPermission() or hasRole() from auth-rbac.ts',
                            code: line.trim()
                        });
                    }
                }
            });
        }
        return issues;
    }
    /**
     * Check if route is intentionally public
     */
    isPublicRoute(path) {
        const publicPaths = [
            'api/auth/register',
            'api/auth/login',
            'api/auth/verify-email',
            'api/auth/forgot-password',
            'api/auth/reset-password',
            'api/health'
        ];
        return publicPaths.some(p => path.includes(p));
    }
    /**
     * Check if route handles sensitive operations
     */
    isSensitiveRoute(path, content) {
        const sensitiveKeywords = ['finance', 'transaction', 'payment', 'user', 'approval', 'role'];
        const hasDelete = content.includes('DELETE');
        const hasSensitiveKeyword = sensitiveKeywords.some(k => path.toLowerCase().includes(k));
        return hasDelete || hasSensitiveKeyword;
    }
    /**
     * Generate audit report
     */
    generateReport(issues, routes) {
        const issuesBySeverity = {
            critical: issues.filter(i => i.riskLevel === 'critical').length,
            high: issues.filter(i => i.riskLevel === 'high').length,
            medium: issues.filter(i => i.riskLevel === 'medium').length,
            low: issues.filter(i => i.riskLevel === 'low').length,
            error: issues.filter(i => i.severity === 'error').length,
            warning: issues.filter(i => i.severity === 'warning').length,
            info: issues.filter(i => i.severity === 'info').length
        };
        const routesWithAuth = routes.filter(r => r.hasAuth).length;
        const routesWithPermissions = routes.filter(r => r.hasPermissionCheck).length;
        const summary = `Audited ${routes.length} API routes. ${routesWithAuth} have authentication, ${routesWithPermissions} have explicit permission checks. Found ${issues.length} total issues.`;
        const recommendations = [];
        if (issuesBySeverity.critical > 0) {
            recommendations.push('🚨 CRITICAL: Address critical security issues immediately');
        }
        if (issuesBySeverity.high > 0) {
            recommendations.push('⚠️  HIGH: Review and fix high-risk issues as soon as possible');
        }
        if (issuesBySeverity.medium > 0) {
            recommendations.push('📋 MEDIUM: Plan to address medium-risk issues in next sprint');
        }
        recommendations.push('✓ Use withPermission() wrapper for all sensitive routes');
        recommendations.push('✓ Prefer hasPermission() over hardcoded role checks');
        recommendations.push('✓ Keep permission definitions centralized in auth-rbac.ts');
        return {
            timestamp: new Date(),
            skillName: 'Permission Auditor',
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
    static formatReport(report) {
        let output = '\n';
        output += '═══════════════════════════════════════════════════════════════\n';
        output += '  PERMISSION AUDIT REPORT\n';
        output += '═══════════════════════════════════════════════════════════════\n\n';
        output += `Generated: ${report.timestamp.toLocaleString()}\n\n`;
        output += '📊 SUMMARY\n';
        output += '─────────────────────────────────────────────────────────────\n';
        output += `${report.summary}\n\n`;
        output += '📈 ISSUES BY SEVERITY\n';
        output += '─────────────────────────────────────────────────────────────\n';
        output += `  Critical: ${report.issuesBySeverity.critical || 0}\n`;
        output += `  High:     ${report.issuesBySeverity.high || 0}\n`;
        output += `  Medium:   ${report.issuesBySeverity.medium || 0}\n`;
        output += `  Low:      ${report.issuesBySeverity.low || 0}\n\n`;
        if (report.issues.length > 0) {
            output += '🔍 ISSUES FOUND\n';
            output += '─────────────────────────────────────────────────────────────\n';
            const securityIssues = report.issues;
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
        }
        else {
            output += '✅ No issues found! Your permission system is properly configured.\n\n';
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
export async function run() {
    const auditor = new PermissionAuditor();
    const result = await auditor.audit();
    if (result.success && result.data) {
        console.log(PermissionAuditor.formatReport(result.data));
        // Exit with error code if critical or high issues found
        const critical = result.data.issuesBySeverity.critical || 0;
        const high = result.data.issuesBySeverity.high || 0;
        if (critical > 0 || high > 0) {
            process.exit(1);
        }
    }
    else {
        console.error('❌ Audit failed:', result.error);
        process.exit(1);
    }
}
//# sourceMappingURL=permission-auditor.js.map