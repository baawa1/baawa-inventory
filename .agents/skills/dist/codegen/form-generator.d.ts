/**
 * Form Component Generator Skill
 * Generate React Hook Form components with shadcn/ui
 */
import { SkillResult } from '../types/common.js';
interface FormField {
    name: string;
    type: 'text' | 'email' | 'number' | 'select' | 'textarea';
    label: string;
    required: boolean;
    options?: string[];
}
interface FormOptions {
    componentName: string;
    fields: FormField[];
}
export declare class FormGenerator {
    generate(options: FormOptions): Promise<SkillResult<string>>;
    private generateComponent;
}
export declare function run(args?: string): Promise<void>;
export {};
//# sourceMappingURL=form-generator.d.ts.map