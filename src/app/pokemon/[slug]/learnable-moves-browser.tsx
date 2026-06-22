"use client";

import { useMemo, useState } from "react";
import { Badge, FilterBar, SearchField } from "../../_components/design-system";

export type LearnableMove = {
  id: string;
  nameKo: string | null;
  nameEn: string;
  type: string;
  category: string;
  power: number | null;
  accuracy: number | null;
  pp: number;
};

type LearnableMovesBrowserProps = {
  checkedAt: string;
  moves: LearnableMove[];
  sourceUrl: string;
};

function getDisplayName(move: LearnableMove) {
  return move.nameKo ?? move.nameEn;
}

export function LearnableMovesBrowser({
  checkedAt,
  moves,
  sourceUrl
}: LearnableMovesBrowserProps) {
  const [query, setQuery] = useState("");
  const [selectedType, setSelectedType] = useState("전체");
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const types = useMemo(
    () => ["전체", ...Array.from(new Set(moves.map((move) => move.type))).sort()],
    [moves]
  );
  const categories = useMemo(
    () => ["전체", ...Array.from(new Set(moves.map((move) => move.category))).sort()],
    [moves]
  );
  const filteredMoves = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return moves.filter((move) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        move.nameEn.toLowerCase().includes(normalizedQuery) ||
        move.nameKo?.includes(query.trim());
      return (
        matchesQuery &&
        (selectedType === "전체" || move.type === selectedType) &&
        (selectedCategory === "전체" || move.category === selectedCategory)
      );
    });
  }, [moves, query, selectedCategory, selectedType]);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="warning">검토 후보</Badge>
        <span className="text-xs font-semibold text-[var(--muted)]">
          Regulation M-B · {checkedAt} 확인 · {moves.length}개
        </span>
        <a
          className="text-xs font-bold text-[var(--support-strong)] hover:underline"
          href={sourceUrl}
          rel="noreferrer"
          target="_blank"
        >
          원문
        </a>
      </div>

      <SearchField
        label="기술 검색"
        onChange={setQuery}
        placeholder="예: 지진, Earthquake"
        value={query}
      />
      <FilterBar
        label="분류"
        onSelect={setSelectedCategory}
        options={categories.map((category) => ({
          label: category,
          active: category === selectedCategory
        }))}
      />
      <FilterBar
        label="타입"
        onSelect={setSelectedType}
        options={types.map((type) => ({
          label: type,
          active: type === selectedType
        }))}
      />

      <p className="text-sm font-semibold text-[var(--muted)]">
        검색 결과 {filteredMoves.length}개
      </p>
      <div className="grid max-h-[640px] gap-2 overflow-y-auto pr-1">
        {filteredMoves.map((move) => (
          <div
            className="rounded-md border border-[var(--panel-border)] bg-white p-3"
            key={move.id}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-bold text-[var(--foreground)]">{getDisplayName(move)}</p>
                <p className="text-xs text-[var(--muted)]">{move.nameEn}</p>
              </div>
              <div className="flex flex-wrap gap-1">
                <Badge tone="type">{move.type}</Badge>
                <Badge>{move.category}</Badge>
              </div>
            </div>
            <p className="mt-2 text-sm text-[var(--muted)]">
              위력 {move.power ?? "-"} · 명중 {move.accuracy ?? "-"} · PP {move.pp}
            </p>
          </div>
        ))}
        {filteredMoves.length === 0 ? (
          <p className="rounded-md border border-dashed border-[var(--panel-border)] p-4 text-sm text-[var(--muted)]">
            조건에 맞는 기술이 없습니다.
          </p>
        ) : null}
      </div>
    </div>
  );
}
