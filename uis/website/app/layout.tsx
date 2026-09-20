import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import Script from "next/script";
import "./globals.css";

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
  title: "Nexova | Consultora de talento y recursos humanos",
  description:
    "Consultora especializada en headhunting, formacion corporativa y outsourcing para empresas en Espana y Estados Unidos.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${spaceGrotesk.variable} ${ibmPlexMono.variable}`}
    >
      <head>
        <link rel="dns-prefetch" href="https://gc.kes.v2.scr.kaspersky-labs.com" />
      </head>
      <body>
        {children}
        <Script
          src="https://gc.kes.v2.scr.kaspersky-labs.com/7EA5E9BB-55E1-4C31-9C21-4943DDFED2E4/main.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
