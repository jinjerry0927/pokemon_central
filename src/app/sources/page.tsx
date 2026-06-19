import Link from "next/link";
import { AppShell, DataTable, InfoCard, PageHeader } from "../_components/design-system";
import { createPageMetadata } from "../_lib/seo";

export const metadata = createPageMetadata({
  title: "Data Sources",
  description: "Pokemon Central에서 사용하는 데이터 출처와 사용 범위를 확인합니다.",
  path: "/sources"
});

const sourceRows = [
  {
    id: "pokeapi",
    source: "PokeAPI",
    scope: "등록 확인된 포켓몬의 기본 정보, 타입, 특성, 기술 기본값 확인",
    note: "Pokemon Champions 등록 여부 판단에는 사용하지 않음"
  },
  {
    id: "pokemondb",
    source: "PokemonDB",
    scope: "종족값, 기술, 아이템, 특성 교차 검증",
    note: "설명 문구는 그대로 복사하지 않고 요약"
  },
  {
    id: "smogon",
    source: "Smogon",
    scope: "실전 빌드 방향, 아이템/기술 채용 예시 참고",
    note: "Pokemon Champions 환경과 다를 수 있어 그대로 추천하지 않음"
  },
  {
    id: "manual-curation",
    source: "Pokemon Central 수동 큐레이션",
    scope: "등록 여부, 전용 빌드, 팀, 운영 메모",
    note: "작성자 검증일과 근거를 남긴 뒤 공개"
  }
];

export default function SourcesPage() {
  return (
    <AppShell>
      <PageHeader
        description="Pokemon Central은 확인 가능한 출처와 수동 큐레이션 기준을 함께 기록합니다. 출처가 불명확한 데이터는 공개 페이지, 추천 빌드, 계산기 기본값에 사용하지 않습니다."
        eyebrow="Data Sources"
        title="데이터 출처와 사용 범위"
      />

      <section className="mx-auto grid max-w-7xl gap-4 px-6 py-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-10">
        <DataTable
          columns={[
            { key: "id", label: "Source ID" },
            { key: "source", label: "출처" },
            { key: "scope", label: "사용 범위" },
            { key: "note", label: "주의사항" }
          ]}
          rows={sourceRows}
        />

        <div className="grid gap-4">
          <InfoCard
            description="외부 API는 MVP에서 런타임 의존성으로 사용하지 않고, data/ 아래 JSON을 정적 데이터로 관리합니다."
            title="저장 방식"
          />
          <InfoCard
            description="공식 이미지와 스프라이트는 사용 정책 확인 전까지 핵심 UI에 포함하지 않습니다."
            title="자산 정책"
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-10 lg:px-10">
        <Link className="text-sm font-semibold text-[var(--accent)]" href="/about">
          팬메이드 고지 보기
        </Link>
      </section>
    </AppShell>
  );
}
