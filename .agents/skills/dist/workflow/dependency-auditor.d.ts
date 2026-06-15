/**
 * Dependency Auditor Skill
 * Security audit for npm dependencies with context-aware recommendations
 */
import { SkillResult } from '../types/common.js';
interface Vulnerability {
    name: string;
    severity: 'critical' | 'high' | 'moderate' | 'low';
    via: string[];
    fixAvailable: boolean;
}
interface AuditResult {
    vulnerabilities: Vulnerability[];
    totalVulnerabilities: number;
    metadata: {
        critical: number;
        high: number;
        moderate: number;
        low: number;
    };
}
export declare class DependencyAuditor {
    private projectRoot;
    constructor();
    audit(): Promise<SkillResult<AuditResult>>;
    private parseVulnerabilities;
    private generateSuggestions;
}
export declare function run(args?: string): Promise<void>;
export {};
//# sourceMappingURL=dependency-auditor.d.ts.map