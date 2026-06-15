/**
 * Safe Migration Assistant Skill
 * Prevents destructive database operations and guides safe migrations
 */
import { SkillResult } from '../types/common.js';
interface MigrationCheck {
    isSafe: boolean;
    warnings: string[];
    suggestions: string[];
    breakingChanges: string[];
}
export declare class SafeMigrationAssistant {
    private projectRoot;
    constructor();
    /**
     * Check if migration command is safe
     */
    checkMigration(command: string): Promise<SkillResult<MigrationCheck>>;
    /**
     * Detect potentially breaking schema changes
     */
    private detectSchemaChanges;
    /**
     * Suggest safe alternative
     */
    suggestAlternative(command: string): string;
}
export declare function run(args?: string): Promise<void>;
export {};
//# sourceMappingURL=safe-migration-assistant.d.ts.map