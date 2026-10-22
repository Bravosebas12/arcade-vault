import type { Metadata } from "next";
import localFont from "next/font/local";
import { SessionProvider } from "@/features/session/SessionProvider";
import { Footer } from "@/shared/components/Footer";
import { Nav } from "@/shared/components/Nav";
import "./globals.css";

// Exact woff2 files (latin subset) that Google Fonts serves to Chrome for the prototype's
// stylesheet link, self-hosted so text renders pixel-identical to references/templates.
// font-family keeps the real family names because globals.css (--pixel, --mono) names them literally.
const pressStart = localFont({
  src: "./fonts/press-start-2p-400-latin.woff2",
  weight: "400",
  variable: "--font-press-start",
  adjustFontFallback: false,
  declarations: [{ prop: "font-family", value: "'Press Start 2P'" }],
});

const jetbrainsMono = localFont({
  // Variable font: one file covers weights 400–700.
  src: "./fonts/jetbrains-mono-latin.woff2",
  weight: "400 700",
  variable: "--font-jetbrains-mono",
  adjustFontFallback: false,
  declarations: [{ prop: "font-family", value: "'JetBrains Mono'" }],
});

const courierPrime = localFont({
  src: [
    { path: "./fonts/courier-prime-400-latin.woff2", weight: "400" },
    { path: "./fonts/courier-prime-700-latin.woff2", weight: "700" },
  ],
  variable: "--font-courier-prime",
  adjustFontFallback: false,
  declarations: [{ prop: "font-family", value: "'Courier Prime'" }],
});

export const metadata: Metadata = {
  title: "Arcade Vault · Portal Retro",
  description: "Portal de juegos arcade retro",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${pressStart.variable} ${jetbrainsMono.variable} ${courierPrime.variable} h-full`}
    >
      <body>
        <div className="av-bg" aria-hidden="true" />
        <div className="av-noise" aria-hidden="true" />
        <SessionProvider>
          <div className="av-app">
            <Nav />
            <main className="av-main">{children}</main>
            <Footer />
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
