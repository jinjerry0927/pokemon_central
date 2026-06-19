"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Badge,
  DataTable,
  FilterBar,
  InfoCard,
  SearchField,
  Tabs,
  ThreeColumnLayout,
  type DataTableColumn
} from "../_components/design-system";

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
  championsAvailability: {
    status: string;
  };
  publishStatus: string;
};

type PokemonTableRow = {
  id: string;
  name: string;
  nameKo: string;
  nameEn: string;
  types: string[];
  status: string;
  speed: number;
};

type PokedexBrowserProps = {
  pokemon: PokemonEntry[];
};

const columns: DataTableColumn<PokemonTableRow>[] = [
  {
    key: "name",
    label: "포켓몬",
    render: (value, row) => (
      <Link
        className="font-bold text-[var(--support-strong)] hover:underline"
        href={`/pokemon/${row.id}`}
      >
        {String(value)}
      </Link>
    )
  },
  {
    key: "types",
    label: "타입",
    render: (value) => (
      <div className="flex flex-wrap gap-1">
        {(value as string[]).map((type) => (
          <Badge key={type} tone="type">
            {type}
          </Badge>
        ))}
      </div>
    )
  },
  {
    key: "status",
    label: "공개 상태",
    render: (value) => <Badge tone="warning">{String(value)}</Badge>
  },
  { key: "speed", label: "스피드", align: "right" }
];

export function PokedexBrowser({ pokemon }: PokedexBrowserProps) {
  const [query, setQuery] = useState("");
  const [selectedType, setSelectedType] = useState("전체");

  const types = useMemo(
    () => ["전체", ...Array.from(new Set(pokemon.flatMap((entry) => entry.types))).sort()],
    [pokemon]
  );

  const rows = useMemo<PokemonTableRow[]>(() => {
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
      })
      .map((entry) => ({
        id: entry.id,
        name: `${entry.nameKo} / ${entry.nameEn}`,
        nameKo: entry.nameKo,
        nameEn: entry.nameEn,
        types: entry.types,
        status: entry.publishStatus === "mvp-sample" ? "MVP 샘플" : entry.championsAvailability.status,
        speed: entry.baseStats.speed
      }));
  }, [pokemon, query, selectedType]);

  const selectedPokemon = rows[0];

  return (
    <ThreeColumnLayout
      left={
        <InfoCard title="필터">
          <div className="grid gap-5">
            <SearchField
              label="이름 검색"
              onChange={setQuery}
              placeholder="예: 리자몽, Charizard"
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
          <Tabs
            items={[
              { label: `전체 ${pokemon.length}`, active: true },
              { label: `결과 ${rows.length}` }
            ]}
          />
          {rows.length > 0 ? (
            <>
              <div className="grid gap-3 sm:hidden">
                {rows.map((row) => (
                  <Link
                    className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-4"
                    href={`/pokemon/${row.id}`}
                    key={row.id}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="text-base font-bold text-[var(--support-strong)]">
                          {row.nameKo}
                        </h2>
                        <p className="mt-1 text-sm text-[var(--muted)]">{row.nameEn}</p>
                      </div>
                      <Badge tone="warning">{row.status}</Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {row.types.map((type) => (
                        <Badge key={type} tone="type">
                          {type}
                        </Badge>
                      ))}
                    </div>
                    <p className="mt-3 text-sm font-semibold text-[var(--muted)]">
                      스피드 {row.speed}
                    </p>
                  </Link>
                ))}
              </div>
              <div className="hidden sm:block">
                <DataTable columns={columns} rows={rows} />
              </div>
            </>
          ) : (
            <InfoCard
              description="검색어를 줄이거나 타입 필터를 전체로 바꾸면 다시 결과를 볼 수 있습니다."
              title="검색 결과 없음"
            />
          )}
        </div>
      }
      right={
        selectedPokemon ? (
          <InfoCard
            action={{ href: `/pokemon/${selectedPokemon.id}`, label: "상세" }}
            description="현재 필터 결과의 첫 항목입니다. 목록의 이름을 눌러도 상세로 이동합니다."
            title="빠른 요약"
          >
            <div className="grid gap-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[var(--muted)]">이름</span>
                <span className="text-right font-bold">{selectedPokemon.nameKo}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {selectedPokemon.types.map((type) => (
                  <Badge key={type} tone="type">
                    {type}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[var(--muted)]">스피드</span>
                <span className="font-bold">{selectedPokemon.speed}</span>
              </div>
            </div>
          </InfoCard>
        ) : (
          <InfoCard
            description="검색 조건을 조정하면 요약 패널이 다시 표시됩니다."
            title="선택 항목 없음"
          />
        )
      }
    />
  );
}
