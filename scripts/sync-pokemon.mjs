import { mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  readJson,
  validatePokemonEntries,
  validateRegulationRosterSnapshot,
  validateRoster
} from "./lib/pokemon-data.mjs";

const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rosterPath = resolveWorkspacePath(
  readArgument("--roster") ?? "data/champions-roster.json",
  "roster"
);
const outputPath = resolveWorkspacePath(
  readArgument("--output") ?? "data/generated/pokemon-sync-preview.json",
  "output"
);
const outputDirectory = path.dirname(outputPath);
const temporaryOutputPath = `${outputPath}.tmp`;
const apiBaseUrl = "https://pokeapi.co/api/v2";
const concurrency = 8;
const speciesCache = new Map();
const formCache = new Map();
const formNameKoFallbacks = new Map([
  ["hisuian", "히스이의 모습"],
  ["paldean-combat", "팔데아의 모습·컴뱃종"],
  ["paldean-blaze", "팔데아의 모습·블레이즈종"],
  ["paldean-aqua", "팔데아의 모습·워터종"],
  ["eternal-flower", "영원의 꽃"],
  ["male", "수컷의 모습"],
  ["female", "암컷의 모습"],
  ["family-of-four", "4마리 가족"],
  ["zero", "나이브폼"],
  ["champions-default", ""]
]);

function readArgument(name) {
  const prefix = `${name}=`;
  return process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length);
}

function resolveWorkspacePath(relativePath, label) {
  const resolvedPath = path.resolve(rootDirectory, relativePath);
  if (resolvedPath !== rootDirectory && !resolvedPath.startsWith(`${rootDirectory}${path.sep}`)) {
    throw new Error(`${label} path must stay inside the project directory.`);
  }
  return resolvedPath;
}

function toTitleCase(value) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getLocalizedName(names, languageName, fallback) {
  return names.find((entry) => entry.language.name === languageName)?.name ?? fallback;
}

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
          "User-Agent": "pokemon-central-data-sync/0.2"
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

function getSpecies(resourceName) {
  if (!speciesCache.has(resourceName)) {
    speciesCache.set(resourceName, fetchJson(`pokemon-species/${resourceName}`));
  }
  return speciesCache.get(resourceName);
}

function getPokemonForm(resourceName) {
  if (!formCache.has(resourceName)) {
    formCache.set(resourceName, fetchJson(`pokemon-form/${resourceName}`));
  }
  return formCache.get(resourceName);
}

function formatKoreanName(baseNameKo, formNameKo) {
  if (!formNameKo) {
    return baseNameKo;
  }
  return formNameKo.includes(baseNameKo) ? formNameKo : `${baseNameKo} (${formNameKo})`;
}

async function mapWithConcurrency(values, limit, mapper) {
  const results = new Array(values.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < values.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(values[currentIndex], currentIndex);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, values.length) }, () => worker()));
  return results;
}

function normalizeRoster(source) {
  if (Array.isArray(source)) {
    const roster = validateRoster(source);
    return {
      label: "temporary roster",
      entries: roster.map((entry) => ({
        endpoint: entry.pokeapiId,
        id: entry.slug,
        championsId: null,
        speciesId: null,
        pokeapiSlug: entry.slug,
        form: "base",
        nameEn: null,
        status: entry.status,
        currentEligible: false,
        firstSeenRegulation: null,
        regulationId: null,
        lastChecked: entry.lastChecked,
        evidence: entry.evidence,
        evidenceUrl: entry.evidenceUrl,
        publishStatus: entry.publishStatus,
        championsNotes: entry.championsNotes,
        sources: ["pokeapi", "manual-curation"]
      }))
    };
  }

  const snapshot = validateRegulationRosterSnapshot(source);
  return {
    label: `Regulation ${snapshot.regulationId}`,
    entries: snapshot.entries.map((entry) => ({
      endpoint: entry.pokeapiSlug,
      id: entry.pokeapiSlug,
      championsId: entry.championsId,
      speciesId: entry.speciesId,
      pokeapiSlug: entry.pokeapiSlug,
      form: entry.form,
      nameEn: entry.nameEn,
      status: entry.status,
      currentEligible: entry.currentEligible,
      firstSeenRegulation: entry.firstSeenRegulation,
      regulationId: snapshot.regulationId,
      lastChecked: entry.lastChecked,
      evidence: `Official Regulation Set ${snapshot.regulationId} Eligible Pokémon list.`,
      evidenceUrl: entry.evidenceUrl,
      publishStatus: entry.publishStatus,
      championsNotes: `Pokemon Champions Regulation ${snapshot.regulationId} 공식 사용 가능 목록 확인. 주요 기술과 한국어 폼 표기는 공개 전 검토한다.`,
      sources: ["pokeapi", "official-regulation"]
    }))
  };
}

async function syncRosterEntry(rosterEntry) {
  const pokemon = await fetchJson(`pokemon/${rosterEntry.endpoint}`);
  const species = await getSpecies(pokemon.species.name);
  const shouldFetchForm = !["base", "champions-default", "normal"].includes(
    rosterEntry.form
  );
  const pokemonForm = shouldFetchForm ? await getPokemonForm(pokemon.name) : null;

  if (pokemon.name !== rosterEntry.pokeapiSlug) {
    throw new Error(
      `Roster slug ${rosterEntry.pokeapiSlug} does not match PokeAPI slug ${pokemon.name}.`
    );
  }

  const statValues = Object.fromEntries(
    pokemon.stats.map((entry) => [entry.stat.name, entry.base_stat])
  );
  const baseNameKo = getLocalizedName(species.names, "ko", "");
  const formNameKo = pokemonForm
    ? getLocalizedName(
        pokemonForm.form_names,
        "ko",
        formNameKoFallbacks.get(rosterEntry.form) ?? ""
      )
    : "";

  return {
    id: rosterEntry.id,
    pokeapiId: pokemon.id,
    championsId: rosterEntry.championsId,
    speciesId: rosterEntry.speciesId,
    pokeapiSlug: rosterEntry.pokeapiSlug,
    form: rosterEntry.form,
    formNameKo: formNameKo || null,
    nameKo: formatKoreanName(baseNameKo, formNameKo),
    nameEn:
      rosterEntry.nameEn ?? getLocalizedName(species.names, "en", toTitleCase(pokemon.name)),
    spriteUrl: pokemon.sprites.front_default,
    types: pokemon.types
      .sort((left, right) => left.slot - right.slot)
      .map((entry) => toTitleCase(entry.type.name)),
    baseStats: {
      hp: statValues.hp,
      attack: statValues.attack,
      defense: statValues.defense,
      specialAttack: statValues["special-attack"],
      specialDefense: statValues["special-defense"],
      speed: statValues.speed
    },
    abilities: pokemon.abilities
      .sort((left, right) => left.slot - right.slot)
      .map((entry) => entry.ability.name),
    learnableMoveIds: Array.from(
      new Set(pokemon.moves.map((entry) => entry.move.name))
    ).sort(),
    keyMoveIds: [],
    championsAvailability: {
      status: rosterEntry.status,
      currentEligible: rosterEntry.currentEligible,
      regulationId: rosterEntry.regulationId,
      firstSeenRegulation: rosterEntry.firstSeenRegulation,
      lastChecked: rosterEntry.lastChecked,
      evidence: rosterEntry.evidence,
      evidenceUrl: rosterEntry.evidenceUrl
    },
    publishStatus: rosterEntry.publishStatus,
    championsNotes: rosterEntry.championsNotes,
    sources: rosterEntry.sources
  };
}

async function main() {
  const roster = normalizeRoster(await readJson(rosterPath));
  console.log(`Syncing ${roster.entries.length} entries from ${roster.label} through PokeAPI...`);
  const pokemon = await mapWithConcurrency(roster.entries, concurrency, async (entry, index) => {
    const synced = await syncRosterEntry(entry);
    if ((index + 1) % 25 === 0 || index + 1 === roster.entries.length) {
      console.log(`Synced ${index + 1}/${roster.entries.length}`);
    }
    return synced;
  });
  validatePokemonEntries(pokemon, "pokemon-sync-preview");

  await mkdir(outputDirectory, { recursive: true });
  await writeFile(temporaryOutputPath, `${JSON.stringify(pokemon, null, 2)}\n`, "utf8");
  await rename(temporaryOutputPath, outputPath);
  console.log(
    `Pokemon sync preview written: ${path.relative(rootDirectory, outputPath)} (${pokemon.length} entries)`
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
