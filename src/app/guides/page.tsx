import { SectionPage } from "../_components/section-page";

export default function GuidesPage() {
  return (
    <SectionPage
      description="Pokemon Champions 입문, 랭크 준비, 도구 사용법을 설명하는 공략 글 목록입니다."
      eyebrow="Guides"
      items={["시작 가이드", "첫 랭크 팀 추천", "타입 상성", "스피드 티어", "계산기 사용법"]}
      title="가이드"
    />
  );
}
