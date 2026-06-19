import type { Metadata } from "next";

export const siteUrl = "https://pokemon-central.pages.dev";

export const siteName = "Pokemon Central";

export const siteDescription =
  "Pokemon Champions 한국어 공략, 도감, 빌드, 팀빌더, 스피드 티어, 데미지 계산기 허브";

const defaultOgImage = "/og-image.svg";

export function createPageMetadata({
  title,
  description,
  path = "/"
}: {
  title: string;
  description: string;
  path?: string;
}): Metadata {
  const url = new URL(path, siteUrl).toString();

  return {
    title,
    description,
    alternates: {
      canonical: url
    },
    openGraph: {
      title,
      description,
      url,
      siteName,
      locale: "ko_KR",
      type: "website",
      images: [
        {
          url: defaultOgImage,
          width: 1200,
          height: 630,
          alt: `${siteName} Open Graph image`
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [defaultOgImage]
    }
  };
}
