import pokemon from "../../../data/pokemon.json";
import { AppShell, InfoCard, PageHeader } from "../_components/design-system";
import { createPageMetadata } from "../_lib/seo";
import { TeamBuilder } from "./team-builder";

export const metadata = createPageMetadata({
  title: "팀빌더",
  description: "6마리 팀을 구성하고 타입 약점과 역할 균형을 브라우저에서 바로 확인합니다.",
  path: "/teams"
});

export default function TeamsPage() {
  return (
    <AppShell>
      <PageHeader
        aside={
          <InfoCard description="팀은 이 브라우저의 localStorage에 저장됩니다." title="MVP 저장 방식">
            <div className="grid gap-2 text-sm font-semibold text-[var(--muted)]">
              <span>6개 슬롯 구성</span>
              <span>타입 약점 시각화</span>
              <span>역할 태그 요약</span>
            </div>
          </InfoCard>
        }
        description="포켓몬을 검색해 6마리 팀을 구성하고, 타입 약점과 역할 균형을 빠르게 확인합니다."
        eyebrow="Team Builder"
        title="팀빌더"
      />

      <TeamBuilder pokemon={pokemon} />
    </AppShell>
  );
}
