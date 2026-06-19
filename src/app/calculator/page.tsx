import { Suspense } from "react";
import moves from "../../../data/moves.json";
import pokemon from "../../../data/pokemon.json";
import { AppShell, Badge, InfoCard, PageHeader } from "../_components/design-system";
import { CalculatorBrowser } from "./calculator-browser";

export default function CalculatorPage() {
  return (
    <AppShell>
      <PageHeader
        aside={
          <InfoCard description="표준 데미지 식 기반 MVP" title="계산 범위">
            <Badge tone="success">Phase M</Badge>
          </InfoCard>
        }
        description="공격자, 방어자, 기술과 핵심 수치를 조정해 최소/최대 데미지, HP 비율, 확정 타수를 확인합니다."
        eyebrow="Damage Calculator"
        title="데미지 계산기"
      />
      <Suspense fallback={null}>
        <CalculatorBrowser moves={moves} pokemon={pokemon} />
      </Suspense>
    </AppShell>
  );
}
