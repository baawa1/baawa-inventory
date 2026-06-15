/**
 * Main index file for all skills
 * Export all skills for programmatic use
 */

// Security Skills
export { PermissionAuditor } from './security/permission-auditor.js';
export { UserFlowValidator } from './security/user-flow-validator.js';
export { AuditLogMonitor } from './security/audit-log-monitor.js';
export { RateLimitConfigurator } from './security/rate-limit-configurator.js';

// Database Skills
export { SafeMigrationAssistant } from './database/safe-migration-assistant.js';
export { TestDataGenerator } from './database/test-data-generator.js';
export { SchemaValidator } from './database/schema-validator.js';

// Code Generation Skills
export { CRUDGenerator } from './codegen/crud-generator.js';
export { FormGenerator } from './codegen/form-generator.js';
export { APIHooksGenerator } from './codegen/api-hooks-generator.js';

// Testing Skills
export { TestScaffolder } from './testing/test-scaffolder.js';
export { MockFactory } from './testing/mock-factory.js';

// Workflow Skills
export { PreCommitChecker } from './workflow/pre-commit-checker.js';
export { CodeReviewer } from './workflow/code-reviewer.js';
export { DependencyAuditor } from './workflow/dependency-auditor.js';

// Types
export type {
  SkillResult,
  FileLocation,
  CodeIssue,
  SecurityIssue,
  AuditReport
} from './types/common.js';
