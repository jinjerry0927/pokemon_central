import Link from "next/link";
import { notFound } from "next/navigation";
import builds from "../../../../data/builds.json";
import moves from "../../../../data/moves.json";
import pokemon from "../../../../data/pokemon.json";
import { AppShell, Badge, InfoCard, PageHeader } from "../../_components/design-system";

type PokemonRoute = {
  params: Promise<{
    slug: string;
  }>;
};

type StatKey = keyof (typeof pokemon)[number]["baseStats"];

const statLabels: Record<StatKey, string> = {
  hp: "HP",
  attack: "공격",
  defense: "방어",
  specialAttack: "특공",
  specialDefense: "특방",
  speed: "스피드"
};

export const dynamicParams = false;

export function generateStaticParams() {
  return pokemon.map((entry) => ({
    slug: entry.id
  }));
}

function formatId(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function PokemonDetailPage({ params }: PokemonRoute) {
  const { slug } = await params;
  const entry = pokemon.find((item) => item.id === slug);

  if (!entry) {
    notFound();
  }

  const relatedBuilds = builds.filter((build) => build.pokemonId === entry.id);
  const keyMoves = entry.keyMoveIds
    .map((moveId) => moves.find((move) => move.id === moveId))
    .filter((move): move is (typeof moves)[number] => Boolean(move));
  const title = `${entry.nameKo} / ${entry.nameEn}`;

  return (
    <AppShell>
      <PageHeader
        aside={
          <InfoCard description={entry.championsAvailability.evidence} title="데이터 상태">
            <Badge tone="warning">
              {entry.publishStatus === "mvp-sample"
                ? "MVP 샘플"
                : entry.championsAvailability.status}
            </Badge>
          </InfoCard>
        }
        description={entry.championsNotes}
        eyebrow="Pokemon Detail"
        title={title}
      />

      <section className="mx-auto grid max-w-7xl gap-4 px-6 py-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:px-10">
        <div className="grid gap-4">
          <InfoCard title="기본 정보">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-semibold text-[var(--muted)]">타입</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {entry.types.map((type) => (
                    <Badge key={type} tone="type">
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--muted)]">특성</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {entry.abilities.map((ability) => (
                    <Badge key={ability}>{formatId(ability)}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </InfoCard>

          <InfoCard title="종족값">
            <div className="grid gap-3">
              {(Object.entries(entry.baseStats) as [StatKey, number][]).map(([key, value]) => (
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
                      style={{ width: `${Math.min(100, Math.round((value / 160) * 100))}%` }}
                    />
                  </div>
                  <span className="text-right text-sm font-bold">{value}</span>
                </div>
              ))}
            </div>
          </InfoCard>
        </div>

        <div className="grid gap-4">
          <InfoCard title="주요 기술">
            <div className="grid gap-3">
              {keyMoves.map((move) => (
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

          <InfoCard title="추천 빌드">
            {relatedBuilds.length > 0 ? (
              <div className="grid gap-3">
                {relatedBuilds.map((build) => (
                  <Link
                    className="rounded-lg border border-[var(--panel-border)] bg-white p-3 hover:bg-[var(--chip)]"
                    href={`/builds/${build.id}`}
                    key={build.id}
                  >
                    <p className="font-bold">{build.titleKo}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {build.roleTags.map(formatId).join(" / ")}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm leading-6 text-[var(--muted)]">
                이 포켓몬의 추천 빌드는 Phase I에서 추가합니다.
              </p>
            )}
          </InfoCard>
        </div>
      </section>
    </AppShell>
  );
}
