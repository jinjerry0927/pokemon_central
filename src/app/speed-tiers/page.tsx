import { SectionPage } from "../_components/section-page";

export default function SpeedTiersPage() {
  return (
    <SectionPage
      description="실전에서 중요한 스피드 기준을 검색, 정렬, 비교하는 페이지입니다."
      eyebrow="Speed Tiers"
      items={["스피드 수치", "성격 프리셋", "노력치 프리셋", "검색과 정렬"]}
      title="스피드 티어"
    />
  );
}
