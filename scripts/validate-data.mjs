import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  readJson,
  validatePublishedRegulationPokemon,
  validatePokemonEntries,
  validateRegulationRosterSnapshot,
  validateRoster,
  validateSyncedRegulationPokemon
} from "./lib/pokemon-data.mjs";

const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rosterPath = path.join(rootDirectory, "data", "champions-roster.json");
const previewPath = path.join(rootDirectory, "data", "generated", "pokemon-sync-preview.json");
const pokemonPath = path.join(rootDirectory, "data", "pokemon.json");
const regulationRosterPath = path.join(
  rootDirectory,
  "data",
  "generated",
  "champions-roster-m-b.json"
);
const regulationPokemonPath = path.join(
  rootDirectory,
  "data",
  "generated",
  "pokemon-m-b-preview.json"
);

async function main() {
  const roster = validateRoster(await readJson(rosterPath));
  const preview = validatePokemonEntries(await readJson(previewPath), "pokemon-sync-preview");
  const currentPokemon = validatePokemonEntries(await readJson(pokemonPath), "pokemon");
  const regulationRoster = validateRegulationRosterSnapshot(await readJson(regulationRosterPath));
  const regulationPokemon = validateSyncedRegulationPokemon(
    await readJson(regulationPokemonPath),
    regulationRoster
  );
  validatePublishedRegulationPokemon(currentPokemon, regulationRoster);
  const rosterBySlug = new Map(roster.map((entry) => [entry.slug, entry]));

  if (preview.length !== roster.length) {
    throw new Error(`Preview count ${preview.length} does not match roster count ${roster.length}.`);
  }

  for (const entry of preview) {
    const rosterEntry = rosterBySlug.get(entry.id);
    if (!rosterEntry) {
      throw new Error(`Preview entry ${entry.id} is missing from champions-roster.json.`);
    }
    if (entry.pokeapiId !== rosterEntry.pokeapiId) {
      throw new Error(`Preview entry ${entry.id} has a mismatched PokeAPI ID.`);
    }
    if (entry.championsAvailability.status !== rosterEntry.status) {
      throw new Error(`Preview entry ${entry.id} has a mismatched Champions status.`);
    }
  }

  console.log(
    `Data validation passed. Temporary roster: ${roster.length}; Preview: ${preview.length}; Current Pokemon: ${currentPokemon.length}; ${regulationRoster.regulationId} roster: ${regulationRoster.entries.length}; Synced: ${regulationPokemon.length}`
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
