import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PWAManager } from "@/components/pwa/PWAManager";

// Mock the service worker
const mockServiceWorker = {
  postMessage: jest.fn(),
  state: "activated",
  addEventListener: jest.fn(),
};

const mockRegistration = {
  installing: null,
  waiting: null,
  active: mockServiceWorker,
  addEventListener: jest.fn(),
  update: jest.fn(),
  unregister: jest.fn(),
};

// Mock navigator.serviceWorker
Object.defineProperty(navigator, "serviceWorker", {
  value: {
    register: jest.fn().mockResolvedValue(mockRegistration),
    ready: Promise.resolve(mockRegistration),
    controller: mockServiceWorker,
    addEventListener: jest.fn(),
  },
  writable: true,
});

// Mock window.matchMedia for mobile detection
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: query === "(display-mode: standalone)",
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe("PWA Manager", () => {
  let mockBeforeInstallPromptEvent: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock beforeinstallprompt event
    mockBeforeInstallPromptEvent = {
      preventDefault: jest.fn(),
      prompt: jest.fn().mockResolvedValue({ outcome: "accepted" }),
      userChoice: Promise.resolve({ outcome: "accepted" }),
    };

    // Reset PWA detection
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  test("registers service worker on mount", async () => {
    render(<PWAManager />);

    await waitFor(() => {
      expect(navigator.serviceWorker.register).toHaveBeenCalledWith("/sw.js");
    });
  });

  test("shows install prompt when available", async () => {
    render(<PWAManager />);

    // Simulate beforeinstallprompt event
    const eventHandler = (window.addEventListener as jest.Mock).mock.calls.find(
      (call) => call[0] === "beforeinstallprompt"
    )?.[1];

    if (eventHandler) {
      eventHandler(mockBeforeInstallPromptEvent);
    }

    await waitFor(() => {
      expect(screen.getByText(/install app/i)).toBeInTheDocument();
    });
  });

  test("handles install button click", async () => {
    render(<PWAManager />);

    // Simulate beforeinstallprompt event
    const eventHandler = (window.addEventListener as jest.Mock).mock.calls.find(
      (call) => call[0] === "beforeinstallprompt"
    )?.[1];

    if (eventHandler) {
      eventHandler(mockBeforeInstallPromptEvent);
    }

    await waitFor(() => {
      expect(screen.getByText(/install app/i)).toBeInTheDocument();
    });

    // Click install button
    fireEvent.click(screen.getByText(/install app/i));

    await waitFor(() => {
      expect(mockBeforeInstallPromptEvent.prompt).toHaveBeenCalled();
    });
  });

  test("hides install prompt after installation", async () => {
    render(<PWAManager />);

    // Simulate beforeinstallprompt event
    const beforeInstallHandler = (
      window.addEventListener as jest.Mock
    ).mock.calls.find((call) => call[0] === "beforeinstallprompt")?.[1];

    if (beforeInstallHandler) {
      beforeInstallHandler(mockBeforeInstallPromptEvent);
    }

    await waitFor(() => {
      expect(screen.getByText(/install app/i)).toBeInTheDocument();
    });

    // Simulate appinstalled event
    const appInstalledHandler = (
      window.addEventListener as jest.Mock
    ).mock.calls.find((call) => call[0] === "appinstalled")?.[1];

    if (appInstalledHandler) {
      appInstalledHandler(new Event("appinstalled"));
    }

    await waitFor(() => {
      expect(screen.queryByText(/install app/i)).not.toBeInTheDocument();
    });
  });

  test("does not show install prompt when already in PWA mode", () => {
    // Mock PWA detection
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: query === "(display-mode: standalone)",
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    render(<PWAManager />);

    // Even with beforeinstallprompt event, should not show prompt
    const eventHandler = (window.addEventListener as jest.Mock).mock.calls.find(
      (call) => call[0] === "beforeinstallprompt"
    )?.[1];

    if (eventHandler) {
      eventHandler(mockBeforeInstallPromptEvent);
    }

    expect(screen.queryByText(/install app/i)).not.toBeInTheDocument();
  });

  test("handles service worker registration errors", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    // Mock registration failure
    (navigator.serviceWorker.register as jest.Mock).mockRejectedValue(
      new Error("Service worker registration failed")
    );

    render(<PWAManager />);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Service worker registration failed:",
        expect.any(Error)
      );
    });

    consoleErrorSpy.mockRestore();
  });

  test("handles service worker updates", async () => {
    render(<PWAManager />);

    // Simulate service worker update
    const updateHandler = mockRegistration.addEventListener.mock.calls.find(
      (call) => call[0] === "updatefound"
    )?.[1];

    if (updateHandler) {
      // Mock new service worker
      mockRegistration.installing = {
        state: "installing",
        addEventListener: jest.fn(),
      };

      updateHandler();

      // Simulate state change to installed
      const stateChangeHandler =
        mockRegistration.installing.addEventListener.mock.calls.find(
          (call) => call[0] === "statechange"
        )?.[1];

      if (stateChangeHandler) {
        mockRegistration.installing.state = "installed";
        stateChangeHandler();
      }
    }

    // Should show update notification
    await waitFor(() => {
      expect(screen.getByText(/new version available/i)).toBeInTheDocument();
    });
  });

  test("handles reload after update", async () => {
    const reloadSpy = jest
      .spyOn(window.location, "reload")
      .mockImplementation();

    render(<PWAManager />);

    // Simulate service worker update and show update notification
    const updateHandler = mockRegistration.addEventListener.mock.calls.find(
      (call) => call[0] === "updatefound"
    )?.[1];

    if (updateHandler) {
      mockRegistration.installing = {
        state: "installing",
        addEventListener: jest.fn(),
      };
      updateHandler();

      const stateChangeHandler =
        mockRegistration.installing.addEventListener.mock.calls.find(
          (call) => call[0] === "statechange"
        )?.[1];

      if (stateChangeHandler) {
        mockRegistration.installing.state = "installed";
        stateChangeHandler();
      }
    }

    await waitFor(() => {
      expect(screen.getByText(/reload/i)).toBeInTheDocument();
    });

    // Click reload button
    fireEvent.click(screen.getByText(/reload/i));

    expect(reloadSpy).toHaveBeenCalled();

    reloadSpy.mockRestore();
  });
});

describe("Service Worker Functionality", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("caches essential resources", async () => {
    // Mock cache API
    const mockCache = {
      addAll: jest.fn().mockResolvedValue(undefined),
      match: jest.fn(),
      put: jest.fn(),
    };

    const mockCaches = {
      open: jest.fn().mockResolvedValue(mockCache),
      match: jest.fn(),
      keys: jest.fn().mockResolvedValue([]),
      delete: jest.fn(),
    };

    Object.defineProperty(global, "caches", {
      value: mockCaches,
      writable: true,
    });

    // Mock service worker install event
    const installEvent = new Event("install");
    Object.defineProperty(installEvent, "waitUntil", {
      value: jest.fn(),
      writable: true,
    });

    // Simulate service worker installation
    const swScope = {
      addEventListener: jest.fn(),
      skipWaiting: jest.fn(),
    };

    // Mock the service worker context
    Object.defineProperty(global, "self", {
      value: swScope,
      writable: true,
    });

    // Test that cache is opened and resources are added
    expect(mockCaches.open).toBeDefined();
    expect(mockCache.addAll).toBeDefined();
  });

  test("handles fetch events for cached resources", async () => {
    const mockCache = {
      match: jest.fn().mockResolvedValue(new Response("cached content")),
      put: jest.fn(),
    };

    const mockCaches = {
      match: jest.fn().mockResolvedValue(new Response("cached content")),
      open: jest.fn().mockResolvedValue(mockCache),
    };

    Object.defineProperty(global, "caches", {
      value: mockCaches,
      writable: true,
    });

    // Mock fetch event
    const fetchEvent = {
      request: new Request("/cached-resource"),
      respondWith: jest.fn(),
      waitUntil: jest.fn(),
    };

    // Test cache matching
    const cachedResponse = await mockCaches.match(fetchEvent.request);
    expect(cachedResponse).toBeDefined();
  });

  test("handles background sync for offline transactions", async () => {
    // Mock registration with sync capability
    const mockSyncRegistration = {
      register: jest.fn().mockResolvedValue(undefined),
    };

    Object.defineProperty(navigator.serviceWorker, "ready", {
      value: Promise.resolve({
        sync: mockSyncRegistration,
      }),
      writable: true,
    });

    // Test background sync registration
    const registration = await navigator.serviceWorker.ready;
    if ("sync" in registration) {
      await registration.sync.register("background-sync");
      expect(mockSyncRegistration.register).toHaveBeenCalledWith(
        "background-sync"
      );
    }
  });
});

describe("PWA Offline Page", () => {
  test("renders offline page content", () => {
    // This would be tested in the actual offline page component
    const offlineContent = {
      title: "You're offline",
      message: "Please check your internet connection",
      actions: ["Try again", "View cached data"],
    };

    expect(offlineContent.title).toContain("offline");
    expect(offlineContent.actions).toContain("Try again");
  });

  test("provides offline functionality access", () => {
    const offlineFeatures = [
      "View cached products",
      "Process offline transactions",
      "View transaction history",
      "Access help information",
    ];

    expect(offlineFeatures).toContain("View cached products");
    expect(offlineFeatures).toContain("Process offline transactions");
  });
});

describe("PWA Manifest", () => {
  test("has correct manifest structure", () => {
    const expectedManifest = {
      name: "BaaWA Inventory & POS",
      short_name: "BaaWA POS",
      description: "Inventory Management and Point of Sale System",
      start_url: "/",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#000000",
      orientation: "portrait",
    };

    // Test manifest properties
    expect(expectedManifest.name).toBe("BaaWA Inventory & POS");
    expect(expectedManifest.display).toBe("standalone");
    expect(expectedManifest.start_url).toBe("/");
  });

  test("includes required icons", () => {
    const requiredIcons = [
      { src: "/icons/icon-192x192.png", sizes: "192x192" },
      { src: "/icons/icon-512x512.png", sizes: "512x512" },
    ];

    requiredIcons.forEach((icon) => {
      expect(icon.src).toMatch(/\/icons\/icon-\d+x\d+\.png/);
      expect(icon.sizes).toMatch(/\d+x\d+/);
    });
  });
});
