"use client";

import { useSession } from "next-auth/react";
import { useCallback } from "react";
import { logger } from "@/lib/logger";

export function useSessionUpdate() {
  const { data: session, update } = useSession();

  const updateSession = useCallback(async () => {
    try {
      await update();
      return true;
    } catch (error) {
      logger.error("Error updating session", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return false;
    }
  }, [update]);

  const updateSessionWithData = useCallback(
    async (userData: any) => {
      try {
        await update({
          ...session,
          user: {
            ...session?.user,
            ...userData,
          },
        });
        return true;
      } catch (error) {
        logger.error("Error updating session with data", {
          error: error instanceof Error ? error.message : "Unknown error",
        });
        return false;
      }
    },
    [update, session]
  );

  return {
    session,
    updateSession,
    updateSessionWithData,
  };
}
