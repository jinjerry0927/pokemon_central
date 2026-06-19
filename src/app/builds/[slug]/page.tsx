import builds from "../../../../data/builds.json";
import moves from "../../../../data/moves.json";
import pokemon from "../../../../data/pokemon.json";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell, Badge, InfoCard, PageHeader } from "../../_components/design-system";

type BuildRoute = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return builds.map((entry) => ({
    slug: entry.id
  }));
}

const statLabels: Record<keyof (typeof builds)[number]["evs"], string> = {
  hp: "HP",
  attack: "공격",
  defense: "방어",
  specialAttack: "특공",
  specialDefense: "특방",
  speed: "스피드"
};

function formatId(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function BuildDetailPage({ params }: BuildRoute) {
  const { slug } = await params;
  const entry = builds.find((item) => item.id === slug);

  if (!entry) {
    notFound();
  }

  const pokemonEntry = pokemon.find((item) => item.id === entry.pokemonId);
  const selectedMoves = entry.moveIds
    .map((moveId) => moves.find((move) => move.id === moveId))
    .filter((move): move is (typeof moves)[number] => Boolean(move));

  return (
    <AppShell>
      <PageHeader
        aside={
          <InfoCard description={entry.notesKo} title="검증 상태">
            <Badge tone="warning">
              {entry.publishStatus === "mvp-sample" ? "MVP 샘플" : entry.publishStatus}
            </Badge>
          </InfoCard>
        }
        description={entry.usageKo}
        eyebrow="Build Detail"
        title={entry.titleKo}
      />

      <section className="mx-auto grid max-w-7xl gap-4 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-10">
        <div className="grid gap-4">
          <InfoCard title="빌드 요약">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-semibold text-[var(--muted)]">포켓몬</p>
                <p className="mt-1 font-bold">
                  {pokemonEntry ? `${pokemonEntry.nameKo} / ${pokemonEntry.nameEn}` : entry.pokemonId}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--muted)]">성격</p>
                <p className="mt-1 font-bold">{entry.nature}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--muted)]">특성</p>
                <p className="mt-1 font-bold">{formatId(entry.abilityId)}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--muted)]">아이템</p>
                <p className="mt-1 font-bold">{formatId(entry.itemId)}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-1">
              {entry.roleTags.map((role) => (
                <Badge key={role}>{formatId(role)}</Badge>
              ))}
            </div>
          </InfoCard>

          <InfoCard title="기술 구성">
            <div className="grid gap-3 md:grid-cols-2">
              {selectedMoves.map((move) => (
                <div
                  className="rounded-lg border border-[var(--panel-border)] bg-white p-3"
                  key={move.id}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-bold">{move.nameKo}</p>
                      <p className="text-sm text-[var(--muted)]">{move.nameEn}</p>
                    </div>
                    <Badge tone="type">{move.type}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {move.category}
                    {move.power ? ` / 위력 ${move.power}` : ""}
                    {move.accuracy ? ` / 명중 ${move.accuracy}` : ""}
                  </p>
                </div>
              ))}
            </div>
          </InfoCard>

          <InfoCard title="운영법" description={entry.usageKo} />
          <InfoCard title="카운터" description={entry.countersKo} />
        </div>

        <div className="grid gap-4 self-start">
          <InfoCard title="노력치">
            <div className="grid gap-3">
              {(Object.entries(entry.evs) as [keyof typeof entry.evs, number][]).map(([key, value]) => (
                <div
                  className="grid grid-cols-[72px_minmax(0,1fr)_44px] items-center gap-3"
                  key={key}
                >
                  <span className="text-sm font-semibold text-[var(--muted)]">
                    {statLabels[key]}
                  </span>
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--chip)]">
                    <div
                      className="h-full rounded-full bg-[var(--support)]"
                      style={{ width: `${Math.round((value / 252) * 100)}%` }}
                    />
                  </div>
                  <span className="text-right text-sm font-bold">{value}</span>
                </div>
              ))}
            </div>
            {pokemonEntry ? (
              <Link
                className="mt-4 inline-flex rounded-md border border-[var(--panel-border)] px-3 py-2 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--chip)]"
                href={`/speed-tiers?pokemon=${pokemonEntry.id}`}
              >
                스피드 티어에서 비교
              </Link>
            ) : null}
          </InfoCard>
        </div>
      </section>
    </AppShell>
  );
}
