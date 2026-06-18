import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pokemon Central",
  description: "Pokemon Champions 한국어 공략, 도감, 빌드, 팀빌딩 허브"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
