import Link from "next/link";
import builds from "../../../data/builds.json";
import pokemon from "../../../data/pokemon.json";
import { AppShell, Badge, InfoCard, PageHeader } from "../_components/design-system";
import { createPageMetadata } from "../_lib/seo";

export const metadata = createPageMetadata({
  title: "빌드",
  description: "Pokemon Champions 추천 빌드의 성격, 노력치, 기술, 아이템, 운영법을 한국어로 정리합니다.",
  path: "/builds"
});

function formatId(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function BuildsPage() {
  return (
    <AppShell>
      <PageHeader
        aside={
          <InfoCard description={`${builds.length}개 MVP 샘플`} title="빌드 데이터">
            <Badge tone="success">Phase I</Badge>
          </InfoCard>
        }
        description="초보자가 바로 따라 할 수 있도록 성격, 노력치, 기술, 아이템, 역할, 운영법과 카운터를 함께 정리합니다."
        eyebrow="Build Library"
        title="빌드"
      />

      <section className="mx-auto grid max-w-7xl gap-4 px-6 py-6 lg:grid-cols-2 lg:px-10">
        {builds.map((build) => {
          const pokemonEntry = pokemon.find((entry) => entry.id === build.pokemonId);

          return (
            <Link
              className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-4 hover:bg-[var(--chip)]"
              href={`/builds/${build.id}`}
              key={build.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--muted)]">
                    {pokemonEntry ? `${pokemonEntry.nameKo} / ${pokemonEntry.nameEn}` : build.pokemonId}
                  </p>
                  <h2 className="mt-2 text-lg font-bold">{build.titleKo}</h2>
                </div>
                <Badge tone="type">{build.nature}</Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {build.roleTags.map((role) => (
                  <Badge key={role}>{formatId(role)}</Badge>
                ))}
              </div>
              <p className="mt-4 text-sm leading-6 text-[var(--muted)]">{build.usageKo}</p>
            </Link>
          );
        })}
      </section>
    </AppShell>
  );
}
