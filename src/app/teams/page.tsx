import { SectionPage } from "../_components/section-page";

export default function TeamsPage() {
  return (
    <SectionPage
      description="6마리 팀 슬롯, 타입 약점 요약, 역할 태그 요약, 로컬 저장 흐름을 담당합니다."
      eyebrow="Team Builder"
      items={["6개 슬롯", "포켓몬 검색", "약점 요약", "localStorage 저장"]}
      title="팀빌더"
    />
  );
}
