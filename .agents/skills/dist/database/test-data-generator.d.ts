/**
 * Test Data Generator Skill
 * Generate realistic test data for development and testing
 */
import { SkillResult } from '../types/common.js';
interface TestDataOptions {
    users?: number;
    products?: number;
    categories?: number;
    brands?: number;
    suppliers?: number;
    sales?: number;
}
export declare class TestDataGenerator {
    generate(options?: TestDataOptions): Promise<SkillResult<string>>;
    private generateScript;
}
export declare function run(args?: string): Promise<void>;
export {};
//# sourceMappingURL=test-data-generator.d.ts.map