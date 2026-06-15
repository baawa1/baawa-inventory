/**
 * CRUD API Generator Skill
 * Generate complete CRUD API endpoints with validation and auth
 */
import { SkillResult } from '../types/common.js';
interface CRUDOptions {
    modelName: string;
    tableName: string;
    fields: string[];
    permissions?: string[];
}
export declare class CRUDGenerator {
    generate(options: CRUDOptions): Promise<SkillResult<{
        route: string;
        validation: string;
        test: string;
    }>>;
    private generateRouteFile;
    private generateValidationSchema;
    private generateTestFile;
}
export declare function run(args?: string): Promise<void>;
export {};
//# sourceMappingURL=crud-generator.d.ts.map