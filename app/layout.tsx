import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";
import { InstallPrompt } from "@/components/InstallPrompt";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { SPLASH_SCREENS, splashFileName, splashMedia } from "@/lib/splash";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Lista de Compras",
    template: "%s · Lista de Compras",
  },
  description:
    "Monte suas listas de mercado, informe o preço de cada produto durante a compra e acompanhe o total gasto.",
  applicationName: "Lista de Compras",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Compras",
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#10a05a" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0f14" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        {/* iOS ignora o manifest: precisa das meta tags e das splash screens dedicadas. */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Compras" />
        {SPLASH_SCREENS.map((spec) => (
          <link
            key={splashFileName(spec)}
            rel="apple-touch-startup-image"
            media={splashMedia(spec)}
            href={`/splash/${splashFileName(spec)}`}
          />
        ))}
      </head>
      <body className="bg-bg text-ink font-sans min-h-full">
        <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col">{children}</div>
        <BottomNav />
        <InstallPrompt />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
