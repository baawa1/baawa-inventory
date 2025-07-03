"use client";

import { useSessionManagement as useNewSessionManagement } from "./api/session-migration";

// Re-export the new TanStack Query-based session management hook
// This maintains backward compatibility while using the new implementation
export { useSessionManagement } from "./api/session-migration";

// Export additional new hooks for enhanced functionality
export { useEnhancedSession, useSessionQuery } from "./api/session";

export {
  useSessionState,
  useSessionActions,
  useSessionValidationState,
} from "./api/session-migration";

// Migration utilities
export {
  MIGRATION_GUIDE,
  logSessionMigrationStatus,
} from "./api/session-migration";
