import type { Metadata } from "next";
import {
  Bebas_Neue,
  Inter,
  Merriweather,
  Montserrat,
  Oswald,
  Playfair_Display,
  Plus_Jakarta_Sans,
  Space_Grotesk,
  Syne,
} from "next/font/google";

import { AppFooter } from "@/components/AppFooter";
import { AppHeader } from "@/components/AppHeader";

import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-oswald",
});

const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bebas-neue",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair-display",
});

const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-merriweather",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://videocreatorapp.vercel.app"),
  title: {
    default: "ClipLab",
    template: "%s | ClipLab",
  },
  description: "Create short promo videos from ideas, websites, and product stories right in the browser.",
  applicationName: "ClipLab",
  keywords: ["video creator", "promo video", "website to video", "browser video editor", "product video"],
  icons: {
    icon: [{ url: "/logo.png", type: "image/png" }],
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "ClipLab",
    description: "Create short promo videos from ideas, websites, and product stories right in the browser.",
    siteName: "ClipLab",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "ClipLab logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "ClipLab",
    description: "Create short promo videos from ideas, websites, and product stories right in the browser.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${plusJakartaSans.variable} ${inter.variable} ${spaceGrotesk.variable} ${syne.variable} ${montserrat.variable} ${oswald.variable} ${bebasNeue.variable} ${playfairDisplay.variable} ${merriweather.variable} flex min-h-screen flex-col font-sans antialiased`}
      >
        <AppHeader />
        <div className="flex-1">{children}</div>
        <AppFooter />
      </body>
    </html>
  );
}
