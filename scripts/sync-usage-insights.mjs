import { mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import championsAbilities from "../data/generated/champions-abilities-m-b.json" with { type: "json" };
import championsItems from "../data/generated/champions-items-m-b.json" with { type: "json" };
import moveCandidates from "../data/generated/moves-m-b-candidates.json" with { type: "json" };
import pokemon from "../data/pokemon.json" with { type: "json" };
import { validateUsageInsightSnapshot } from "./lib/usage-insight-data.mjs";

const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = path.join(rootDirectory, "data", "generated", "usage-insights-m-b.json");
const apiUrl = "https://championsbattledata.com/api";
const format = readArgument("--format") ?? "Doubles";
const season = readArgument("--season") ?? "Current";
const pokemonSlugOverrides = new Map([
  ["aegislash-shield-forme", "aegislash-shield"],
  ["alolan-ninetales", "ninetales-alola"],
  ["alolan-raichu", "raichu-alola"],
  ["floette", "floette-eternal"],
  ["florges-red-flower", "florges"],
  ["furfrou-natural-form", "furfrou"],
  ["galarian-slowbro", "slowbro-galar"],
  ["galarian-slowking", "slowking-galar"],
  ["galarian-stunfisk", "stunfisk-galar"],
  ["gourgeist", "gourgeist-average"],
  ["gourgeist-jumbo-variety", "gourgeist-super"],
  ["gourgeist-large-variety", "gourgeist-large"],
  ["gourgeist-small-variety", "gourgeist-small"],
  ["hisuian-arcanine", "arcanine-hisui"],
  ["hisuian-avalugg", "avalugg-hisui"],
  ["hisuian-decidueye", "decidueye-hisui"],
  ["hisuian-goodra", "goodra-hisui"],
  ["hisuian-samurott", "samurott-hisui"],
  ["hisuian-typhlosion", "typhlosion-hisui"],
  ["hisuian-zoroark", "zoroark-hisui"],
  ["lycanroc", "lycanroc-midday"],
  ["lycanroc-dusk-form", "lycanroc-dusk"],
  ["lycanroc-midnight-form", "lycanroc-midnight"],
  ["maushold", "maushold-family-of-four"],
  ["meowstic", "meowstic-male"],
  ["mimikyu", "mimikyu-disguised"],
  ["morpeko", "morpeko-full-belly"],
  ["palafin-zero-form", "palafin-zero"],
  ["paldean-tauros-aqua-breed", "tauros-paldea-aqua-breed"],
  ["paldean-tauros-blaze-breed", "tauros-paldea-blaze-breed"],
  ["paldean-tauros-combat-breed", "tauros-paldea-combat-breed"],
  ["pyroar", "pyroar-male"],
  ["vivillon-fancy-pattern", "vivillon"]
]);
const statLabelKo = new Map([
  ["Attack", "공격"],
  ["Defense", "방어"],
  ["Sp. Atk", "특수공격"],
  ["Sp. Def", "특수방어"],
  ["Speed", "스피드"]
]);

function readArgument(name) {
  const prefix = `${name}=`;
  return process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length);
}

function normalizeName(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function mapByEnglishName(entries) {
  return new Map(entries.map((entry) => [normalizeName(entry.nameEn), entry.id]));
}

function formatStatPoints(points) {
  return `H${points.hp} A${points.attack} B${points.specialAttack} C${points.defense} D${points.specialDefense} S${points.speed}`;
}

function formatNatureLabel(row) {
  const up = statLabelKo.get(row.stat_up) ?? row.stat_up;
  const down = statLabelKo.get(row.stat_down) ?? row.stat_down;

  if (!up || !down) {
    return row.name;
  }

  return `${row.name} · ${up}↑ ${down}↓`;
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "pokemon-central-usage-sync/0.1"
    },
    signal: AbortSignal.timeout(30_000)
  });

  if (!response.ok) {
    throw new Error(`Usage data request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

function mapUsageRows(rows, category, idByName, idKey, review) {
  return rows
    .filter((row) => row.category === category && typeof row.percentage_value === "number")
    .flatMap((row) => {
      const id = idByName.get(normalizeName(row.name));
      if (!id) {
        review.push(`${category}: ${row.pokemon} -> ${row.name}`);
        return [];
      }
      return [{ [idKey]: id, usagePercent: row.percentage_value }];
    });
}

function mapStatPointRows(rows) {
  return rows
    .filter((row) => row.category === "stat_points" && typeof row.percentage_value === "number")
    .map((row) => {
      const statPoints = {
        hp: row.hp_points,
        attack: row.attack_points,
        specialAttack: row.sp_atk_points,
        defense: row.defense_points,
        specialDefense: row.sp_def_points,
        speed: row.speed_points
      };

      return {
        label: formatStatPoints(statPoints),
        statPoints,
        usagePercent: row.percentage_value
      };
    });
}

function mapNatureRows(rows) {
  return rows
    .filter((row) => row.category === "stat_alignment" && typeof row.percentage_value === "number")
    .map((row) => ({
      labelKo: formatNatureLabel(row),
      usagePercent: row.percentage_value
    }));
}

async function writeJsonAtomically(filePath, value) {
  const temporaryPath = `${filePath}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(temporaryPath, filePath);
}

async function main() {
  const api = await fetchJson(apiUrl);
  const localPokemonIds = new Set(pokemon.map((entry) => entry.id));
  const moveIdByName = mapByEnglishName(moveCandidates.entries);
  const itemIdByName = mapByEnglishName(championsItems.entries);
  const abilityIdByName = mapByEnglishName(championsAbilities.abilities);
  const review = [];
  const entries = [];

  for (const sourcePokemon of api.pokemon) {
    const pokemonId = pokemonSlugOverrides.get(sourcePokemon.slug) ?? sourcePokemon.slug;
    if (!localPokemonIds.has(pokemonId)) {
      review.push(`pokemon: ${sourcePokemon.slug}`);
      continue;
    }

    const rows = sourcePokemon.summary?.battleSummary?.[season]?.[format]?.rows ?? [];
    if (rows.length === 0) {
      continue;
    }

    entries.push({
      pokemonId,
      usageRank: rows[0]?.position ?? rows[0]?.column_position ?? entries.length + 1,
      moves: mapUsageRows(rows, "move", moveIdByName, "moveId", review),
      abilities: mapUsageRows(rows, "ability", abilityIdByName, "abilityId", review),
      items: mapUsageRows(rows, "held_item", itemIdByName, "itemId", review),
      statPointSpreads: mapStatPointRows(rows),
      natureModifiers: mapNatureRows(rows),
      notesKo: `${format} ${season} 사용률 참고 데이터입니다. 높은 사용률은 정답 빌드를 의미하지 않습니다.`
    });
  }

  const snapshot = {
    schemaVersion: 1,
    regulationId: "M-B",
    checkedAt: new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" }),
    source: {
      id: "championsbattledata",
      description: `Champions Battle Data API ${format} ${season} usage snapshot.`,
      apiUrl,
      format,
      season,
      generatedAt: api.generatedAt,
      dataVersion: api.dataVersion
    },
    entries: entries.sort((left, right) => left.usageRank - right.usageRank)
  };

  validateUsageInsightSnapshot(
    snapshot,
    pokemon,
    moveCandidates,
    championsItems,
    championsAbilities
  );

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeJsonAtomically(outputPath, snapshot);

  console.log(
    `Usage insights written: ${path.relative(rootDirectory, outputPath)} (${snapshot.entries.length} Pokemon; ${format} ${season})`
  );
  if (review.length > 0) {
    console.log(`Review skipped mappings: ${review.length}`);
    console.log(review.slice(0, 40).join("\n"));
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
