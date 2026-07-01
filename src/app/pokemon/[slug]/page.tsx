import Link from "next/link";
import { notFound } from "next/navigation";
import builds from "../../../../data/builds.json";
import championsAbilities from "../../../../data/generated/champions-abilities-m-b.json";
import championsItems from "../../../../data/generated/champions-items-m-b.json";
import moveCandidates from "../../../../data/generated/moves-m-b-candidates.json";
import learnsets from "../../../../data/generated/serebii-learnsets-m-b.json";
import usageInsights from "../../../../data/generated/usage-insights-m-b.json";
import moves from "../../../../data/moves.json";
import pokemon from "../../../../data/pokemon.json";
import {
  AppShell,
  Badge,
  InfoCard,
  PageHeader,
  ThreeColumnLayout
} from "../../_components/design-system";
import { createPageMetadata } from "../../_lib/seo";
import { formatMultiplier, getDefensiveProfile } from "../../_lib/type-matchups";
import { LearnableMovesBrowser } from "./learnable-moves-browser";

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

type UsageListItem = {
  id: string;
  label: string;
  usagePercent: number;
  meta?: string;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return pokemon.map((entry) => ({
    slug: entry.id
  }));
}

export async function generateMetadata({ params }: PokemonRoute) {
  const { slug } = await params;
  const entry = pokemon.find((item) => item.id === slug);

  if (!entry) {
    return createPageMetadata({
      title: "포켓몬 상세",
      description: "Pokemon Champions 포켓몬 상세 정보를 확인합니다.",
      path: `/pokemon/${slug}`
    });
  }

  return createPageMetadata({
    title: `${entry.nameKo} / ${entry.nameEn}`,
    description: entry.championsNotes,
    path: `/pokemon/${entry.id}`
  });
}

function formatId(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatUsagePercent(value: number) {
  return `${Number.isInteger(value) ? value : value.toFixed(1)}%`;
}

function UsageTopList({ items }: { items: UsageListItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-[var(--muted)]">표시할 사용률 데이터가 없습니다.</p>;
  }

  return (
    <div className="grid gap-2">
      {items.map((item) => (
        <div
          className="grid grid-cols-[minmax(0,1fr)_56px] items-center gap-3 rounded-md border border-[var(--panel-border)] bg-white px-3 py-2"
          key={item.id}
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{item.label}</p>
            {item.meta ? (
              <p className="mt-1 truncate text-xs text-[var(--muted)]">{item.meta}</p>
            ) : null}
          </div>
          <span className="text-right text-sm font-bold text-[var(--support-strong)]">
            {formatUsagePercent(item.usagePercent)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default async function PokemonDetailPage({ params }: PokemonRoute) {
  const { slug } = await params;
  const entry = pokemon.find((item) => item.id === slug);

  if (!entry) {
    notFound();
  }

  const relatedBuilds = builds.filter((build) => build.pokemonId === entry.id);
  const abilityById = new Map(
    championsAbilities.abilities.map((ability) => [ability.id, ability])
  );
  const itemById = new Map(championsItems.entries.map((item) => [item.id, item]));
  const keyMoves = entry.keyMoveIds
    .map((moveId) => moves.find((move) => move.id === moveId))
    .filter((move): move is (typeof moves)[number] => Boolean(move));
  const learnsetEntry = learnsets.entries.find((item) => item.pokemonId === entry.id);
  const moveCandidatesById = new Map(
    moveCandidates.entries.map((move) => [move.id, move])
  );
  const usageEntry = usageInsights.entries.find((item) => item.pokemonId === entry.id);
  const topUsageMoves =
    usageEntry?.moves.slice(0, 5).map((move) => {
      const moveDetail = moveCandidatesById.get(move.moveId);

      return {
        id: move.moveId,
        label: moveDetail?.nameKo ?? formatId(move.moveId),
        meta: moveDetail?.nameEn,
        usagePercent: move.usagePercent
      };
    }) ?? [];
  const topUsageAbilities =
    usageEntry?.abilities.slice(0, 3).map((ability) => {
      const abilityDetail = abilityById.get(ability.abilityId);

      return {
        id: ability.abilityId,
        label: abilityDetail?.nameKo ?? formatId(ability.abilityId),
        meta: abilityDetail?.nameEn,
        usagePercent: ability.usagePercent
      };
    }) ?? [];
  const topUsageItems =
    usageEntry?.items.slice(0, 3).map((item) => {
      const itemDetail = itemById.get(item.itemId);

      return {
        id: item.itemId,
        label: itemDetail?.nameKo ?? formatId(item.itemId),
        meta: itemDetail?.nameEn,
        usagePercent: item.usagePercent
      };
    }) ?? [];
  const topUsageNatures =
    usageEntry?.natureModifiers.slice(0, 3).map((nature) => ({
      id: nature.labelKo,
      label: nature.labelKo,
      usagePercent: nature.usagePercent
    })) ?? [];
  const topUsageStatSpreads =
    usageEntry?.statPointSpreads.slice(0, 3).map((spread) => ({
      id: spread.label,
      label: spread.label,
      usagePercent: spread.usagePercent
    })) ?? [];
  const learnableMoves = (learnsetEntry?.serebiiMoveIds ?? [])
    .map((moveId) => moveCandidatesById.get(moveId))
    .filter((move): move is (typeof moveCandidates.entries)[number] => Boolean(move))
    .sort((left, right) =>
      (left.nameKo ?? left.nameEn).localeCompare(right.nameKo ?? right.nameEn, "ko")
    );
  const defensiveProfile = getDefensiveProfile(entry.types);
  const defensiveWeaknesses = defensiveProfile.filter((item) => item.multiplier > 1);
  const defensiveResists = defensiveProfile.filter((item) => item.multiplier > 0 && item.multiplier < 1);
  const defensiveImmunities = defensiveProfile.filter((item) => item.multiplier === 0);
  const title = `${entry.nameKo} / ${entry.nameEn}`;
  const primaryDamageMove = keyMoves.find((move) => move.power);

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

      <ThreeColumnLayout
        left={
          <div className="grid gap-4">
            <InfoCard title="기본 정보">
              <div className="grid gap-4">
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
                      <Badge key={ability}>
                        {abilityById.get(ability)?.nameKo ?? formatId(ability)}
                      </Badge>
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
        }
        center={
          <div className="grid gap-4">
            <InfoCard title="주요 기술">
              {keyMoves.length > 0 ? (
                <div className="grid gap-3">
                  {keyMoves.map((move) => (
                  <Link
                    className="rounded-lg border border-[var(--panel-border)] bg-white p-3 hover:bg-[var(--chip)]"
                    href={`/calculator?attacker=${entry.id}&move=${move.id}`}
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
                    <p className="mt-2 text-xs font-bold text-[var(--support-strong)]">
                      계산기로 확인
                    </p>
                  </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm leading-6 text-[var(--muted)]">
                  주요 기술은 메타 검토 후 별도로 선정합니다.
                </p>
              )}
            </InfoCard>

            <InfoCard
              description={`${usageInsights.regulationId} ${usageInsights.source.description} 이 수치는 많이 쓰이는 선택지를 보여주며 정답 빌드를 의미하지 않습니다.`}
              title="사용률 인사이트"
            >
              {usageEntry ? (
                <div className="grid gap-4">
                  <div>
                    <p className="mb-2 text-sm font-semibold text-[var(--muted)]">
                      많이 쓰는 기술 Top
                    </p>
                    <UsageTopList items={topUsageMoves} />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="mb-2 text-sm font-semibold text-[var(--muted)]">
                        많이 쓰는 특성 Top
                      </p>
                      <UsageTopList items={topUsageAbilities} />
                    </div>
                    <div>
                      <p className="mb-2 text-sm font-semibold text-[var(--muted)]">
                        많이 쓰는 도구 Top
                      </p>
                      <UsageTopList items={topUsageItems} />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="mb-2 text-sm font-semibold text-[var(--muted)]">
                        많이 쓰는 능력보정 Top
                      </p>
                      <UsageTopList items={topUsageNatures} />
                    </div>
                    <div>
                      <p className="mb-2 text-sm font-semibold text-[var(--muted)]">
                        많이 쓰는 HABCDS 스탯 분배 Top
                      </p>
                      <UsageTopList items={topUsageStatSpreads} />
                    </div>
                  </div>
                  <p className="text-xs leading-5 text-[var(--muted)]">
                    데이터 확인일: {usageInsights.checkedAt}. 시즌과 집계 방식에 따라 수치가
                    달라질 수 있습니다.
                  </p>
                </div>
              ) : (
                <p className="text-sm leading-6 text-[var(--muted)]">
                  이 포켓몬의 사용률 인사이트는 아직 생성된 스냅샷에 없습니다.
                </p>
              )}
            </InfoCard>

            <InfoCard
              description="현재 Serebii Champions Pokédex에서 확인한 학습 가능 기술 후보입니다. 게임 내 변경과 시즌 패치에 따라 달라질 수 있습니다."
              title={`학습 가능 기술 ${learnableMoves.length}개`}
            >
              {learnsetEntry ? (
                <LearnableMovesBrowser
                  checkedAt={learnsets.checkedAt}
                  moves={learnableMoves}
                  sourceUrl={learnsetEntry.pageUrl}
                />
              ) : (
                <p className="text-sm text-[var(--muted)]">학습 기술 데이터가 없습니다.</p>
              )}
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
        }
        right={
          <div className="grid gap-4">
            <InfoCard
              action={{
                href: primaryDamageMove
                  ? `/calculator?attacker=${entry.id}&move=${primaryDamageMove.id}`
                  : `/calculator?attacker=${entry.id}`,
                label: "계산기"
              }}
              description="상세를 보면서 바로 데미지 계산, 스피드 비교, 상성 확인으로 이동합니다."
              title="빠른 도구"
            >
              <div className="grid gap-2 text-sm font-semibold">
                <Link
                  className="rounded-md border border-[var(--panel-border)] bg-white px-3 py-2 hover:bg-[var(--chip)]"
                  href={`/speed-tiers?pokemon=${entry.id}`}
                >
                  스피드 티어에서 비교
                </Link>
                <Link
                  className="rounded-md border border-[var(--panel-border)] bg-white px-3 py-2 hover:bg-[var(--chip)]"
                  href="/teams"
                >
                  팀빌더에서 약점 점검
                </Link>
                <Link
                  className="rounded-md border border-[var(--panel-border)] bg-white px-3 py-2 hover:bg-[var(--chip)]"
                  href="/type-chart"
                >
                  타입 상성표 열기
                </Link>
              </div>
            </InfoCard>

            <InfoCard action={{ href: "/type-chart", label: "상성표" }} title="방어 상성">
              <div className="grid gap-4">
                <div>
                  <p className="text-sm font-semibold text-[var(--muted)]">약점</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {defensiveWeaknesses.map((item) => (
                      <Badge key={item.type} tone="warning">
                        {item.type} {formatMultiplier(item.multiplier)}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--muted)]">반감 / 무효</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {defensiveResists.slice(0, 8).map((item) => (
                      <Badge key={item.type} tone="success">
                        {item.type} {formatMultiplier(item.multiplier)}
                      </Badge>
                    ))}
                    {defensiveImmunities.map((item) => (
                      <Badge key={item.type}>{item.type} 0x</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </InfoCard>
          </div>
        }
      />
    </AppShell>
  );
}
