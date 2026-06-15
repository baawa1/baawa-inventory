/**
 * Schema Validator Skill
 * Validate Prisma schema against best practices
 */
import { FileUtils } from '../utils/file-utils.js';
export class SchemaValidator {
    projectRoot;
    constructor() {
        this.projectRoot = FileUtils.getProjectRoot();
    }
    async validate() {
        try {
            console.log('🔍 Validating Prisma schema...\n');
            const schemaPath = `${this.projectRoot}/prisma/schema.prisma`;
            if (!await FileUtils.fileExists(schemaPath)) {
                return {
                    success: false,
                    error: 'schema.prisma not found'
                };
            }
            const content = await FileUtils.readFile(schemaPath);
            const issues = [];
            // Check for missing indexes on foreign keys
            const foreignKeys = this.extractForeignKeys(content);
            foreignKeys.forEach(fk => {
                if (!this.hasIndex(content, fk.field)) {
                    issues.push({
                        severity: 'warning',
                        message: `Foreign key ${fk.field} in model ${fk.model} may need an index for performance`,
                        location: { path: 'prisma/schema.prisma' },
                        suggestion: `Add @@index([${fk.field}]) to improve query performance`
                    });
                }
            });
            // Check for Decimal type on money fields
            const moneyFields = this.extractMoneyFields(content);
            moneyFields.forEach(field => {
                if (!field.type.includes('Decimal')) {
                    issues.push({
                        severity: 'error',
                        message: `Money field ${field.name} should use Decimal type, not ${field.type}`,
                        location: { path: 'prisma/schema.prisma' },
                        suggestion: `Change ${field.name} to Decimal type for accurate financial calculations`
                    });
                }
            });
            // Check for proper relation delete behavior
            const relations = this.extractRelations(content);
            relations.forEach(rel => {
                if (!rel.onDelete && !rel.optional) {
                    issues.push({
                        severity: 'info',
                        message: `Relation ${rel.name} missing onDelete behavior`,
                        location: { path: 'prisma/schema.prisma' },
                        suggestion: 'Consider adding onDelete: Cascade or onDelete: SetNull'
                    });
                }
            });
            console.log(`✓ Found ${issues.length} schema issues\n`);
            return {
                success: true,
                data: issues
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    extractForeignKeys(content) {
        const fks = [];
        const modelRegex = /model\s+(\w+)\s*{([^}]+)}/g;
        let match;
        while ((match = modelRegex.exec(content)) !== null) {
            const [, modelName, modelBody] = match;
            const fkRegex = /(\w+)\s+\w+\s+@relation/g;
            let fkMatch;
            while ((fkMatch = fkRegex.exec(modelBody)) !== null) {
                fks.push({ model: modelName, field: fkMatch[1] });
            }
        }
        return fks;
    }
    extractMoneyFields(content) {
        const fields = [];
        const moneyKeywords = ['price', 'cost', 'amount', 'total', 'revenue', 'profit', 'discount'];
        const fieldRegex = /(\w+)\s+(Int|Float|Decimal|BigInt)/g;
        let match;
        while ((match = fieldRegex.exec(content)) !== null) {
            const [, fieldName, fieldType] = match;
            if (moneyKeywords.some(kw => fieldName.toLowerCase().includes(kw))) {
                fields.push({ name: fieldName, type: fieldType });
            }
        }
        return fields;
    }
    extractRelations(content) {
        const relations = [];
        const relationRegex = /(\w+)\s+\w+(\?)?.*@relation.*?(?:onDelete:\s*(\w+))?/g;
        let match;
        while ((match = relationRegex.exec(content)) !== null) {
            const [, name, optional, onDelete] = match;
            relations.push({
                name,
                onDelete,
                optional: optional === '?'
            });
        }
        return relations;
    }
    hasIndex(content, fieldName) {
        const indexRegex = new RegExp(`@@index\\(\\[${fieldName}\\]\\)`, 'g');
        return indexRegex.test(content);
    }
}
export async function run() {
    const validator = new SchemaValidator();
    const result = await validator.validate();
    if (result.success && result.data) {
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('  SCHEMA VALIDATION REPORT');
        console.log('═══════════════════════════════════════════════════════════════\n');
        if (result.data.length === 0) {
            console.log('✅ No schema issues found!\n');
        }
        else {
            console.log(`Found ${result.data.length} issues:\n`);
            result.data.forEach((issue, i) => {
                const icon = issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️ ' : 'ℹ️ ';
                console.log(`${i + 1}. ${icon} [${issue.severity.toUpperCase()}] ${issue.message}`);
                if (issue.suggestion) {
                    console.log(`   💡 ${issue.suggestion}`);
                }
                console.log();
            });
        }
        console.log('═══════════════════════════════════════════════════════════════\n');
        const errors = result.data.filter(i => i.severity === 'error').length;
        if (errors > 0) {
            process.exit(1);
        }
    }
    else {
        console.error('❌ Validation failed:', result.error);
        process.exit(1);
    }
}
//# sourceMappingURL=schema-validator.js.map