/**
 * Dependency Auditor Skill
 * Security audit for npm dependencies with context-aware recommendations
 */
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);
export class DependencyAuditor {
    projectRoot;
    constructor() {
        this.projectRoot = process.cwd();
    }
    async audit() {
        try {
            console.log('🔍 Auditing npm dependencies...\n');
            const { stdout, stderr } = await execAsync('npm audit --json', {
                cwd: this.projectRoot,
                maxBuffer: 1024 * 1024 * 10
            });
            let auditData;
            try {
                auditData = JSON.parse(stdout);
            }
            catch {
                // npm audit might return non-JSON when there are no vulnerabilities
                return {
                    success: true,
                    data: {
                        vulnerabilities: [],
                        totalVulnerabilities: 0,
                        metadata: { critical: 0, high: 0, moderate: 0, low: 0 }
                    }
                };
            }
            const vulnerabilities = this.parseVulnerabilities(auditData);
            const metadata = auditData.metadata?.vulnerabilities || { critical: 0, high: 0, moderate: 0, low: 0 };
            console.log(`✓ Audit complete\n`);
            console.log(`Found ${vulnerabilities.length} vulnerabilities\n`);
            return {
                success: true,
                data: {
                    vulnerabilities,
                    totalVulnerabilities: vulnerabilities.length,
                    metadata
                },
                suggestions: this.generateSuggestions(vulnerabilities, metadata)
            };
        }
        catch (error) {
            // npm audit returns non-zero exit code when vulnerabilities exist
            // Try to parse the error output
            if (error instanceof Error && 'stdout' in error) {
                try {
                    const auditData = JSON.parse(error.stdout);
                    const vulnerabilities = this.parseVulnerabilities(auditData);
                    const metadata = auditData.metadata?.vulnerabilities || { critical: 0, high: 0, moderate: 0, low: 0 };
                    return {
                        success: metadata.critical === 0 && metadata.high === 0,
                        data: {
                            vulnerabilities,
                            totalVulnerabilities: vulnerabilities.length,
                            metadata
                        },
                        warnings: [`Found ${metadata.critical + metadata.high} critical/high vulnerabilities`],
                        suggestions: this.generateSuggestions(vulnerabilities, metadata)
                    };
                }
                catch {
                    // Fallthrough to error return
                }
            }
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error during audit'
            };
        }
    }
    parseVulnerabilities(auditData) {
        const vulnerabilities = [];
        if (auditData.vulnerabilities) {
            for (const [name, data] of Object.entries(auditData.vulnerabilities)) {
                const vulnData = data;
                vulnerabilities.push({
                    name,
                    severity: vulnData.severity,
                    via: vulnData.via || [],
                    fixAvailable: vulnData.fixAvailable || false
                });
            }
        }
        return vulnerabilities;
    }
    generateSuggestions(vulnerabilities, metadata) {
        const suggestions = [];
        if (metadata.critical > 0) {
            suggestions.push('🚨 CRITICAL: Update dependencies with critical vulnerabilities immediately');
        }
        if (metadata.high > 0) {
            suggestions.push('⚠️  HIGH: Review and update dependencies with high vulnerabilities');
        }
        const fixable = vulnerabilities.filter(v => v.fixAvailable).length;
        if (fixable > 0) {
            suggestions.push(`Run "npm audit fix" to automatically fix ${fixable} vulnerabilities`);
        }
        const unfixable = vulnerabilities.filter(v => !v.fixAvailable).length;
        if (unfixable > 0) {
            suggestions.push(`${unfixable} vulnerabilities require manual review`);
        }
        if (vulnerabilities.length === 0) {
            suggestions.push('✓ All dependencies are up to date and secure');
        }
        suggestions.push('Keep dependencies updated regularly');
        suggestions.push('Review changelogs before updating major versions');
        return suggestions;
    }
}
export async function run(args) {
    const auditor = new DependencyAuditor();
    const result = await auditor.audit();
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('  DEPENDENCY AUDIT REPORT');
    console.log('═══════════════════════════════════════════════════════════════\n');
    if (result.data) {
        const { metadata, vulnerabilities, totalVulnerabilities } = result.data;
        console.log('📊 Summary:\n');
        console.log(`  Total vulnerabilities: ${totalVulnerabilities}`);
        console.log(`  Critical: ${metadata.critical}`);
        console.log(`  High:     ${metadata.high}`);
        console.log(`  Moderate: ${metadata.moderate}`);
        console.log(`  Low:      ${metadata.low}\n`);
        if (vulnerabilities.length > 0) {
            const critical = vulnerabilities.filter(v => v.severity === 'critical');
            const high = vulnerabilities.filter(v => v.severity === 'high');
            if (critical.length > 0) {
                console.log('🚨 Critical Vulnerabilities:\n');
                critical.forEach(v => {
                    console.log(`  ${v.name}`);
                    console.log(`    Fix available: ${v.fixAvailable ? 'Yes' : 'No'}\n`);
                });
            }
            if (high.length > 0) {
                console.log('⚠️  High Vulnerabilities:\n');
                high.forEach(v => {
                    console.log(`  ${v.name} (Fix available: ${v.fixAvailable ? 'Yes' : 'No'})`);
                });
                console.log();
            }
        }
        else {
            console.log('✅ No vulnerabilities found!\n');
        }
        if (result.suggestions && result.suggestions.length > 0) {
            console.log('💡 Recommendations:\n');
            result.suggestions.forEach(s => console.log(`  ${s}`));
            console.log();
        }
    }
    else {
        console.log('❌ Audit failed:', result.error);
    }
    console.log('═══════════════════════════════════════════════════════════════\n');
    if (result.data && (result.data.metadata.critical > 0 || result.data.metadata.high > 0)) {
        process.exit(1);
    }
}
//# sourceMappingURL=dependency-auditor.js.map