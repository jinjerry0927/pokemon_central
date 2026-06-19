export type TypeName =
  | "Normal"
  | "Fire"
  | "Water"
  | "Electric"
  | "Grass"
  | "Ice"
  | "Fighting"
  | "Poison"
  | "Ground"
  | "Flying"
  | "Psychic"
  | "Bug"
  | "Rock"
  | "Ghost"
  | "Dragon"
  | "Dark"
  | "Steel"
  | "Fairy";

export type TeamTypeSummary = {
  type: TypeName;
  weakCount: number;
  resistCount: number;
  immuneCount: number;
  score: number;
};

export const allTypes: TypeName[] = [
  "Normal",
  "Fire",
  "Water",
  "Electric",
  "Grass",
  "Ice",
  "Fighting",
  "Poison",
  "Ground",
  "Flying",
  "Psychic",
  "Bug",
  "Rock",
  "Ghost",
  "Dragon",
  "Dark",
  "Steel",
  "Fairy"
];

export const typeEffectiveness: Record<TypeName, Partial<Record<TypeName, number>>> = {
  Normal: { Rock: 0.5, Ghost: 0, Steel: 0.5 },
  Fire: {
    Fire: 0.5,
    Water: 0.5,
    Grass: 2,
    Ice: 2,
    Bug: 2,
    Rock: 0.5,
    Dragon: 0.5,
    Steel: 2
  },
  Water: { Fire: 2, Water: 0.5, Grass: 0.5, Ground: 2, Rock: 2, Dragon: 0.5 },
  Electric: { Water: 2, Electric: 0.5, Grass: 0.5, Ground: 0, Flying: 2, Dragon: 0.5 },
  Grass: {
    Fire: 0.5,
    Water: 2,
    Grass: 0.5,
    Poison: 0.5,
    Ground: 2,
    Flying: 0.5,
    Bug: 0.5,
    Rock: 2,
    Dragon: 0.5,
    Steel: 0.5
  },
  Ice: { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 0.5, Ground: 2, Flying: 2, Dragon: 2, Steel: 0.5 },
  Fighting: {
    Normal: 2,
    Ice: 2,
    Poison: 0.5,
    Flying: 0.5,
    Psychic: 0.5,
    Bug: 0.5,
    Rock: 2,
    Ghost: 0,
    Dark: 2,
    Steel: 2,
    Fairy: 0.5
  },
  Poison: { Grass: 2, Poison: 0.5, Ground: 0.5, Rock: 0.5, Ghost: 0.5, Steel: 0, Fairy: 2 },
  Ground: {
    Fire: 2,
    Electric: 2,
    Grass: 0.5,
    Poison: 2,
    Flying: 0,
    Bug: 0.5,
    Rock: 2,
    Steel: 2
  },
  Flying: { Electric: 0.5, Grass: 2, Fighting: 2, Bug: 2, Rock: 0.5, Steel: 0.5 },
  Psychic: { Fighting: 2, Poison: 2, Psychic: 0.5, Dark: 0, Steel: 0.5 },
  Bug: {
    Fire: 0.5,
    Grass: 2,
    Fighting: 0.5,
    Poison: 0.5,
    Flying: 0.5,
    Psychic: 2,
    Ghost: 0.5,
    Dark: 2,
    Steel: 0.5,
    Fairy: 0.5
  },
  Rock: { Fire: 2, Ice: 2, Fighting: 0.5, Ground: 0.5, Flying: 2, Bug: 2, Steel: 0.5 },
  Ghost: { Normal: 0, Psychic: 2, Ghost: 2, Dark: 0.5 },
  Dragon: { Dragon: 2, Steel: 0.5, Fairy: 0 },
  Dark: { Fighting: 0.5, Psychic: 2, Ghost: 2, Dark: 0.5, Fairy: 0.5 },
  Steel: { Fire: 0.5, Water: 0.5, Electric: 0.5, Ice: 2, Rock: 2, Steel: 0.5, Fairy: 2 },
  Fairy: { Fire: 0.5, Fighting: 2, Poison: 0.5, Dragon: 2, Dark: 2, Steel: 0.5 }
};

export function isTypeName(value: string): value is TypeName {
  return allTypes.includes(value as TypeName);
}

export function getAttackMultiplier(attackingType: TypeName, defenderType: TypeName) {
  return typeEffectiveness[attackingType][defenderType] ?? 1;
}

export function getDefensiveMultiplier(attackingType: TypeName, defenderTypes: string[]) {
  return defenderTypes.reduce((multiplier, defenderType) => {
    return isTypeName(defenderType) ? multiplier * getAttackMultiplier(attackingType, defenderType) : multiplier;
  }, 1);
}

export function getDefensiveProfile(defenderTypes: string[]) {
  return allTypes
    .map((type) => ({
      type,
      multiplier: getDefensiveMultiplier(type, defenderTypes)
    }))
    .sort((a, b) => b.multiplier - a.multiplier || a.type.localeCompare(b.type));
}

export function buildTeamWeaknessSummary(team: { types: string[] }[]): TeamTypeSummary[] {
  return allTypes
    .map((type) => {
      const matchups = team.map((entry) => getDefensiveMultiplier(type, entry.types));
      const weakCount = matchups.filter((value) => value > 1).length;
      const resistCount = matchups.filter((value) => value > 0 && value < 1).length;
      const immuneCount = matchups.filter((value) => value === 0).length;

      return {
        type,
        weakCount,
        resistCount,
        immuneCount,
        score: weakCount * 2 - resistCount - immuneCount * 2
      };
    })
    .sort((a, b) => b.score - a.score || b.weakCount - a.weakCount || a.type.localeCompare(b.type));
}

export function formatMultiplier(value: number) {
  if (value === 0.25) {
    return "1/4x";
  }
  if (value === 0.5) {
    return "1/2x";
  }

  return `${value}x`;
}
