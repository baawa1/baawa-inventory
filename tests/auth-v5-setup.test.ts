import { describe, it, expect } from "@jest/globals";

// Test that the auth.ts file exports the correct functions
describe("Auth.js v5 Setup", () => {
  it("should have auth.ts file with correct exports", async () => {
    // Dynamic import to test the actual exports
    const authModule = await import("../auth");

    expect(authModule.auth).toBeDefined();
    expect(typeof authModule.auth).toBe("function");

    expect(authModule.handlers).toBeDefined();
    expect(authModule.handlers.GET).toBeDefined();
    expect(authModule.handlers.POST).toBeDefined();
  });

  it("should not export deprecated functions", async () => {
    const authModule = await import("../auth");

    // Should not export signIn/signOut directly (these come from next-auth/react)
    expect((authModule as any).signIn).toBeUndefined();
    expect((authModule as any).signOut).toBeUndefined();
  });
});
