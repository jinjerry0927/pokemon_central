import type { Metadata } from "next";
import { CloudflareWebAnalytics } from "./_components/cloudflare-web-analytics";
import { siteDescription, siteName, siteUrl } from "./_lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteName,
    template: `%s | ${siteName}`
  },
  description: siteDescription
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cloudflareAnalyticsToken =
    process.env.NEXT_PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN;

  return (
    <html lang="ko">
      <body>
        {children}
        <CloudflareWebAnalytics token={cloudflareAnalyticsToken} />
      </body>
    </html>
  );
}
