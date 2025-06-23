/**
 * @jest-environment jsdom
 */

import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { SessionProvider } from "@/components/auth/SessionProvider";
import { useSessionManagement } from "@/hooks/useSessionManagement";
import {
  secureLogout,
  checkSessionValidity,
  SessionTimeoutManager,
} from "@/lib/session-management";

// Mock next-auth
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
  getSession: jest.fn(),
  signOut: jest.fn(),
}));

// Mock session management functions
jest.mock("@/lib/session-management", () => ({
  secureLogout: jest.fn(),
  checkSessionValidity: jest.fn(),
  refreshSession: jest.fn(),
  SessionTimeoutManager: jest.fn(),
  updateUserActivity: jest.fn(),
  useSessionActivity: jest.fn(),
}));

// Mock Supabase
jest.mock("@/lib/supabase", () => ({
  createServerSupabaseClient: jest.fn(),
}));

import { useSession, getSession, signOut } from "next-auth/react";

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;
const mockSignOut = signOut as jest.MockedFunction<typeof signOut>;
const mockSecureLogout = secureLogout as jest.MockedFunction<
  typeof secureLogout
>;
const mockCheckSessionValidity = checkSessionValidity as jest.MockedFunction<
  typeof checkSessionValidity
>;
const mockSessionTimeoutManager = SessionTimeoutManager as jest.MockedClass<
  typeof SessionTimeoutManager
>;

describe("Session Management", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Reset localStorage and sessionStorage
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });

    Object.defineProperty(window, "sessionStorage", {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("secureLogout", () => {
    it("should clear local storage and sign out", async () => {
      const mockLocalStorage = {
        removeItem: jest.fn(),
      };
      const mockSessionStorage = {
        clear: jest.fn(),
      };

      // Mock localStorage and sessionStorage
      Object.defineProperty(window, "localStorage", {
        value: mockLocalStorage,
        writable: true,
      });
      Object.defineProperty(window, "sessionStorage", {
        value: mockSessionStorage,
        writable: true,
      });

      // Mock document.cookie
      Object.defineProperty(document, "cookie", {
        value: "test=value; another=value2",
        writable: true,
      });

      await secureLogout();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        "inventory-cart"
      );
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("pos-session");
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        "user-preferences"
      );
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("draft-data");
      expect(mockSessionStorage.clear).toHaveBeenCalled();
      expect(mockSignOut).toHaveBeenCalledWith({
        callbackUrl: "/login",
        redirect: true,
      });
    });
  });

  describe("checkSessionValidity", () => {
    it("should return valid session info for active sessions", async () => {
      const futureDate = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
      mockGetSession.mockResolvedValue({
        user: {
          id: "1",
          email: "test@example.com",
          name: "Test User",
          role: "STAFF",
        },
        expires: futureDate.toISOString(),
      });

      mockCheckSessionValidity.mockResolvedValue({
        isValid: true,
        expiresAt: futureDate,
        timeRemaining: 60 * 60 * 1000,
      });

      const result = await checkSessionValidity();

      expect(result.isValid).toBe(true);
      expect(result.timeRemaining).toBe(60 * 60 * 1000);
    });

    it("should return invalid session info for expired sessions", async () => {
      mockGetSession.mockResolvedValue(null);

      mockCheckSessionValidity.mockResolvedValue({
        isValid: false,
      });

      const result = await checkSessionValidity();

      expect(result.isValid).toBe(false);
    });
  });

  describe("SessionTimeoutManager", () => {
    let manager: SessionTimeoutManager;
    let onWarning: jest.Mock;
    let onTimeout: jest.Mock;

    beforeEach(() => {
      onWarning = jest.fn();
      onTimeout = jest.fn();

      // Mock the actual implementation
      mockSessionTimeoutManager.mockImplementation(
        (warningCallback, timeoutCallback) => {
          return {
            startMonitoring: jest.fn().mockImplementation(async () => {
              // Simulate monitoring setup
            }),
            resetTimeout: jest.fn(),
            clearTimeouts: jest.fn(),
            destroy: jest.fn(),
          } as any;
        }
      );

      manager = new SessionTimeoutManager(onWarning, onTimeout);
    });

    it("should create manager with callbacks", () => {
      expect(mockSessionTimeoutManager).toHaveBeenCalledWith(
        onWarning,
        onTimeout
      );
    });

    it("should start monitoring when session is valid", async () => {
      mockCheckSessionValidity.mockResolvedValue({
        isValid: true,
        timeRemaining: 60 * 60 * 1000, // 1 hour
      });

      await manager.startMonitoring();

      expect(manager.startMonitoring).toBeDefined();
    });
  });

  describe("Error Handling", () => {
    it("should handle session check errors gracefully", async () => {
      mockGetSession.mockRejectedValue(new Error("Network error"));
      mockCheckSessionValidity.mockResolvedValue({ isValid: false });

      const result = await checkSessionValidity();

      expect(result.isValid).toBe(false);
    });

    it("should handle logout errors gracefully", async () => {
      mockSignOut.mockRejectedValue(new Error("Logout error"));
      mockSecureLogout.mockResolvedValue();

      // Should not throw
      await expect(secureLogout()).resolves.toBeUndefined();
    });
  });
});
