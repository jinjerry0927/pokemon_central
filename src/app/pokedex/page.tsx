import pokemon from "../../../data/pokemon.json";
import { AppShell, InfoCard, PageHeader } from "../_components/design-system";
import { PokedexBrowser } from "./pokedex-browser";

export default function PokedexPage() {
  return (
    <AppShell>
      <PageHeader
        aside={
          <InfoCard description="데스크톱에서는 필터, 목록, 보조 패널을 동시에 둡니다." title="3컬럼 기준">
            <div className="grid gap-2 text-sm font-semibold text-[var(--muted)]">
              <span>왼쪽: 검색과 필터</span>
              <span>가운데: 결과 테이블</span>
              <span>오른쪽: 선택 항목 요약</span>
            </div>
          </InfoCard>
        }
        description="포켓몬 목록, 검색, 타입 필터, 상세 페이지 이동을 담당하는 도감 허브입니다."
        eyebrow="Pokedex"
        title="도감"
      />

      <PokedexBrowser pokemon={pokemon} />
    </AppShell>
  );
}
