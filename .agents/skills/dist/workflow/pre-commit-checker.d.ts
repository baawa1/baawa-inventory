/**
 * Pre-commit Security Checker Skill
 * Run security checks before committing code
 */
import { SecurityIssue, SkillResult } from '../types/common.js';
export declare class PreCommitChecker {
    private projectRoot;
    constructor();
    check(files?: string[]): Promise<SkillResult<SecurityIssue[]>>;
    private getStagedFiles;
    private checkForSecrets;
    private checkPermissions;
    private checkSQLInjection;
    private checkConsoleStatements;
}
export declare function run(args?: string): Promise<void>;
//# sourceMappingURL=pre-commit-checker.d.ts.map