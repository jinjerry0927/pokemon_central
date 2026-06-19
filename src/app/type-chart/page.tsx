import { AppShell, InfoCard, PageHeader } from "../_components/design-system";
import { TypeChartBrowser } from "./type-chart-browser";

export default function TypeChartPage() {
  return (
    <AppShell>
      <PageHeader
        aside={
          <InfoCard description="첫 번째 타입만 고르면 단일 타입, 두 번째 타입을 고르면 복합 타입으로 계산합니다." title="계산 방식">
            <div className="grid gap-2 text-sm font-semibold text-[var(--muted)]">
              <span>공격 배율 기준</span>
              <span>복합 타입 곱연산</span>
              <span>팀빌더와 같은 계산 사용</span>
            </div>
          </InfoCard>
        }
        description="단일/복합 타입 방어 상성과 공격 상성을 빠르게 확인합니다."
        eyebrow="Type Chart"
        title="타입 상성표"
      />

      <TypeChartBrowser />
    </AppShell>
  );
}
