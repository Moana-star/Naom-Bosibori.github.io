import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://naom-kenagwa-portfolio.vercel.app"),
  title: "Naom Kenagwa — Technical Writing, SEO Content & AI Search",
  description:
    "Naom Kenagwa is a Computer Science student building practical experience in technical writing, technical SEO, content strategy and AI search-focused content.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "https://naom-kenagwa-portfolio.vercel.app/",
    siteName: "Naom Kenagwa",
    title: "Naom Kenagwa — Technical Writing, SEO Content & AI Search",
    description:
      "Clear technical writing, search-focused content strategy, and practical projects by Naom Kenagwa.",
  },
  twitter: { card: "summary", title: "Naom Kenagwa — Technical Writing & SEO" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
};

export const viewport: Viewport = {
  themeColor: "#020617",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
