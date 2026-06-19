import Script from "next/script";

type CloudflareWebAnalyticsProps = {
  token?: string;
};

export function CloudflareWebAnalytics({
  token
}: CloudflareWebAnalyticsProps) {
  if (!token) {
    return null;
  }

  return (
    <Script
      defer
      src="https://static.cloudflareinsights.com/beacon.min.js"
      data-cf-beacon={JSON.stringify({ token })}
      strategy="afterInteractive"
    />
  );
}
