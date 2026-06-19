import { SectionPage } from "../_components/section-page";

export default function CalculatorPage() {
  return (
    <SectionPage
      description="공격자, 방어자, 기술을 선택해 최소/최대 데미지와 확정 타수를 보여주는 계산기입니다."
      eyebrow="Damage Calculator"
      items={["공격자 선택", "방어자 선택", "기술 선택", "읽기 쉬운 결과"]}
      title="데미지 계산기"
    />
  );
}
