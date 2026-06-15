/**
 * Mock Data Factory Skill
 * Generate realistic mock data for testing
 */
import { SkillResult } from '../types/common.js';
export declare class MockFactory {
    generate(modelName: string, count?: number): Promise<SkillResult<string>>;
    private generateMocks;
    private getMockTemplate;
}
export declare function run(args?: string): Promise<void>;
//# sourceMappingURL=mock-factory.d.ts.map