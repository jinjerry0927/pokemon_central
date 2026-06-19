import { SectionPage } from "../_components/section-page";

export default function TypeChartPage() {
  return (
    <SectionPage
      description="단일/복합 타입 방어 상성과 공격 상성을 빠르게 확인하는 상성표입니다."
      eyebrow="Type Chart"
      items={["공격 상성", "방어 상성", "복합 타입 요약", "팀 약점 재사용"]}
      title="타입 상성표"
    />
  );
}
