import type { Metadata, Viewport } from "next";
import { Oxanium, Plus_Jakarta_Sans, Roboto } from "next/font/google";
import "./globals.css";

import { QueryProvider } from "@/components/providers/QueryProvider";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { PWAManager } from "@/components/pwa/PWAManager";

const oxanium = Oxanium({
  variable: "--font-sans",
  subsets: ["latin"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-serif",
  subsets: ["latin"],
});

const roboto = Roboto({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

export const metadata: Metadata = {
  title: "BaaWA Inventory & POS",
  description:
    "Inventory management and point of sale system for BaaWA Accessories",
  manifest: "/manifest.json",
  keywords: [
    "inventory",
    "pos",
    "point of sale",
    "retail",
    "baawa",
    "accessories",
  ],
  authors: [{ name: "BaaWA Accessories" }],
  creator: "BaaWA Accessories",
  publisher: "BaaWA Accessories",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BaaWA POS",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "BaaWA POS",
    "application-name": "BaaWA POS",
    "msapplication-TileColor": "#2563eb",
    "msapplication-config": "/browserconfig.xml",
    "theme-color": "#2563eb",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${oxanium.variable} ${plusJakartaSans.variable} ${roboto.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SessionProvider>
            <QueryProvider>
              {children}
              <PWAManager />
              <Toaster />
            </QueryProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
