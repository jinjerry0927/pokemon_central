import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  readJson,
  validateRegulationRosterSnapshot
} from "./lib/pokemon-data.mjs";

const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const snapshotPath = path.join(
  rootDirectory,
  "data",
  "generated",
  "champions-roster-m-b.json"
);
const apiBaseUrl = "https://pokeapi.co/api/v2";
const concurrency = 8;

async function fetchPokemon(slug) {
  const response = await fetch(`${apiBaseUrl}/pokemon/${slug}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "pokemon-central-roster-verifier/0.1"
    },
    signal: AbortSignal.timeout(15_000)
  });

  if (!response.ok) {
    throw new Error(`${slug}: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function mapWithConcurrency(values, limit, mapper) {
  const results = new Array(values.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < values.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(values[currentIndex]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, values.length) }, () => worker()));
  return results;
}

function getResourceId(url) {
  const match = url.match(/\/(\d+)\/$/);
  return match ? Number(match[1]) : null;
}

async function main() {
  const snapshot = validateRegulationRosterSnapshot(await readJson(snapshotPath));
  console.log(`Verifying ${snapshot.entries.length} M-B form mappings against PokeAPI...`);

  const results = await mapWithConcurrency(snapshot.entries, concurrency, async (entry) => {
    try {
      const pokemon = await fetchPokemon(entry.pokeapiSlug);
      const speciesId = getResourceId(pokemon.species.url);

      if (pokemon.name !== entry.pokeapiSlug) {
        throw new Error(`expected slug ${entry.pokeapiSlug}, received ${pokemon.name}`);
      }
      if (speciesId !== entry.speciesId) {
        throw new Error(`expected species ${entry.speciesId}, received ${speciesId}`);
      }
      return null;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return `${entry.championsId} ${entry.nameEn}: ${message}`;
    }
  });
  const failures = results.filter(Boolean);

  if (failures.length > 0) {
    throw new Error(`PokeAPI roster verification failed (${failures.length}):\n${failures.join("\n")}`);
  }

  console.log(`PokeAPI roster verification passed: ${snapshot.entries.length} form mappings.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
