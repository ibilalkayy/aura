import type { Metadata } from "next";
// Self-hosted via @fontsource rather than next/font/google: no runtime
// dependency on Google's font CDN, and the build doesn't need network
// access to fonts.googleapis.com to succeed.
import "@fontsource/fraunces/400.css";
import "@fontsource/fraunces/500.css";
import "@fontsource/fraunces/600.css";
import "@fontsource/instrument-sans/400.css";
import "@fontsource/instrument-sans/500.css";
import "@fontsource/instrument-sans/600.css";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";
import { AuthProvider } from "@/lib/auth-context";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";
import MobileTabBar from "@/components/MobileTabBar";
import ThemeScript from "@/components/ui/ThemeScript";

export const metadata: Metadata = {
  title: "Aura — Shop without the noise",
  description: "A cleaner way to shop online. No ads, no clutter, no games.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="antialiased bg-paper text-ink">
        <AuthProvider>
          <CartProvider>
            <Header />
            <main className="min-h-[60vh] pb-16 sm:pb-0">{children}</main>
            <div className="pb-16 sm:pb-0">
              <Footer />
            </div>
            <BackToTop />
            <MobileTabBar />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
