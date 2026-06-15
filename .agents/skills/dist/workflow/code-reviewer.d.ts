/**
 * Code Review Assistant Skill
 * Automated code review focusing on patterns and best practices
 */
import { CodeIssue, SkillResult } from '../types/common.js';
export declare class CodeReviewer {
    private projectRoot;
    constructor();
    review(files?: string[]): Promise<SkillResult<CodeIssue[]>>;
    private getChangedFiles;
    private reviewFile;
}
export declare function run(args?: string): Promise<void>;
//# sourceMappingURL=code-reviewer.d.ts.map