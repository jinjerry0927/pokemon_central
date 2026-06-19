import pokemon from "../../../data/pokemon.json";
import { AppShell, InfoCard, PageHeader } from "../_components/design-system";
import { createPageMetadata } from "../_lib/seo";
import { SpeedTiersBrowser } from "./speed-tiers-browser";

export const metadata = createPageMetadata({
  title: "스피드 티어",
  description: "Pokemon Champions 주요 포켓몬의 스피드 순위를 성격과 노력치 기준으로 비교합니다.",
  path: "/speed-tiers"
});

export default function SpeedTiersPage() {
  return (
    <AppShell>
      <PageHeader
        aside={
          <InfoCard description="스피드는 Lv.50, IV 31 기준으로 계산합니다." title="계산 기준">
            <div className="grid gap-2 text-sm font-semibold text-[var(--muted)]">
              <span>상승 성격 / 보정 없음</span>
              <span>252 EV / 0 EV 프리셋</span>
              <span>종족값 기준 비교</span>
            </div>
          </InfoCard>
        }
        description="주요 포켓몬의 스피드 순위를 검색하고, 성격과 노력치 기준별로 비교합니다."
        eyebrow="Speed Tiers"
        title="스피드 티어"
      />

      <SpeedTiersBrowser pokemon={pokemon} />
    </AppShell>
  );
}
