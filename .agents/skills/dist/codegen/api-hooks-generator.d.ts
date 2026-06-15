/**
 * API Hooks Generator Skill
 * Generate React hooks for API data fetching and mutations
 */
import { SkillResult } from '../types/common.js';
export declare class APIHooksGenerator {
    generate(resourceName: string): Promise<SkillResult<string>>;
    private generateHooks;
}
export declare function run(args?: string): Promise<void>;
//# sourceMappingURL=api-hooks-generator.d.ts.map