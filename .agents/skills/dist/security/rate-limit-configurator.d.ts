/**
 * Rate Limit Configurator Skill
 * Intelligently configure and validate rate limits for endpoints
 */
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
export declare class RateLimitConfigurator {
    private projectRoot;
    constructor();
    configure(): Promise<SkillResult<EndpointRateLimit[]>>;
    private suggestRateLimit;
    private generateSuggestions;
}
export declare function run(): Promise<void>;
export {};
//# sourceMappingURL=rate-limit-configurator.d.ts.map