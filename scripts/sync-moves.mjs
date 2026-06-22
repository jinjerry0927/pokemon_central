import { access, mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  readJson,
  validateMoveCandidateSnapshot,
  validatePokemonMoveCandidateSnapshot,
  validateRegulationRosterSnapshot,
  validateSyncedRegulationPokemon
} from "./lib/pokemon-data.mjs";

const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rosterPath = path.join(rootDirectory, "data", "generated", "champions-roster-m-b.json");
const pokemonPath = path.join(rootDirectory, "data", "generated", "pokemon-m-b-preview.json");
const outputDirectory = path.join(rootDirectory, "data", "generated");
const movesOutputPath = path.join(outputDirectory, "moves-m-b-candidates.json");
const mappingOutputPath = path.join(outputDirectory, "pokemon-move-candidates-m-b.json");
const serebiiLearnsetsPath = path.join(outputDirectory, "serebii-learnsets-m-b.json");
const apiBaseUrl = "https://pokeapi.co/api/v2";
const concurrency = 10;

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function fetchJson(resourcePath) {
  let lastError;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(`${apiBaseUrl}/${resourcePath}`, {
        headers: {
          Accept: "application/json",
          "User-Agent": "pokemon-central-move-sync/0.1"
        },
        signal: AbortSignal.timeout(20_000)
      });

      if (response.ok) {
        return response.json();
      }
      lastError = new Error(
        `PokeAPI request failed for ${resourcePath}: ${response.status} ${response.statusText}`
      );
      if (response.status !== 429 && response.status < 500) {
        throw lastError;
      }
    } catch (error) {
      lastError = error;
    }

    if (attempt < 2) {
      await wait(500 * 2 ** attempt);
    }
  }

  throw lastError;
}

async function mapWithConcurrency(values, limit, mapper) {
  const results = new Array(values.length);
  let nextIndex = 0;
  let completed = 0;

  async function worker() {
    while (nextIndex < values.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(values[currentIndex]);
      completed += 1;
      if (completed % 50 === 0 || completed === values.length) {
        console.log(`Synced move details ${completed}/${values.length}`);
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, values.length) }, () => worker()));
  return results;
}

function getLocalizedName(names, languageName, fallback) {
  return names.find((entry) => entry.language.name === languageName)?.name ?? fallback;
}

function toTitleCase(value) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function writeJsonAtomically(filePath, value) {
  const temporaryPath = `${filePath}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(temporaryPath, filePath);
}

async function readOptionalSerebiiMoveIds() {
  try {
    await access(serebiiLearnsetsPath);
  } catch {
    return [];
  }
  const snapshot = await readJson(serebiiLearnsetsPath);
  if (
    snapshot?.scope !== "serebii-current-learnsets" ||
    !Array.isArray(snapshot.entries)
  ) {
    throw new Error("Existing Serebii learnset snapshot is invalid.");
  }
  return Array.from(
    new Set(snapshot.entries.flatMap((entry) => entry.serebiiMoveIds ?? []))
  ).sort();
}

async function main() {
  const roster = validateRegulationRosterSnapshot(await readJson(rosterPath));
  const pokemon = validateSyncedRegulationPokemon(await readJson(pokemonPath), roster);
  const pokeapiLearnsetMoveIds = Array.from(
    new Set(pokemon.flatMap((entry) => entry.learnableMoveIds))
  ).sort();
  const serebiiMoveIds = await readOptionalSerebiiMoveIds();
  const pokeapiLearnsetMoveIdSet = new Set(pokeapiLearnsetMoveIds);
  const moveIds = Array.from(new Set([...pokeapiLearnsetMoveIds, ...serebiiMoveIds])).sort();
  console.log(`Loading ${moveIds.length} unique PokeAPI move candidates...`);

  const moveEntries = await mapWithConcurrency(moveIds, concurrency, async (moveId) => {
    const move = await fetchJson(`move/${moveId}`);
    const nameKo = getLocalizedName(move.names, "ko", null);
    return {
      id: move.name,
      nameKo,
      nameEn: getLocalizedName(move.names, "en", toTitleCase(move.name)),
      type: toTitleCase(move.type.name),
      category: toTitleCase(move.damage_class.name),
      power: move.power,
      accuracy: move.accuracy,
      pp: move.pp,
      priority: move.priority,
      generation: move.generation.name,
      localizationStatus: nameKo ? "complete" : "missing-ko",
      publishStatus: "review-candidate",
      sources: [
        "pokeapi",
        ...(!pokeapiLearnsetMoveIdSet.has(move.name) && serebiiMoveIds.includes(move.name)
          ? ["serebii-champions-pokedex"]
          : [])
      ]
    };
  });
  const moveSnapshot = {
    schemaVersion: 1,
    regulationId: roster.regulationId,
    checkedAt: roster.checkedAt,
    scope: "pokeapi-all-version-candidate",
    entries: moveEntries
  };
  const mappingSnapshot = {
    schemaVersion: 1,
    regulationId: roster.regulationId,
    checkedAt: roster.checkedAt,
    scope: "pokeapi-all-version-candidate",
    entries: pokemon.map((entry) => ({
      pokemonId: entry.id,
      championsId: entry.championsId,
      moveIds: entry.learnableMoveIds
    }))
  };

  validateMoveCandidateSnapshot(moveSnapshot);
  validatePokemonMoveCandidateSnapshot(mappingSnapshot, pokemon, moveSnapshot);
  await mkdir(outputDirectory, { recursive: true });
  await writeJsonAtomically(movesOutputPath, moveSnapshot);
  await writeJsonAtomically(mappingOutputPath, mappingSnapshot);
  console.log(
    `Move candidates written: ${moveEntries.length} moves; ${mappingSnapshot.entries.length} Pokémon mappings.`
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
