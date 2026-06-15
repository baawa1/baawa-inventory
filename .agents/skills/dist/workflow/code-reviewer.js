/**
 * Code Review Assistant Skill
 * Automated code review focusing on patterns and best practices
 */
import { FileUtils } from '../utils/file-utils.js';
export class CodeReviewer {
    projectRoot;
    constructor() {
        this.projectRoot = FileUtils.getProjectRoot();
    }
    async review(files) {
        try {
            console.log('🔍 Running code review...\n');
            const issues = [];
            const filesToReview = files || await this.getChangedFiles();
            if (filesToReview.length === 0) {
                return {
                    success: true,
                    data: [],
                    warnings: ['No files to review']
                };
            }
            console.log(`Reviewing ${filesToReview.length} files...\n`);
            for (const file of filesToReview) {
                const fileIssues = await this.reviewFile(file);
                issues.push(...fileIssues);
            }
            console.log(`✓ Review complete\n`);
            console.log(`Found ${issues.length} suggestions\n`);
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
    async getChangedFiles() {
        // In production, get from git diff
        return [];
    }
    async reviewFile(file) {
        const issues = [];
        try {
            const content = await FileUtils.readFile(file);
            const relativePath = FileUtils.getRelativePath(file);
            const lines = content.split('\n');
            // Check for any type usage
            lines.forEach((line, index) => {
                if (line.includes(': any') || line.includes('<any>')) {
                    issues.push({
                        severity: 'warning',
                        message: 'Avoid using "any" type',
                        location: { path: relativePath, line: index + 1 },
                        suggestion: 'Use specific type or "unknown" instead',
                        code: line.trim()
                    });
                }
            });
            // Check for proper error handling
            if (content.includes('try {') && !content.includes('catch')) {
                issues.push({
                    severity: 'error',
                    message: 'Try block without catch',
                    location: { path: relativePath },
                    suggestion: 'Add catch block for proper error handling'
                });
            }
            // Check for TODO comments
            lines.forEach((line, index) => {
                if (line.includes('// TODO') || line.includes('// FIXME')) {
                    issues.push({
                        severity: 'info',
                        message: 'TODO/FIXME comment found',
                        location: { path: relativePath, line: index + 1 },
                        suggestion: 'Consider addressing before merging',
                        code: line.trim()
                    });
                }
            });
            // Check naming conventions
            const functionMatches = content.matchAll(/function\s+([a-z][a-zA-Z0-9]*)\s*\(/g);
            for (const match of functionMatches) {
                const functionName = match[1];
                if (functionName[0] === functionName[0].toUpperCase()) {
                    issues.push({
                        severity: 'warning',
                        message: `Function name should start with lowercase: ${functionName}`,
                        location: { path: relativePath },
                        suggestion: 'Use camelCase for function names'
                    });
                }
            }
            // Check for long functions (>100 lines)
            const functionStarts = [];
            lines.forEach((line, index) => {
                if (line.includes('function ') || line.match(/const\s+\w+\s*=.*=>/)) {
                    functionStarts.push(index);
                }
            });
            functionStarts.forEach((start, i) => {
                const end = functionStarts[i + 1] || lines.length;
                const functionLength = end - start;
                if (functionLength > 100) {
                    issues.push({
                        severity: 'info',
                        message: 'Function is too long (>100 lines)',
                        location: { path: relativePath, line: start + 1 },
                        suggestion: 'Consider breaking down into smaller functions'
                    });
                }
            });
            // Check for missing JSDoc on exported functions (TypeScript/React files)
            if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                const exportFunctions = content.matchAll(/export\s+(function|const)\s+(\w+)/g);
                for (const match of exportFunctions) {
                    const functionName = match[2];
                    const index = content.indexOf(match[0]);
                    const lineNumber = content.substring(0, index).split('\n').length;
                    // Check if there's a JSDoc comment before it
                    const prevLines = lines.slice(Math.max(0, lineNumber - 3), lineNumber);
                    const hasJSDoc = prevLines.some(l => l.includes('/**') || l.includes('*/'));
                    if (!hasJSDoc && !functionName.startsWith('use')) {
                        issues.push({
                            severity: 'info',
                            message: `Exported function "${functionName}" missing JSDoc comment`,
                            location: { path: relativePath, line: lineNumber },
                            suggestion: 'Add JSDoc comment to document exported functions'
                        });
                    }
                }
            }
        }
        catch (error) {
            // File might not be readable
        }
        return issues;
    }
}
export async function run(args) {
    const reviewer = new CodeReviewer();
    const result = await reviewer.review();
    if (result.success && result.data) {
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('  CODE REVIEW REPORT');
        console.log('═══════════════════════════════════════════════════════════════\n');
        if (result.data.length === 0) {
            console.log('✅ No issues found! Code looks good.\n');
        }
        else {
            const errors = result.data.filter(i => i.severity === 'error');
            const warnings = result.data.filter(i => i.severity === 'warning');
            const info = result.data.filter(i => i.severity === 'info');
            console.log(`Total issues: ${result.data.length}`);
            console.log(`  Errors: ${errors.length}`);
            console.log(`  Warnings: ${warnings.length}`);
            console.log(`  Info: ${info.length}\n`);
            if (errors.length > 0) {
                console.log('❌ Errors:\n');
                errors.forEach(issue => {
                    console.log(`  ${issue.location.path}:${issue.location.line || ''}`);
                    console.log(`  ${issue.message}`);
                    if (issue.suggestion)
                        console.log(`  💡 ${issue.suggestion}`);
                    console.log();
                });
            }
            if (warnings.length > 0) {
                console.log('⚠️  Warnings:\n');
                warnings.slice(0, 5).forEach(issue => {
                    console.log(`  ${issue.location.path}:${issue.location.line || ''} - ${issue.message}`);
                });
                if (warnings.length > 5) {
                    console.log(`  ... and ${warnings.length - 5} more warnings`);
                }
                console.log();
            }
        }
        console.log('═══════════════════════════════════════════════════════════════\n');
        const errors = result.data.filter(i => i.severity === 'error').length;
        if (errors > 0) {
            process.exit(1);
        }
    }
    else {
        console.error('❌ Review failed:', result.error);
        process.exit(1);
    }
}
//# sourceMappingURL=code-reviewer.js.map