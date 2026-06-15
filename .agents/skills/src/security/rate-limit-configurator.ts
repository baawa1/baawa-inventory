/**
 * Rate Limit Configurator Skill
 * Intelligently configure and validate rate limits for endpoints
 */

import { FileUtils } from '../utils/file-utils.js';
import { SkillResult } from '../types/common.js';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  message?: string;
}

interface EndpointRateLimit {
  path: string;
  suggested: RateLimitConfig;
  current?: RateLimitConfig;
  hasRateLimit: boolean;
}

export class RateLimitConfigurator {
  private projectRoot: string;

  constructor() {
    this.projectRoot = FileUtils.getProjectRoot();
  }

  async configure(): Promise<SkillResult<EndpointRateLimit[]>> {
    try {
      console.log('🔍 Analyzing endpoints for rate limiting...\n');

      const apiFiles = await FileUtils.findFiles('src/app/api/**/route.ts');
      const endpoints: EndpointRateLimit[] = [];

      for (const file of apiFiles) {
        const relativePath = FileUtils.getRelativePath(file);
        const content = await FileUtils.readFile(file);

        const endpoint: EndpointRateLimit = {
          path: relativePath,
          suggested: this.suggestRateLimit(relativePath, content),
          hasRateLimit: content.includes('rateLimit') || content.includes('RateLimit')
        };

        endpoints.push(endpoint);
      }

      console.log(`✓ Analyzed ${endpoints.length} endpoints\n`);
      console.log(`📊 ${endpoints.filter(e => !e.hasRateLimit).length} endpoints missing rate limits\n`);

      return {
        success: true,
        data: endpoints,
        suggestions: this.generateSuggestions(endpoints)
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private suggestRateLimit(path: string, content: string): RateLimitConfig {
    // Auth endpoints: strictest limits
    if (path.includes('auth/login') || path.includes('auth/register')) {
      return { maxRequests: 5, windowMs: 3600000, message: 'Too many attempts' };
    }

    if (path.includes('auth/forgot-password') || path.includes('auth/reset-password')) {
      return { maxRequests: 3, windowMs: 3600000, message: 'Too many password reset attempts' };
    }

    // Financial operations: strict limits
    if (path.includes('finance') || path.includes('transaction') || path.includes('payment')) {
      return { maxRequests: 100, windowMs: 3600000 };
    }

    // Write operations: moderate limits
    if (content.includes('export const POST') || content.includes('export const PUT') ||
        content.includes('export const DELETE')) {
      return { maxRequests: 200, windowMs: 3600000 };
    }

    // Read operations: generous limits
    return { maxRequests: 1000, windowMs: 3600000 };
  }

  private generateSuggestions(endpoints: EndpointRateLimit[]): string[] {
    const suggestions: string[] = [];
    const missing = endpoints.filter(e => !e.hasRateLimit);

    if (missing.length > 0) {
      suggestions.push(`Add rate limiting to ${missing.length} endpoints`);
      suggestions.push('Use existing RateLimit utility from src/lib/rate-limiting.ts');
      suggestions.push('Apply strictest limits to auth endpoints (3-5 requests/hour)');
      suggestions.push('Apply moderate limits to financial operations (100 requests/hour)');
    }

    return suggestions;
  }
}

export async function run(): Promise<void> {
  const configurator = new RateLimitConfigurator();
  const result = await configurator.configure();

  if (result.success && result.data) {
    console.log('\n📋 Rate Limit Configuration Report\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const missing = result.data.filter(e => !e.hasRateLimit);

    if (missing.length > 0) {
      console.log(`⚠️  Found ${missing.length} endpoints without rate limiting:\n`);
      missing.forEach(ep => {
        console.log(`  ${ep.path}`);
        console.log(`    Suggested: ${ep.suggested.maxRequests} requests per ${ep.suggested.windowMs / 3600000} hour(s)\n`);
      });
    } else {
      console.log('✅ All endpoints have rate limiting configured!\n');
    }

    if (result.suggestions && result.suggestions.length > 0) {
      console.log('\n💡 Recommendations:\n');
      result.suggestions.forEach(s => console.log(`  ${s}`));
    }

    console.log('\n═══════════════════════════════════════════════════════════════\n');
  } else {
    console.error('❌ Configuration failed:', result.error);
    process.exit(1);
  }
}
