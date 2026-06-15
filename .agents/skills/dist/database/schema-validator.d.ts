/**
 * Schema Validator Skill
 * Validate Prisma schema against best practices
 */
import { CodeIssue, SkillResult } from '../types/common.js';
export declare class SchemaValidator {
    private projectRoot;
    constructor();
    validate(): Promise<SkillResult<CodeIssue[]>>;
    private extractForeignKeys;
    private extractMoneyFields;
    private extractRelations;
    private hasIndex;
}
export declare function run(): Promise<void>;
//# sourceMappingURL=schema-validator.d.ts.map