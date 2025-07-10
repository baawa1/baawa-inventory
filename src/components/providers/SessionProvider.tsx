"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

interface SessionProviderProps {
  children: React.ReactNode;
}

/**
 * SessionProvider wrapper for Auth.js v5
 * Uses official NextAuth SessionProvider with proper configuration
 */
export function SessionProvider({ children }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider
      // In Auth.js v5, basePath is automatically handled
      refetchInterval={0}
      refetchOnWindowFocus={false}
    >
      {children}
    </NextAuthSessionProvider>
  );
}
