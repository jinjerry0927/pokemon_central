"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  DataTable,
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
    speed: number;
  };
  publishStatus: string;
};

type SpeedPreset = {
  id: string;
  label: string;
  shortLabel: string;
  level: number;
  ev: number;
  nature: 0.9 | 1 | 1.1;
};

type SpeedTierRow = {
  id: string;
  rank: number;
  name: string;
  nameKo: string;
  nameEn: string;
  types: string[];
  baseSpeed: number;
  calculatedSpeed: number;
  status: string;
};

type SpeedTiersBrowserProps = {
  pokemon: PokemonEntry[];
};

const speedPresets: SpeedPreset[] = [
  {
    id: "lv50-max-positive",
    label: "Lv.50 / 252 EV / 상승 성격",
    shortLabel: "최속",
    level: 50,
    ev: 252,
    nature: 1.1
  },
  {
    id: "lv50-max-neutral",
    label: "Lv.50 / 252 EV / 보정 없음",
    shortLabel: "준속",
    level: 50,
    ev: 252,
    nature: 1
  },
  {
    id: "lv50-no-ev-neutral",
    label: "Lv.50 / 0 EV / 보정 없음",
    shortLabel: "무보정",
    level: 50,
    ev: 0,
    nature: 1
  },
  {
    id: "base-speed",
    label: "종족값 기준",
    shortLabel: "종족값",
    level: 50,
    ev: 0,
    nature: 1
  }
];

function calculateSpeed(baseSpeed: number, preset: SpeedPreset) {
  if (preset.id === "base-speed") {
    return baseSpeed;
  }

  const iv = 31;
  const preNature = Math.floor(((2 * baseSpeed + iv + Math.floor(preset.ev / 4)) * preset.level) / 100) + 5;

  return Math.floor(preNature * preset.nature);
}

function formatStatus(value: string) {
  return value === "mvp-sample" ? "MVP 샘플" : value;
}

export function SpeedTiersBrowser({ pokemon }: SpeedTiersBrowserProps) {
  const [query, setQuery] = useState("");
  const [presetId, setPresetId] = useState(speedPresets[0].id);
  const [focusedPokemonId, setFocusedPokemonId] = useState<string | null>(null);

  const selectedPreset = speedPresets.find((preset) => preset.id === presetId) ?? speedPresets[0];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pokemonId = params.get("pokemon");

    if (pokemonId) {
      const target = pokemon.find((entry) => entry.id === pokemonId);

      if (target) {
        setFocusedPokemonId(target.id);
        setQuery(target.nameKo);
      }
    }
  }, [pokemon]);

  const rows = useMemo<SpeedTierRow[]>(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return pokemon
      .map((entry) => ({
        id: entry.id,
        rank: 0,
        name: `${entry.nameKo} / ${entry.nameEn}`,
        nameKo: entry.nameKo,
        nameEn: entry.nameEn,
        types: entry.types,
        baseSpeed: entry.baseStats.speed,
        calculatedSpeed: calculateSpeed(entry.baseStats.speed, selectedPreset),
        status: formatStatus(entry.publishStatus)
      }))
      .sort((a, b) => b.calculatedSpeed - a.calculatedSpeed || b.baseSpeed - a.baseSpeed)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1
      }))
      .filter((entry) => {
        if (!normalizedQuery) {
          return true;
        }

        return (
          entry.nameKo.includes(query.trim()) ||
          entry.nameEn.toLowerCase().includes(normalizedQuery)
        );
      });
  }, [pokemon, query, selectedPreset]);

  const focusedPokemon =
    (focusedPokemonId ? rows.find((row) => row.id === focusedPokemonId) : null) ?? rows[0];

  const columns: DataTableColumn<SpeedTierRow>[] = [
    { key: "rank", label: "순위", align: "right" },
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
    { key: "baseSpeed", label: "기본 스피드", align: "right" },
    { key: "calculatedSpeed", label: selectedPreset.shortLabel, align: "right" }
  ];

  return (
    <ThreeColumnLayout
      left={
        <InfoCard title="비교 기준">
          <div className="grid gap-5">
            <SearchField
              label="빠른 검색"
              onChange={(value) => {
                setFocusedPokemonId(null);
                setQuery(value);
              }}
              placeholder="예: 팬텀, Gengar"
              value={query}
            />
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">프리셋</p>
              <div className="mt-2 grid gap-2">
                {speedPresets.map((preset) => (
                  <button
                    className={`rounded-md border px-3 py-2 text-left text-sm font-semibold ${
                      preset.id === presetId
                        ? "border-[var(--support)] bg-[var(--support)] text-white"
                        : "border-[var(--panel-border)] bg-white text-[var(--muted)] hover:text-[var(--foreground)]"
                    }`}
                    key={preset.id}
                    onClick={() => setPresetId(preset.id)}
                    type="button"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
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
            <DataTable columns={columns} rows={rows} />
          ) : (
            <InfoCard
              description="검색어를 줄이면 스피드 순위를 다시 비교할 수 있습니다."
              title="검색 결과 없음"
            />
          )}
        </div>
      }
      right={
        focusedPokemon ? (
          <InfoCard
            action={{ href: `/pokemon/${focusedPokemon.id}`, label: "상세" }}
            description={`${selectedPreset.label} 기준으로 현재 목록에서 ${focusedPokemon.rank}위입니다.`}
            title={focusedPokemon.nameKo}
          >
            <div className="grid gap-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[var(--muted)]">계산 스피드</span>
                <span className="text-lg font-bold">{focusedPokemon.calculatedSpeed}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[var(--muted)]">기본 스피드</span>
                <span className="font-bold">{focusedPokemon.baseSpeed}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {focusedPokemon.types.map((type) => (
                  <Badge key={type} tone="type">
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
          </InfoCard>
        ) : (
          <InfoCard
            description="검색 조건을 조정하면 비교 요약이 다시 표시됩니다."
            title="선택 항목 없음"
          />
        )
      }
    />
  );
}
