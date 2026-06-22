"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  FilterBar,
  InfoCard,
  SearchField,
  Tabs,
  ThreeColumnLayout
} from "../_components/design-system";
import { buildTeamWeaknessSummary, type TeamTypeSummary } from "../_lib/type-matchups";

type PokemonEntry = {
  id: string;
  nameKo: string;
  nameEn: string;
  types: string[];
  baseStats: {
    hp: number;
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
    speed: number;
  };
};

type MoveEntry = {
  id: string;
  nameKo: string | null;
  nameEn: string;
  type: string;
  category: string;
};

type TeamBuilderProps = {
  checkedAt: string;
  learnsets: Record<string, string[]>;
  moves: MoveEntry[];
  pokemon: PokemonEntry[];
};

type TeamSlot = {
  pokemonId: string;
  moveIds: string[];
} | null;

const storageKey = "pokemon-central-team-builder";
const shareQueryKey = "team";
const shareMovesQueryKey = "moves";
const emptyTeam: TeamSlot[] = [null, null, null, null, null, null];

function getRoleTags(entry: PokemonEntry) {
  const tags = new Set<string>();
  const stats = entry.baseStats;

  if (stats.speed >= 100) {
    tags.add("고속");
  }
  if (stats.attack >= 105) {
    tags.add("물리 화력");
  }
  if (stats.specialAttack >= 105) {
    tags.add("특수 화력");
  }
  if (stats.hp + stats.defense + stats.specialDefense >= 285) {
    tags.add("내구");
  }
  if (entry.types.includes("Steel") || entry.types.includes("Fairy")) {
    tags.add("방어 축");
  }
  if (entry.types.includes("Flying") || entry.types.includes("Ghost")) {
    tags.add("무효 보완");
  }

  return Array.from(tags).slice(0, 3);
}

function normalizeMoveIds(value: unknown, validMoveIds: Set<string>) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value.filter(
        (moveId): moveId is string =>
          typeof moveId === "string" && validMoveIds.has(moveId)
      )
    )
  ).slice(0, 4);
}

function readStoredTeam(
  validIds: Set<string>,
  validMoveIdsByPokemon: Map<string, Set<string>>
) {
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) {
      return emptyTeam;
    }

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      return emptyTeam;
    }

    return emptyTeam.map((_, index) => {
      const value = parsed[index];
      if (typeof value === "string" && validIds.has(value)) {
        return { pokemonId: value, moveIds: [] };
      }
      if (
        typeof value === "object" &&
        value !== null &&
        "pokemonId" in value &&
        typeof value.pokemonId === "string" &&
        validIds.has(value.pokemonId)
      ) {
        return {
          pokemonId: value.pokemonId,
          moveIds: normalizeMoveIds(
            "moveIds" in value ? value.moveIds : [],
            validMoveIdsByPokemon.get(value.pokemonId) ?? new Set()
          )
        };
      }
      return null;
    });
  } catch {
    return emptyTeam;
  }
}

function readSharedTeam(
  validIds: Set<string>,
  validMoveIdsByPokemon: Map<string, Set<string>>
) {
  const params = new URLSearchParams(window.location.search);
  const sharedTeam = params.get(shareQueryKey);

  if (sharedTeam === null) {
    return null;
  }

  const slots = sharedTeam.split(",").slice(0, emptyTeam.length);
  const sharedMoveSlots = (params.get(shareMovesQueryKey) ?? "").split(";");

  return emptyTeam.map((_, index) => {
    const value = slots[index];
    if (!value || !validIds.has(value)) {
      return null;
    }
    return {
      pokemonId: value,
      moveIds: normalizeMoveIds(
        sharedMoveSlots[index]?.split(",") ?? [],
        validMoveIdsByPokemon.get(value) ?? new Set()
      )
    };
  });
}

function clearSharedTeamFromAddress() {
  const url = new URL(window.location.href);

  if (!url.searchParams.has(shareQueryKey)) {
    return;
  }

  url.searchParams.delete(shareQueryKey);
  url.searchParams.delete(shareMovesQueryKey);
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}

export function TeamBuilder({ checkedAt, learnsets, moves, pokemon }: TeamBuilderProps) {
  const [query, setQuery] = useState("");
  const [selectedType, setSelectedType] = useState("전체");
  const [team, setTeam] = useState<TeamSlot[]>(emptyTeam);
  const [isHydrated, setIsHydrated] = useState(false);
  const [shareStatus, setShareStatus] = useState("");

  const pokemonById = useMemo(() => new Map(pokemon.map((entry) => [entry.id, entry])), [pokemon]);
  const moveById = useMemo(() => new Map(moves.map((entry) => [entry.id, entry])), [moves]);
  const validIds = useMemo(() => new Set(pokemon.map((entry) => entry.id)), [pokemon]);
  const validMoveIdsByPokemon = useMemo(
    () =>
      new Map(
        Object.entries(learnsets).map(([pokemonId, moveIds]) => [
          pokemonId,
          new Set(moveIds.filter((moveId) => moveById.has(moveId)))
        ])
      ),
    [learnsets, moveById]
  );
  const selectedPokemon = useMemo(
    () =>
      team.flatMap((slot) =>
        slot ? [pokemonById.get(slot.pokemonId)].filter(Boolean) : []
      ) as PokemonEntry[],
    [pokemonById, team]
  );
  const types = useMemo(
    () => ["전체", ...Array.from(new Set(pokemon.flatMap((entry) => entry.types))).sort()],
    [pokemon]
  );
  const filteredPokemon = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return pokemon
      .filter((entry) => selectedType === "전체" || entry.types.includes(selectedType))
      .filter((entry) => {
        if (!normalizedQuery) {
          return true;
        }

        return (
          entry.nameKo.includes(query.trim()) ||
          entry.nameEn.toLowerCase().includes(normalizedQuery)
        );
      });
  }, [pokemon, query, selectedType]);
  const weaknessSummary = useMemo<TeamTypeSummary[]>(
    () => buildTeamWeaknessSummary(selectedPokemon),
    [selectedPokemon]
  );
  const roleSummary = useMemo(() => {
    const counts = new Map<string, number>();
    selectedPokemon.flatMap(getRoleTags).forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1));
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [selectedPokemon]);

  useEffect(() => {
    const sharedTeam = readSharedTeam(validIds, validMoveIdsByPokemon);

    setTeam(sharedTeam ?? readStoredTeam(validIds, validMoveIdsByPokemon));
    if (sharedTeam) {
      setShareStatus("공유 링크에서 팀을 불러왔습니다.");
    }
    setIsHydrated(true);
  }, [validIds, validMoveIdsByPokemon]);

  useEffect(() => {
    if (isHydrated) {
      window.localStorage.setItem(storageKey, JSON.stringify(team));
    }
  }, [isHydrated, team]);

  function addPokemon(id: string) {
    setShareStatus("");
    clearSharedTeamFromAddress();
    setTeam((currentTeam) => {
      const openIndex = currentTeam.findIndex((slot) => slot === null);
      if (openIndex === -1) {
        return currentTeam;
      }

      return currentTeam.map((slot, index) =>
        index === openIndex ? { pokemonId: id, moveIds: [] } : slot
      );
    });
  }

  function updateSlotMove(slotIndex: number, moveIndex: number, moveId: string) {
    setShareStatus("");
    clearSharedTeamFromAddress();
    setTeam((currentTeam) =>
      currentTeam.map((slot, index) => {
        if (index !== slotIndex || !slot) {
          return slot;
        }
        if (moveId === "") {
          return { ...slot, moveIds: slot.moveIds.slice(0, moveIndex) };
        }
        const validMoveIds = validMoveIdsByPokemon.get(slot.pokemonId);
        if (!validMoveIds?.has(moveId)) {
          return slot;
        }
        const nextMoveIds = slot.moveIds.slice(0, moveIndex);
        if (!nextMoveIds.includes(moveId)) {
          nextMoveIds[moveIndex] = moveId;
        }
        return { ...slot, moveIds: nextMoveIds };
      })
    );
  }

  function removeSlot(slotIndex: number) {
    setShareStatus("");
    clearSharedTeamFromAddress();
    setTeam((currentTeam) => currentTeam.map((slot, index) => (index === slotIndex ? null : slot)));
  }

  function resetTeam() {
    setShareStatus("");
    clearSharedTeamFromAddress();
    setTeam(emptyTeam);
  }

  async function copyShareLink() {
    const url = new URL(window.location.href);
    url.searchParams.set(
      shareQueryKey,
      team.map((slot) => slot?.pokemonId ?? "").join(",")
    );
    url.searchParams.set(
      shareMovesQueryKey,
      team.map((slot) => slot?.moveIds.join(",") ?? "").join(";")
    );
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);

    if (!navigator.clipboard) {
      setShareStatus("공유 링크를 주소창에 표시했습니다. 주소를 직접 복사해 주세요.");
      return;
    }

    try {
      await navigator.clipboard.writeText(url.toString());
      setShareStatus("팀 공유 링크를 복사했습니다.");
    } catch {
      setShareStatus("복사 권한을 사용할 수 없어 주소창에 공유 링크를 표시했습니다.");
    }
  }

  return (
    <ThreeColumnLayout
      left={
        <InfoCard title="검색">
          <div className="grid gap-5">
            <SearchField
              label="포켓몬 검색"
              onChange={setQuery}
              placeholder="예: 피카츄, Pikachu"
              value={query}
            />
            <FilterBar
              label="타입"
              onSelect={setSelectedType}
              options={types.map((type) => ({
                label: type,
                active: type === selectedType
              }))}
            />
          </div>
        </InfoCard>
      }
      center={
        <div className="grid gap-4">
          <div className="lg:hidden">
            <InfoCard
              description="모바일에서는 포켓몬 추가, 슬롯 확인, 약점 요약 조회를 우선 지원합니다. 긴 후보 비교와 반복 편집은 데스크탑 화면이 더 적합합니다."
              title="모바일 팀빌더 안내"
            />
          </div>

          <Tabs
            items={[
              { label: `팀 ${selectedPokemon.length}/6`, active: true },
              { label: `후보 ${filteredPokemon.length}` }
            ]}
          />

          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {team.map((slot, index) => {
              const entry = slot ? pokemonById.get(slot.pokemonId) : null;
              const learnableMoves = entry
                ? (learnsets[entry.id] ?? [])
                    .map((moveId) => moveById.get(moveId))
                    .filter((move): move is MoveEntry => Boolean(move))
                    .sort((left, right) =>
                      (left.nameKo ?? left.nameEn).localeCompare(
                        right.nameKo ?? right.nameEn,
                        "ko"
                      )
                    )
                : [];

              return (
                <div
                  className="min-h-40 rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-4"
                  key={index}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
                      Slot {index + 1}
                    </span>
                    {entry ? (
                      <button
                        className="rounded-md border border-[var(--panel-border)] px-2 py-1 text-xs font-bold text-[var(--muted)] hover:bg-[var(--chip)] hover:text-[var(--foreground)]"
                        onClick={() => removeSlot(index)}
                        type="button"
                      >
                        제거
                      </button>
                    ) : null}
                  </div>
                  {entry ? (
                    <div className="mt-4 grid gap-3">
                      <div>
                        <h2 className="text-lg font-bold text-[var(--foreground)]">{entry.nameKo}</h2>
                        <p className="text-sm text-[var(--muted)]">{entry.nameEn}</p>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {entry.types.map((type) => (
                          <Badge key={type} tone="type">
                            {type}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {getRoleTags(entry).map((role) => (
                          <Badge key={role} tone="support">
                            {role}
                          </Badge>
                        ))}
                      </div>
                      <div className="grid gap-2 border-t border-[var(--panel-border)] pt-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-bold text-[var(--muted)]">기술 선택</p>
                          <Badge tone="warning">{slot?.moveIds.length ?? 0}/4</Badge>
                        </div>
                        {Array.from({ length: 4 }, (_, moveIndex) => {
                          const selectedMoveId = slot?.moveIds[moveIndex] ?? "";
                          const previousMoveSelected =
                            moveIndex === 0 || Boolean(slot?.moveIds[moveIndex - 1]);

                          return (
                            <select
                              aria-label={`${entry.nameKo} 기술 ${moveIndex + 1}`}
                              className="h-10 w-full rounded-md border border-[var(--panel-border)] bg-white px-2 text-sm outline-none focus:border-[var(--support)] disabled:bg-[var(--chip)] disabled:text-[var(--muted)]"
                              disabled={!previousMoveSelected}
                              key={moveIndex}
                              onChange={(event) =>
                                updateSlotMove(index, moveIndex, event.target.value)
                              }
                              value={selectedMoveId}
                            >
                              <option value="">기술 {moveIndex + 1} 선택</option>
                              {learnableMoves.map((move) => (
                                <option
                                  disabled={
                                    slot?.moveIds.some(
                                      (moveId, selectedIndex) =>
                                        selectedIndex !== moveIndex && moveId === move.id
                                    )
                                  }
                                  key={move.id}
                                  value={move.id}
                                >
                                  {move.nameKo ?? move.nameEn} · {move.type} · {move.category}
                                </option>
                              ))}
                            </select>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-8 text-sm font-semibold text-[var(--muted)]">
                      검색 결과에서 포켓몬을 추가하세요.
                    </div>
                  )}
                </div>
              );
            })}
          </section>

          <InfoCard
            description="검색 결과의 추가 버튼을 누르면 가장 앞의 빈 슬롯에 들어갑니다."
            title="후보 목록"
          >
            <div className="grid max-h-[520px] gap-2 overflow-y-auto pr-1">
              {filteredPokemon.map((entry) => {
                const teamIsFull = selectedPokemon.length >= 6;

                return (
                  <div
                    className="grid gap-3 rounded-md border border-[var(--panel-border)] p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                    key={entry.id}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold">{entry.nameKo}</span>
                        <span className="text-sm text-[var(--muted)]">{entry.nameEn}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {entry.types.map((type) => (
                          <Badge key={type} tone="type">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <button
                      className="h-10 rounded-md bg-[var(--support)] px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-[var(--panel-border)] disabled:text-[var(--muted)]"
                      disabled={teamIsFull}
                      onClick={() => addPokemon(entry.id)}
                      type="button"
                    >
                      추가
                    </button>
                  </div>
                );
              })}
            </div>
          </InfoCard>
        </div>
      }
      right={
        <div className="grid gap-4">
          <InfoCard
            description={`Regulation M-B · ${checkedAt} 확인. Serebii Champions Pokédex 기반 검토 후보이며 패치에 따라 달라질 수 있습니다.`}
            title="학습 기술 데이터"
          >
            <Badge tone="warning">포켓몬별 최대 4개 선택</Badge>
          </InfoCard>

          <InfoCard
            action={{ href: "/type-chart", label: "상성표" }}
            title="약점 요약"
          >
            <div className="grid gap-3">
              {weaknessSummary.slice(0, 8).map((item) => {
                const barWidth = selectedPokemon.length === 0 ? 0 : (item.weakCount / selectedPokemon.length) * 100;

                return (
                  <div key={item.type}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-bold">{item.type}</span>
                      <span className="text-[var(--muted)]">
                        약점 {item.weakCount} / 반감 {item.resistCount} / 무효 {item.immuneCount}
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--chip)]">
                      <div
                        className="h-full bg-[var(--accent)]"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </InfoCard>

          <InfoCard title="역할 태그">
            {roleSummary.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {roleSummary.map(([role, count]) => (
                  <Badge key={role} tone="success">
                    {role} {count}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm font-semibold text-[var(--muted)]">팀을 추가하면 역할 분포가 표시됩니다.</p>
            )}
          </InfoCard>

          <div className="grid gap-2">
            <button
              className="h-11 rounded-md bg-[var(--support)] px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-[var(--panel-border)] disabled:text-[var(--muted)]"
              disabled={selectedPokemon.length === 0}
              onClick={copyShareLink}
              type="button"
            >
              팀 공유 링크 복사
            </button>
            <button
              className="h-11 rounded-md border border-[var(--panel-border)] bg-white px-4 text-sm font-bold text-[var(--foreground)] hover:bg-[var(--chip)]"
              onClick={resetTeam}
              type="button"
            >
              팀 초기화
            </button>
            {shareStatus ? (
              <p aria-live="polite" className="text-sm font-semibold text-[var(--muted)]">
                {shareStatus}
              </p>
            ) : null}
          </div>
        </div>
      }
    />
  );
}
