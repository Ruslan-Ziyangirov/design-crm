import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { Toaster } from "@/components/shared/toaster";

const manrope = localFont({
  src: "./fonts/Manrope.ttf",
  variable: "--font-manrope",
  weight: "200 800",
  display: "swap",
});

const inter = localFont({
  src: "./fonts/Inter.ttf",
  variable: "--font-inter",
  weight: "100 900",
  display: "swap",
});

const jetbrains = localFont({
  src: "./fonts/JetBrainsMono.ttf",
  variable: "--font-jetbrains",
  weight: "100 800",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Личная CRM для дизайн-студии",
  description: "Клиенты, заказы, финансы и аналитика в одном месте",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${manrope.variable} ${inter.variable} ${jetbrains.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
