"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Badge, InfoCard, Tabs, ThreeColumnLayout } from "../_components/design-system";
import {
  calculateDamage,
  calculateNeutralHp,
  calculateNeutralStat,
  type DamageMoveCategory
} from "../_lib/damage-calculator";
import { formatMultiplier } from "../_lib/type-matchups";

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
  nameKo: string;
  nameEn: string;
  type: string;
  category: string;
  power: number | null;
  accuracy: number | null;
};

type CalculatorBrowserProps = {
  pokemon: PokemonEntry[];
  moves: MoveEntry[];
};

type NumberFieldProps = {
  label: string;
  min?: number;
  max?: number;
  value: number;
  onChange: (value: number) => void;
};

function getPokemonLabel(entry: PokemonEntry) {
  return `${entry.nameKo} / ${entry.nameEn}`;
}

function isDamageMoveCategory(value: string): value is DamageMoveCategory {
  return value === "Physical" || value === "Special" || value === "Status";
}

function getDamageMoveCategory(value: string | undefined): DamageMoveCategory {
  return value && isDamageMoveCategory(value) ? value : "Physical";
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function formatHits(minHits: number | null, maxHits: number | null) {
  if (!minHits || !maxHits) {
    return "KO 불가";
  }

  return minHits === maxHits ? `${minHits}타` : `${minHits}-${maxHits}타`;
}

function NumberField({ label, min = 1, max = 999, value, onChange }: NumberFieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-[var(--foreground)]">{label}</span>
      <input
        className="mt-2 h-11 w-full rounded-md border border-[var(--panel-border)] bg-white px-3 text-sm outline-none focus:border-[var(--support)] focus:ring-2 focus:ring-[var(--support-soft)]"
        max={max}
        min={min}
        onChange={(event) => onChange(Number(event.target.value))}
        type="number"
        value={value}
      />
    </label>
  );
}

export function CalculatorBrowser({
  pokemon,
  moves
}: CalculatorBrowserProps) {
  const searchParams = useSearchParams();
  const initialAttackerId = searchParams.get("attacker") ?? undefined;
  const initialDefenderId = searchParams.get("defender") ?? undefined;
  const initialMoveId = searchParams.get("move") ?? undefined;
  const damagingMoves = useMemo(
    () => moves.filter((move) => move.power && isDamageMoveCategory(move.category) && move.category !== "Status"),
    [moves]
  );
  const [level, setLevel] = useState(50);
  const [attackerId, setAttackerId] = useState(initialAttackerId ?? pokemon[0]?.id ?? "");
  const [defenderId, setDefenderId] = useState(
    initialDefenderId ?? pokemon.find((entry) => entry.id !== attackerId)?.id ?? pokemon[0]?.id ?? ""
  );
  const [moveId, setMoveId] = useState(initialMoveId ?? damagingMoves[0]?.id ?? "");
  const attacker = pokemon.find((entry) => entry.id === attackerId) ?? pokemon[0];
  const defender = pokemon.find((entry) => entry.id === defenderId) ?? pokemon[0];
  const selectedMove = damagingMoves.find((move) => move.id === moveId) ?? damagingMoves[0];
  const selectedCategory = getDamageMoveCategory(selectedMove?.category);
  const defaultAttack = selectedCategory === "Physical"
    ? calculateNeutralStat(attacker.baseStats.attack, level)
    : calculateNeutralStat(attacker.baseStats.specialAttack, level);
  const defaultDefense = selectedCategory === "Physical"
    ? calculateNeutralStat(defender.baseStats.defense, level)
    : calculateNeutralStat(defender.baseStats.specialDefense, level);
  const defaultHp = calculateNeutralHp(defender.baseStats.hp, level);
  const defaultPower = selectedMove?.power ?? 1;
  const [attackStat, setAttackStat] = useState(defaultAttack);
  const [defenseStat, setDefenseStat] = useState(defaultDefense);
  const [defenderHp, setDefenderHp] = useState(defaultHp);
  const [power, setPower] = useState(defaultPower);

  useEffect(() => {
    setAttackStat(defaultAttack);
    setDefenseStat(defaultDefense);
    setDefenderHp(defaultHp);
    setPower(defaultPower);
  }, [defaultAttack, defaultDefense, defaultHp, defaultPower]);

  const result = selectedMove
    ? calculateDamage({
        level,
        power,
        attack: attackStat,
        defense: defenseStat,
        defenderHp,
        moveType: selectedMove.type,
        moveCategory: selectedCategory,
        attackerTypes: attacker.types,
        defenderTypes: defender.types
      })
    : null;
  const attackLabel = selectedCategory === "Physical" ? "공격" : "특공";
  const defenseLabel = selectedCategory === "Physical" ? "방어" : "특방";

  return (
    <ThreeColumnLayout
      left={
        <InfoCard title="전투 조건">
          <div className="grid gap-5">
            <label className="block">
              <span className="text-sm font-semibold text-[var(--foreground)]">공격자</span>
              <select
                className="mt-2 h-11 w-full rounded-md border border-[var(--panel-border)] bg-white px-3 text-sm outline-none focus:border-[var(--support)] focus:ring-2 focus:ring-[var(--support-soft)]"
                onChange={(event) => setAttackerId(event.target.value)}
                value={attacker.id}
              >
                {pokemon.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {getPokemonLabel(entry)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-[var(--foreground)]">방어자</span>
              <select
                className="mt-2 h-11 w-full rounded-md border border-[var(--panel-border)] bg-white px-3 text-sm outline-none focus:border-[var(--support)] focus:ring-2 focus:ring-[var(--support-soft)]"
                onChange={(event) => setDefenderId(event.target.value)}
                value={defender.id}
              >
                {pokemon.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {getPokemonLabel(entry)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-[var(--foreground)]">기술</span>
              <select
                className="mt-2 h-11 w-full rounded-md border border-[var(--panel-border)] bg-white px-3 text-sm outline-none focus:border-[var(--support)] focus:ring-2 focus:ring-[var(--support-soft)]"
                onChange={(event) => setMoveId(event.target.value)}
                value={selectedMove.id}
              >
                {damagingMoves.map((move) => (
                  <option key={move.id} value={move.id}>
                    {move.nameKo} / {move.nameEn}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </InfoCard>
      }
      center={
        <div className="grid gap-4">
          <div className="lg:hidden">
            <InfoCard
              description="모바일에서는 기본 조건 선택과 핵심 결과 확인을 우선 지원합니다. 세부 보정값을 많이 비교할 때는 데스크탑 화면이 더 적합합니다."
              title="모바일 계산기 안내"
            />
          </div>

          <Tabs
            items={[
              { label: `${attacker.nameKo} 공격`, active: true },
              { label: `${defender.nameKo} 방어` }
            ]}
          />

          <InfoCard title="계산 입력">
            <div className="grid gap-4 md:grid-cols-2">
              <NumberField label="레벨" max={100} value={level} onChange={setLevel} />
              <NumberField label="위력" max={250} value={power} onChange={setPower} />
              <NumberField label={`공격자 ${attackLabel}`} value={attackStat} onChange={setAttackStat} />
              <NumberField label={`방어자 ${defenseLabel}`} value={defenseStat} onChange={setDefenseStat} />
              <NumberField label="방어자 HP" value={defenderHp} onChange={setDefenderHp} />
            </div>
            <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
              기본값은 레벨, 종족값, 31 IV, 0 EV, 성격 보정 없음 기준입니다. 실제 빌드의 노력치나 성격은 직접 입력해 보정할 수 있습니다.
            </p>
          </InfoCard>

          {result ? (
            <InfoCard title="계산 결과">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-[var(--panel-border)] bg-white p-4">
                  <p className="text-sm font-semibold text-[var(--muted)]">데미지</p>
                  <p className="mt-2 break-words text-xl font-bold sm:text-2xl">
                    {result.minDamage}-{result.maxDamage}
                  </p>
                </div>
                <div className="rounded-lg border border-[var(--panel-border)] bg-white p-4">
                  <p className="text-sm font-semibold text-[var(--muted)]">HP 비율</p>
                  <p className="mt-2 break-words text-xl font-bold sm:text-2xl">
                    {formatPercent(result.minPercent)}-{formatPercent(result.maxPercent)}
                  </p>
                </div>
                <div className="rounded-lg border border-[var(--panel-border)] bg-white p-4">
                  <p className="text-sm font-semibold text-[var(--muted)]">확정 타수</p>
                  <p className="mt-2 break-words text-xl font-bold sm:text-2xl">
                    {formatHits(result.minHitsToKo, result.maxHitsToKo)}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
                {attacker.nameKo}의 {selectedMove.nameKo}은 {defender.nameKo}에게{" "}
                {result.minDamage}-{result.maxDamage} 데미지
                {result.typeMultiplier === 0
                  ? "를 줄 수 없습니다."
                  : `를 주며, 방어자 HP의 ${formatPercent(result.minPercent)}-${formatPercent(result.maxPercent)}입니다.`}
              </p>
            </InfoCard>
          ) : null}
        </div>
      }
      right={
        <div className="grid gap-4">
          <InfoCard title="보정 요약">
            <div className="grid gap-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[var(--muted)]">타입</span>
                <Badge tone="type">{selectedMove.type}</Badge>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[var(--muted)]">분류</span>
                <Badge>{selectedMove.category}</Badge>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[var(--muted)]">STAB</span>
                <span className="font-bold">{result ? formatMultiplier(result.stabMultiplier) : "1x"}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[var(--muted)]">상성</span>
                <span className="font-bold">{result ? formatMultiplier(result.typeMultiplier) : "1x"}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[var(--muted)]">랜덤 범위</span>
                <span className="font-bold">85%-100%</span>
              </div>
            </div>
          </InfoCard>

          <InfoCard title="범위">
            <p className="text-sm leading-6 text-[var(--muted)]">
              Phase M MVP는 기본 데미지, STAB, 타입 상성, 랜덤 보정만 계산합니다. 날씨, 필드, 특성, 아이템, 랭크 보정은 Advanced 계산기 단계에서 추가합니다.
            </p>
          </InfoCard>
        </div>
      }
    />
  );
}
