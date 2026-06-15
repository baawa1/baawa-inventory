/**
 * Audit Log Monitor Skill
 * Verifies comprehensive audit logging for sensitive operations
 */
import { FileUtils } from '../utils/file-utils.js';
export class AuditLogMonitor {
    projectRoot;
    auditableOperations = [
        {
            category: 'Financial',
            operations: ['transaction', 'payment', 'finance', 'revenue', 'cost'],
            requiredEventTypes: ['FINANCE_TRANSACTION', 'PAYMENT_PROCESSED']
        },
        {
            category: 'User Management',
            operations: ['user/approve', 'user/reject', 'user/role', 'user/suspend'],
            requiredEventTypes: ['ADMIN_USER_APPROVED', 'ADMIN_USER_REJECTED', 'ROLE_CHANGED']
        },
        {
            category: 'Authentication',
            operations: ['login', 'register', 'password-reset'],
            requiredEventTypes: ['LOGIN_SUCCESS', 'LOGIN_FAILED', 'PASSWORD_RESET']
        },
        {
            category: 'Data Modification',
            operations: ['delete', 'bulk-update', 'bulk-delete'],
            requiredEventTypes: ['DATA_DELETED', 'BULK_OPERATION']
        }
    ];
    constructor() {
        this.projectRoot = FileUtils.getProjectRoot();
    }
    /**
     * Main monitoring function
     */
    async monitor() {
        try {
            console.log('🔍 Starting audit log monitoring...\n');
            // Step 1: Check if AuditLogger exists
            const loggerExists = await this.validateAuditLogger();
            if (!loggerExists) {
                return {
                    success: false,
                    error: 'AuditLogger utility not found. Cannot proceed with monitoring.'
                };
            }
            console.log(`✓ AuditLogger utility found\n`);
            // Step 2: Check all API routes for audit logging
            const routeIssues = await this.checkApiRoutes();
            console.log(`✓ Checked API routes for audit logging\n`);
            // Step 3: Validate audit log event types
            const eventTypeIssues = await this.validateEventTypes();
            console.log(`✓ Validated audit log event types\n`);
            // Step 4: Check for metadata capture
            const metadataIssues = await this.validateMetadataCapture();
            console.log(`✓ Validated metadata capture\n`);
            const allIssues = [...routeIssues, ...eventTypeIssues, ...metadataIssues];
            const report = this.generateReport(allIssues);
            return {
                success: true,
                data: report
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error during monitoring'
            };
        }
    }
    /**
     * Validate that AuditLogger utility exists
     */
    async validateAuditLogger() {
        const loggerPath = `${this.projectRoot}/src/lib/utils/audit-logger.ts`;
        return FileUtils.fileExists(loggerPath);
    }
    /**
     * Check API routes for audit logging
     */
    async checkApiRoutes() {
        const issues = [];
        const apiFiles = await FileUtils.findFiles('src/app/api/**/route.ts');
        for (const file of apiFiles) {
            const relativePath = FileUtils.getRelativePath(file);
            const content = await FileUtils.readFile(file);
            // Check if route handles sensitive operations
            const sensitiveOps = this.getSensitiveOperations(relativePath, content);
            if (sensitiveOps.length > 0) {
                const hasAuditLogging = content.includes('AuditLogger') ||
                    content.includes('auditLog') ||
                    content.includes('logAudit');
                if (!hasAuditLogging) {
                    issues.push({
                        severity: 'error',
                        riskLevel: sensitiveOps.some(op => op.category === 'Financial') ? 'critical' : 'high',
                        category: 'other',
                        message: `Sensitive operation missing audit logging: ${sensitiveOps.map(o => o.category).join(', ')}`,
                        location: { path: relativePath },
                        suggestion: 'Import AuditLogger and log all sensitive operations with appropriate event types'
                    });
                }
                else {
                    // Check if it's logging the right events
                    const usedEventTypes = this.extractAuditEventTypes(content);
                    const requiredEventTypes = sensitiveOps.flatMap(op => op.requiredEventTypes);
                    const missingEvents = requiredEventTypes.filter(et => !usedEventTypes.some(used => used.includes(et)));
                    if (missingEvents.length > 0) {
                        issues.push({
                            severity: 'warning',
                            riskLevel: 'medium',
                            category: 'other',
                            message: `Route may be missing specific audit event types: ${missingEvents.join(', ')}`,
                            location: { path: relativePath },
                            suggestion: `Use appropriate audit event types for this operation`
                        });
                    }
                }
            }
        }
        return issues;
    }
    /**
     * Validate event types are properly defined
     */
    async validateEventTypes() {
        const issues = [];
        const loggerPath = `${this.projectRoot}/src/lib/utils/audit-logger.ts`;
        if (!await FileUtils.fileExists(loggerPath)) {
            return issues;
        }
        const content = await FileUtils.readFile(loggerPath);
        // Check for comprehensive event type enum/constants
        const requiredEventTypes = [
            'LOGIN_SUCCESS',
            'LOGIN_FAILED',
            'REGISTRATION',
            'PASSWORD_RESET_REQUEST',
            'PASSWORD_RESET_SUCCESS',
            'ADMIN_USER_APPROVED',
            'ADMIN_USER_REJECTED',
            'ROLE_CHANGED',
            'USER_STATUS_CHANGED'
        ];
        for (const eventType of requiredEventTypes) {
            if (!content.includes(eventType)) {
                issues.push({
                    severity: 'warning',
                    riskLevel: 'low',
                    category: 'other',
                    message: `AuditLogger may not support event type: ${eventType}`,
                    location: { path: 'src/lib/utils/audit-logger.ts' },
                    suggestion: `Add ${eventType} to AuditEventType enum or constants`
                });
            }
        }
        return issues;
    }
    /**
     * Validate metadata capture in audit logs
     */
    async validateMetadataCapture() {
        const issues = [];
        const loggerPath = `${this.projectRoot}/src/lib/utils/audit-logger.ts`;
        if (!await FileUtils.fileExists(loggerPath)) {
            return issues;
        }
        const content = await FileUtils.readFile(loggerPath);
        // Check for essential metadata fields
        const requiredMetadata = [
            { field: 'ipAddress', pattern: /ip.*address|clientIp/i },
            { field: 'userAgent', pattern: /user.*agent/i },
            { field: 'timestamp', pattern: /timestamp|createdAt/i },
            { field: 'userId', pattern: /userId|user.*id/i }
        ];
        for (const meta of requiredMetadata) {
            if (!meta.pattern.test(content)) {
                issues.push({
                    severity: 'warning',
                    riskLevel: 'medium',
                    category: 'other',
                    message: `AuditLogger may not capture ${meta.field}`,
                    location: { path: 'src/lib/utils/audit-logger.ts' },
                    suggestion: `Ensure audit logs include ${meta.field} for complete audit trail`
                });
            }
        }
        // Check for IP address extraction logic
        if (!content.includes('x-forwarded-for') && !content.includes('X-Forwarded-For')) {
            issues.push({
                severity: 'info',
                riskLevel: 'low',
                category: 'other',
                message: 'IP address may not handle proxy headers',
                location: { path: 'src/lib/utils/audit-logger.ts' },
                suggestion: 'Extract IP from x-forwarded-for header for accurate tracking behind proxies'
            });
        }
        return issues;
    }
    /**
     * Get sensitive operations for a route
     */
    getSensitiveOperations(path, content) {
        const operations = [];
        for (const op of this.auditableOperations) {
            if (op.operations.some(keyword => path.toLowerCase().includes(keyword) ||
                content.toLowerCase().includes(keyword))) {
                operations.push(op);
            }
        }
        return operations;
    }
    /**
     * Extract audit event types used in content
     */
    extractAuditEventTypes(content) {
        const eventTypePattern = /AuditLogger\.log\w*\(['"](\w+)['"]/g;
        const matches = [];
        let match;
        while ((match = eventTypePattern.exec(content)) !== null) {
            matches.push(match[1]);
        }
        return matches;
    }
    /**
     * Generate monitoring report
     */
    generateReport(issues) {
        const issuesBySeverity = {
            critical: issues.filter(i => i.riskLevel === 'critical').length,
            high: issues.filter(i => i.riskLevel === 'high').length,
            medium: issues.filter(i => i.riskLevel === 'medium').length,
            low: issues.filter(i => i.riskLevel === 'low').length
        };
        const criticalOps = issues.filter(i => i.riskLevel === 'critical' || i.riskLevel === 'high');
        const summary = `Monitored audit logging across API routes. Found ${issues.length} potential issues, including ${criticalOps.length} critical/high-risk operations without proper logging.`;
        const recommendations = [
            '✓ Import AuditLogger in all sensitive route handlers',
            '✓ Log financial operations with FINANCE_* event types',
            '✓ Log user management actions with ADMIN_* event types',
            '✓ Capture IP address, user agent, and timestamp in all logs',
            '✓ Use appropriate event types for each operation category',
            '✓ Store audit logs in persistent database (not just console)'
        ];
        if (issuesBySeverity.critical > 0) {
            recommendations.unshift('🚨 CRITICAL: Add audit logging to financial operations immediately');
        }
        return {
            timestamp: new Date(),
            skillName: 'Audit Log Monitor',
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
        output += '  AUDIT LOG MONITORING REPORT\n';
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
                if (issue.suggestion) {
                    output += `   💡 Suggestion: ${issue.suggestion}\n`;
                }
            });
            output += '\n';
        }
        else {
            output += '✅ No issues found! Audit logging is comprehensive.\n\n';
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
    const monitor = new AuditLogMonitor();
    const result = await monitor.monitor();
    if (result.success && result.data) {
        console.log(AuditLogMonitor.formatReport(result.data));
        const critical = result.data.issuesBySeverity.critical || 0;
        const high = result.data.issuesBySeverity.high || 0;
        if (critical > 0 || high > 0) {
            process.exit(1);
        }
    }
    else {
        console.error('❌ Monitoring failed:', result.error);
        process.exit(1);
    }
}
//# sourceMappingURL=audit-log-monitor.js.map