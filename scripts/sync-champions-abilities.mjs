import { mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readJson, validatePokemonEntries } from "./lib/pokemon-data.mjs";
import {
  extractSerebiiAbilityIds,
  validateChampionsAbilitySnapshot
} from "./lib/champions-ability-data.mjs";

const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const generatedDirectory = path.join(rootDirectory, "data", "generated");
const pokemonPath = path.join(rootDirectory, "data", "pokemon.json");
const learnsetPath = path.join(generatedDirectory, "serebii-learnsets-m-b.json");
const outputPath = path.join(generatedDirectory, "champions-abilities-m-b.json");
const pokeapiBaseUrl = "https://pokeapi.co/api/v2";

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function fetchResource(url, accept, parse) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: accept,
          "User-Agent": "pokemon-central-champions-ability-sync/0.1"
        },
        signal: AbortSignal.timeout(25_000)
      });
      if (response.ok) return parse(response);
      lastError = new Error(`Ability request failed for ${url}: ${response.status} ${response.statusText}`);
      if (response.status !== 429 && response.status < 500) throw lastError;
    } catch (error) {
      lastError = error;
    }
    if (attempt < 2) await wait(600 * 2 ** attempt);
  }
  throw lastError;
}

function fetchText(url) {
  return fetchResource(url, "text/html", (response) => response.text());
}

function fetchJson(url) {
  return fetchResource(url, "application/json", (response) => response.json());
}

async function mapWithConcurrency(values, limit, label, mapper) {
  const results = new Array(values.length);
  let nextIndex = 0;
  let completed = 0;

  async function worker() {
    while (nextIndex < values.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(values[index]);
      completed += 1;
      if (completed % 25 === 0 || completed === values.length) {
        console.log(`${label} ${completed}/${values.length}`);
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, values.length) }, () => worker()));
  return results;
}

function getLocalizedName(names, languageName) {
  return names.find((entry) => entry.language.name === languageName)?.name ?? null;
}

function getCheckedAt() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}

async function writeJsonAtomically(filePath, value) {
  const temporaryPath = `${filePath}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(temporaryPath, filePath);
}

async function main() {
  const pokemon = validatePokemonEntries(await readJson(pokemonPath), "pokemon");
  const learnsets = await readJson(learnsetPath);
  const learnsetByPokemonId = new Map(
    learnsets.entries.map((entry) => [entry.pokemonId, entry])
  );
  const uniquePageUrls = Array.from(
    new Set(pokemon.map((entry) => learnsetByPokemonId.get(entry.id)?.pageUrl))
  );
  if (uniquePageUrls.some((url) => typeof url !== "string")) {
    throw new Error("A published Pokemon is missing its Serebii Champions page URL.");
  }

  const pageHtml = await mapWithConcurrency(
    uniquePageUrls,
    3,
    "Loaded Serebii ability pages",
    fetchText
  );
  const sourceAbilityIdsByPageUrl = new Map(
    uniquePageUrls.map((url, index) => [url, extractSerebiiAbilityIds(pageHtml[index])])
  );

  const uniqueAbilityIds = Array.from(
    new Set(pokemon.flatMap((entry) => entry.abilities))
  ).sort();
  const pokeapiAbilities = await mapWithConcurrency(
    uniqueAbilityIds,
    10,
    "Loaded PokeAPI abilities",
    (abilityId) => fetchJson(`${pokeapiBaseUrl}/ability/${abilityId}`)
  );
  const abilities = uniqueAbilityIds.map((abilityId, index) => {
    const source = pokeapiAbilities[index];
    return {
      id: abilityId,
      pokeapiId: source.id,
      nameKo: getLocalizedName(source.names, "ko"),
      nameEn: getLocalizedName(source.names, "en") ?? abilityId,
      publishStatus: "review-candidate",
      sources: ["pokeapi"]
    };
  });
  const pokemonAbilities = pokemon.map((entry) => {
    const pageUrl = learnsetByPokemonId.get(entry.id).pageUrl;
    const sourceSpeciesAbilityIds = sourceAbilityIdsByPageUrl.get(pageUrl);
    const abilityIds = [...entry.abilities].sort();
    const unconfirmedAbilityIds = abilityIds.filter(
      (abilityId) => !sourceSpeciesAbilityIds.includes(abilityId)
    );
    return {
      pokemonId: entry.id,
      championsId: entry.championsId,
      form: entry.form,
      pageUrl,
      abilityIds,
      sourceSpeciesAbilityIds,
      unconfirmedAbilityIds,
      verificationStatus: unconfirmedAbilityIds.length === 0 ? "confirmed" : "review-required",
      publishStatus: "review-candidate"
    };
  });
  const snapshot = {
    schemaVersion: 1,
    regulationId: "M-B",
    checkedAt: getCheckedAt(),
    scope: "serebii-champions-form-abilities",
    source: {
      serebiiId: "serebii-champions-pokedex",
      pokeapiId: "pokeapi",
      contentUsage: "factual-ability-identifiers-and-localized-names-only"
    },
    limitations: [
      "PokeAPI provides the form-specific mapping and localized names; Serebii confirms each ability on the species Champions page.",
      "Serebii and PokeAPI ability descriptions are not copied.",
      "Mappings remain review candidates until promoted for public strategy guidance."
    ],
    summary: {
      pokemonCount: pokemon.length,
      abilityCount: abilities.length,
      missingKoreanNameCount: abilities.filter((entry) => entry.nameKo === null).length,
      reviewRequiredCount: pokemonAbilities.filter(
        (entry) => entry.verificationStatus === "review-required"
      ).length
    },
    abilities,
    pokemonAbilities
  };

  validateChampionsAbilitySnapshot(snapshot, pokemon);
  await mkdir(generatedDirectory, { recursive: true });
  await writeJsonAtomically(outputPath, snapshot);
  console.log(
    `Champions abilities written: ${snapshot.summary.pokemonCount} Pokemon; ${snapshot.summary.abilityCount} abilities; ${snapshot.summary.reviewRequiredCount} review required.`
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
