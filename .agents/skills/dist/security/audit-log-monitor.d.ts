/**
 * Audit Log Monitor Skill
 * Verifies comprehensive audit logging for sensitive operations
 */
import { AuditReport, SkillResult } from '../types/common.js';
export declare class AuditLogMonitor {
    private projectRoot;
    private auditableOperations;
    constructor();
    /**
     * Main monitoring function
     */
    monitor(): Promise<SkillResult<AuditReport>>;
    /**
     * Validate that AuditLogger utility exists
     */
    private validateAuditLogger;
    /**
     * Check API routes for audit logging
     */
    private checkApiRoutes;
    /**
     * Validate event types are properly defined
     */
    private validateEventTypes;
    /**
     * Validate metadata capture in audit logs
     */
    private validateMetadataCapture;
    /**
     * Get sensitive operations for a route
     */
    private getSensitiveOperations;
    /**
     * Extract audit event types used in content
     */
    private extractAuditEventTypes;
    /**
     * Generate monitoring report
     */
    private generateReport;
    /**
     * Format report for console output
     */
    static formatReport(report: AuditReport): string;
}
/**
 * Main export function for skill execution
 */
export declare function run(): Promise<void>;
//# sourceMappingURL=audit-log-monitor.d.ts.map