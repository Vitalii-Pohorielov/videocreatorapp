import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";

import { AppHeader } from "@/components/AppHeader";

import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
});

export const metadata: Metadata = {
  title: "ClipLab",
  description: "ClipLab helps you turn ideas, webpages, and product stories into clean short videos in the browser.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${plusJakartaSans.variable} font-sans antialiased`}>
        <AppHeader />
        {children}
      </body>
    </html>
  );
}
