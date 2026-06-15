/**
 * Test Scaffolder Skill
 * Generate test files for components, API routes, and utilities
 */
import { SkillResult } from '../types/common.js';
type TestType = 'unit' | 'integration' | 'component' | 'e2e';
interface ScaffoldOptions {
    name: string;
    type: TestType;
    filePath: string;
}
export declare class TestScaffolder {
    scaffold(options: ScaffoldOptions): Promise<SkillResult<string>>;
    private generateTest;
    private generateUnitTest;
    private generateIntegrationTest;
    private generateComponentTest;
    private generateE2ETest;
}
export declare function run(args?: string): Promise<void>;
export {};
//# sourceMappingURL=test-scaffolder.d.ts.map