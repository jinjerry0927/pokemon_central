import { SectionPage } from "../_components/section-page";
import { createPageMetadata } from "../_lib/seo";

export const metadata = createPageMetadata({
  title: "About",
  description: "Pokemon Central의 운영 범위, 데이터 출처, 팬메이드 고지, MVP 정책을 확인합니다.",
  path: "/about"
});

export default function AboutPage() {
  return (
    <SectionPage
      description="사이트 목적, 데이터 출처, 팬메이드 고지, 운영 범위를 설명하는 페이지입니다."
      eyebrow="About"
      items={["프로젝트 소개", "데이터 출처", "팬메이드 고지", "운영 범위"]}
      title="About"
    />
  );
}
