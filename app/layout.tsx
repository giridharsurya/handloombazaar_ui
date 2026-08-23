import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import Header from "@/components/Header/Header";
import { AuthProvider } from "@/lib/AuthContext";
import { ApiProvider } from "@/lib/ApiProvider";
import { ProductSelectionProvider } from "@/lib/productSelection";
import { ProductActionsProvider } from "@/lib/productActions";
import ApiLoadingProvider from "@/lib/LoadingProvider";
import GlobalLoader from "@/components/GlobalLoader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.handloomstores.com"),
  title: {
    default: "Mangalagiri Handloom Sarees | Andhra Pradesh Handloom Stores",
    template: "%s | Handloom Stores",
  },
  description:
    "Explore authentic Mangalagiri handloom sarees from Andhra Pradesh, handcrafted cotton weaves, zari borders, and trusted local weaving stores.",
  applicationName: "Handloom Stores",
  keywords: [
    "Mangalagiri handloom sarees",
    "Andhra Pradesh handloom sarees",
    "Mangalagiri cotton sarees",
    "handloom sarees from Andhra Pradesh",
    "Mangalagiri weavers",
    "Andhra Pradesh handloom stores",
    "handwoven sarees",
  ],
  openGraph: {
    title: "Handloom Stores",
    description:
      "Discover authentic Mangalagiri handloom sarees, Andhra Pradesh cotton weaves, and trusted local weaving stores.",
    siteName: "Handloom Stores",
    type: "website",
    locale: "en_US",
  },
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full overflow-x-hidden">
        <ApiProvider>
          <AuthProvider>
            <ApiLoadingProvider>
              <Suspense fallback={null}>
                <Header />
              </Suspense>
              <GlobalLoader />
              <ProductSelectionProvider>
                <ProductActionsProvider>
                  <div style={{ paddingTop: "var(--app-header-height, 120px)" }}>
                    {children}
                  </div>
                </ProductActionsProvider>
              </ProductSelectionProvider>
            </ApiLoadingProvider>
          </AuthProvider>
        </ApiProvider>
      </body>
    </html>
  );
}
