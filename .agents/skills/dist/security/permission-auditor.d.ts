/**
 * Permission Auditor Skill
 * Validates permission checks across API routes and components
 */
import { AuditReport, SkillResult } from '../types/common.js';
export declare class PermissionAuditor {
    private projectRoot;
    private permissions;
    constructor();
    /**
     * Main audit function
     */
    audit(): Promise<SkillResult<AuditReport>>;
    /**
     * Load permission definitions from auth-rbac.ts
     */
    private loadPermissionDefinitions;
    /**
     * Analyze all API routes for permission checks
     */
    private analyzeApiRoutes;
    /**
     * Analyze middleware.ts for proper auth flow
     */
    private analyzeMiddleware;
    /**
     * Find hardcoded role checks instead of using RBAC
     */
    private findHardcodedRoleLogic;
    /**
     * Check if route is intentionally public
     */
    private isPublicRoute;
    /**
     * Check if route handles sensitive operations
     */
    private isSensitiveRoute;
    /**
     * Generate audit report
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
//# sourceMappingURL=permission-auditor.d.ts.map