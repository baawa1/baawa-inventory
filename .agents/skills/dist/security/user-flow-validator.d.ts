/**
 * User Flow Validator Skill
 * Ensures proper user status transitions (PENDING → VERIFIED → APPROVED)
 */
import { AuditReport, SkillResult } from '../types/common.js';
export declare class UserFlowValidator {
    private projectRoot;
    private statuses;
    constructor();
    /**
     * Main validation function
     */
    validate(): Promise<SkillResult<AuditReport>>;
    /**
     * Validate middleware.ts for proper status-based redirects
     */
    private validateMiddleware;
    /**
     * Validate API routes for status checks
     */
    private validateApiRoutes;
    /**
     * Validate email verification flow
     */
    private validateEmailVerificationFlow;
    /**
     * Validate admin approval flow
     */
    private validateAdminApprovalFlow;
    /**
     * Check for status bypass vulnerabilities
     */
    private checkForStatusBypass;
    /**
     * Check if route is public
     */
    private isPublicRoute;
    /**
     * Generate validation report
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
//# sourceMappingURL=user-flow-validator.d.ts.map