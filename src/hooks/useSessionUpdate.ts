"use client";

import { useSession } from "next-auth/react";
import { useCallback } from "react";

export function useSessionUpdate() {
  const { data: session, update } = useSession();

  const updateSession = useCallback(async () => {
    try {
      await update();
      return true;
    } catch (error) {
      console.error("Error updating session:", error);
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
        console.error("Error updating session with data:", error);
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
