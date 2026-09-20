import { Fragment } from "react";
import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import Script from "next/script";
import { headers } from "next/headers";
import { AuthGuard } from "../components/auth/auth-guard";
import "./globals.css";

// C4 — Detecta la URL base de la API en SSR, replicando detectApiBaseUrl()
async function detectApiBaseUrlServer(): Promise<string> {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const hostname = host.replace(/:\d+$/, "");
  const match = hostname.match(/^(.*)-\d+\.(.*)$/);
  if (match) {
    return `https://${match[1]}-8000.${match[2]}`;
  }
  return "http://localhost:8000";
}

// C4 — Orígenes fijos críticos (preconnect + dns-prefetch)
const STATIC_API_ORIGINS = [
  "https://playground.4geeks.com",
  "https://gc.kes.v2.scr.kaspersky-labs.com",
] as const;

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  weight: ["400", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nexova Backoffice",
  description:
    "Aplicacion interna de Nexova para operar y visualizar la logica de negocio.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // C4 — Preconnect dinámico al origen de la API (mismo origen que detectApiBaseUrl en runtime)
  const apiBaseUrl = await detectApiBaseUrlServer();

  return (
    <html
      lang="es"
      className={`${spaceGrotesk.variable} ${ibmPlexMono.variable}`}
    >
      <head>
        <link rel="dns-prefetch" href={apiBaseUrl} />
        <link rel="preconnect" href={apiBaseUrl} crossOrigin="anonymous" />
        {STATIC_API_ORIGINS.map((origin) => (
          <Fragment key={origin}>
            <link rel="dns-prefetch" href={origin} />
            <link rel="preconnect" href={origin} crossOrigin="anonymous" />
          </Fragment>
        ))}
      </head>
      <body>
        <AuthGuard>{children}</AuthGuard>
        <Script
          src="https://gc.kes.v2.scr.kaspersky-labs.com/7EA5E9BB-55E1-4C31-9C21-4943DDFED2E4/main.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
