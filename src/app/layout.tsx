import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "OneSource - Turn URL into Viral Content | AI Repurposing Engine",
  description: "Transform any article or YouTube video into a week's worth of content (TikTok, X Thread, LinkedIn, Note.com). The ultimate AI tool for content creators.",
  applicationName: "OneSource",
  keywords: ["AI text generator", "content repurposing", "TikTok script generator", "LinkedIn post generator", "X thread maker"],
  metadataBase: new URL("https://onesource-app.site"),
  openGraph: {
    title: "OneSource - Turn URL into Viral Content",
    description: "Generate TikTok scripts, X threads, and LinkedIn posts from a single URL instantly.",
    url: "https://onesource-app.site",
    siteName: "OneSource",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OneSource - Turn URL into Viral Content",
    description: "Stop wasting time writing from scratch. Repurpose your content instantly with OneSource.",
    creator: "@onesource_app",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.variable}`}>
        <div className="liquid-bg" />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
