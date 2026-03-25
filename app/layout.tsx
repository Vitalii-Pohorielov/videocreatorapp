import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";

import { AppFooter } from "@/components/AppFooter";
import { AppHeader } from "@/components/AppHeader";

import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
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
      <body className={`${plusJakartaSans.variable} flex min-h-screen flex-col font-sans antialiased`}>
        <AppHeader />
        <div className="flex-1">{children}</div>
        <AppFooter />
      </body>
    </html>
  );
}
