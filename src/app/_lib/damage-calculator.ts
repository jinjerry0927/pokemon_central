import { getDefensiveMultiplier, isTypeName } from "./type-matchups";

export type DamageMoveCategory = "Physical" | "Special" | "Status";

export type DamageInput = {
  level: number;
  power: number;
  attack: number;
  defense: number;
  defenderHp: number;
  moveType: string;
  moveCategory: DamageMoveCategory;
  attackerTypes: string[];
  defenderTypes: string[];
};

export type DamageResult = {
  minDamage: number;
  maxDamage: number;
  minPercent: number;
  maxPercent: number;
  minHitsToKo: number | null;
  maxHitsToKo: number | null;
  stabMultiplier: number;
  typeMultiplier: number;
  isDamagingMove: boolean;
};

export function calculateNeutralStat(base: number, level: number) {
  return Math.floor(((2 * base + 31) * level) / 100) + 5;
}

export function calculateNeutralHp(base: number, level: number) {
  return Math.floor(((2 * base + 31) * level) / 100) + level + 10;
}

function clampPositiveInteger(value: number, fallback: number) {
  if (!Number.isFinite(value) || value < 1) {
    return fallback;
  }

  return Math.floor(value);
}

function applyModifier(damage: number, modifier: number) {
  return Math.floor(damage * modifier);
}

function hitsToKo(hp: number, damage: number) {
  if (damage < 1) {
    return null;
  }

  return Math.ceil(hp / damage);
}

export function calculateDamage(input: DamageInput): DamageResult {
  const level = clampPositiveInteger(input.level, 50);
  const power = clampPositiveInteger(input.power, 1);
  const attack = clampPositiveInteger(input.attack, 1);
  const defense = clampPositiveInteger(input.defense, 1);
  const defenderHp = clampPositiveInteger(input.defenderHp, 1);
  const isDamagingMove = input.moveCategory !== "Status" && input.power > 0;
  const stabMultiplier = input.attackerTypes.includes(input.moveType) ? 1.5 : 1;
  const typeMultiplier = isTypeName(input.moveType)
    ? getDefensiveMultiplier(input.moveType, input.defenderTypes)
    : 1;

  if (!isDamagingMove || typeMultiplier === 0) {
    return {
      minDamage: 0,
      maxDamage: 0,
      minPercent: 0,
      maxPercent: 0,
      minHitsToKo: null,
      maxHitsToKo: null,
      stabMultiplier,
      typeMultiplier,
      isDamagingMove
    };
  }

  const baseDamage = Math.floor(
    Math.floor(Math.floor((Math.floor((2 * level) / 5) + 2) * power * attack) / defense) / 50
  ) + 2;
  const minDamage = applyModifier(
    applyModifier(applyModifier(baseDamage, 0.85), stabMultiplier),
    typeMultiplier
  );
  const maxDamage = applyModifier(
    applyModifier(applyModifier(baseDamage, 1), stabMultiplier),
    typeMultiplier
  );

  return {
    minDamage,
    maxDamage,
    minPercent: (minDamage / defenderHp) * 100,
    maxPercent: (maxDamage / defenderHp) * 100,
    minHitsToKo: hitsToKo(defenderHp, maxDamage),
    maxHitsToKo: hitsToKo(defenderHp, minDamage),
    stabMultiplier,
    typeMultiplier,
    isDamagingMove
  };
}
