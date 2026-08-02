import type { Metadata, Viewport } from "next";
import "./globals.css";
import Script from "next/script";

export const viewport: Viewport = {
  themeColor: "#111827",
  width: "device-width",
  initialScale: 1.0,
};

export const metadata: Metadata = {
  title: "Plataforma de Inversión",
  description: "Plataforma de Inversión — Educación, gestión de ganancias y red de referidos en un solo ecosistema.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" data-theme="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />
        <Script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js" strategy="beforeInteractive" />
        <Script src="/app.js?v=2" strategy="beforeInteractive" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
