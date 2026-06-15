/**
 * Common types used across all skills
 */
export interface SkillResult<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    warnings?: string[];
    suggestions?: string[];
}
export interface FileLocation {
    path: string;
    line?: number;
    column?: number;
}
export interface CodeIssue {
    severity: 'error' | 'warning' | 'info';
    message: string;
    location: FileLocation;
    suggestion?: string;
    code?: string;
}
export interface SecurityIssue extends CodeIssue {
    riskLevel: 'critical' | 'high' | 'medium' | 'low';
    category: 'permission' | 'auth' | 'injection' | 'exposure' | 'other';
}
export interface AuditReport {
    timestamp: Date;
    skillName: string;
    totalIssues: number;
    issuesBySeverity: {
        critical?: number;
        high?: number;
        medium?: number;
        low?: number;
        error?: number;
        warning?: number;
        info?: number;
    };
    issues: CodeIssue[] | SecurityIssue[];
    summary: string;
    recommendations: string[];
}
//# sourceMappingURL=common.d.ts.map