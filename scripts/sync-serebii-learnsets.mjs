import { mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  readJson,
  validateMoveCandidateSnapshot,
  validatePokemonMoveCandidateSnapshot,
  validateRegulationRosterSnapshot,
  validateSyncedRegulationPokemon
} from "./lib/pokemon-data.mjs";
import {
  createPriorLearnsetIndex,
  extractSerebiiMoveIds,
  parseSerebiiPokedexIndex,
  resolvePriorLearnset,
  resolveSerebiiFormConfig,
  validateFullSerebiiLearnsetSnapshot,
  validateSerebiiLearnsetReviewSnapshot
} from "./lib/serebii-learnset-data.mjs";

const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const generatedDirectory = path.join(rootDirectory, "data", "generated");
const rosterPath = path.join(generatedDirectory, "champions-roster-m-b.json");
const pokemonPath = path.join(generatedDirectory, "pokemon-m-b-preview.json");
const moveCandidatePath = path.join(generatedDirectory, "moves-m-b-candidates.json");
const pokemonMoveCandidatePath = path.join(
  generatedDirectory,
  "pokemon-move-candidates-m-b.json"
);
const outputPath = path.join(generatedDirectory, "serebii-learnsets-m-b.json");
const reviewOutputPath = path.join(
  generatedDirectory,
  "serebii-learnset-review-m-b.json"
);
const serebiiIndexUrl = "https://www.serebii.net/pokedex-champions/";
const priorDatasetUrl =
  "https://raw.githubusercontent.com/otterlyclueless/pokemon-champions-data/main/learnsets/learnsets.json";
const priorVersionUrl =
  "https://raw.githubusercontent.com/otterlyclueless/pokemon-champions-data/main/meta/version.json";
const concurrency = 3;

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
          "User-Agent": "pokemon-central-serebii-full-sync/0.1"
        },
        signal: AbortSignal.timeout(25_000)
      });
      if (response.ok) {
        return parse(response);
      }
      lastError = new Error(
        `Learnset request failed for ${url}: ${response.status} ${response.statusText}`
      );
      if (response.status !== 429 && response.status < 500) {
        throw lastError;
      }
    } catch (error) {
      lastError = error;
    }

    if (attempt < 2) {
      await wait(750 * 2 ** attempt);
    }
  }
  throw lastError;
}

function fetchText(url) {
  return fetchResource(url, "text/html", (response) => response.text());
}

function fetchJson(url) {
  return fetchResource(url, "application/json", (response) => response.json());
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
      if (completed % 25 === 0 || completed === values.length) {
        console.log(`Loaded Serebii pages ${completed}/${values.length}`);
      }
      await wait(150);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, values.length) }, () => worker()));
  return results;
}

function difference(values, excludedValues) {
  const excluded = new Set(excludedValues);
  return values.filter((value) => !excluded.has(value));
}

function intersection(values, comparedValues) {
  const compared = new Set(comparedValues);
  return values.filter((value) => compared.has(value));
}

function sameStrings(left, right) {
  return JSON.stringify([...left].sort()) === JSON.stringify([...right].sort());
}

function getCheckedAt() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}

async function writeJsonAtomically(filePath, value) {
  const temporaryPath = `${filePath}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(temporaryPath, filePath);
}

function getReviewReasons(entry) {
  const reasons = [`comparison-status:${entry.comparisonStatus}`];
  if (entry.unknownMoveIds.length > 0) reasons.push("unknown-move-details");
  if (entry.comparisonStatus === "parse-failed") reasons.push("parser-error");
  if (entry.priorMappingStatus === "collapsed") reasons.push("prior-source-collapsed-forms");
  return Array.from(new Set(reasons));
}

async function main() {
  const roster = validateRegulationRosterSnapshot(await readJson(rosterPath));
  const pokemon = validateSyncedRegulationPokemon(await readJson(pokemonPath), roster);
  const moveCandidates = validateMoveCandidateSnapshot(await readJson(moveCandidatePath));
  const pokemonMoveCandidates = validatePokemonMoveCandidateSnapshot(
    await readJson(pokemonMoveCandidatePath),
    pokemon,
    moveCandidates
  );
  const [indexHtml, priorSourceLearnsets, priorVersion] = await Promise.all([
    fetchText(serebiiIndexUrl),
    fetchJson(priorDatasetUrl),
    fetchJson(priorVersionUrl)
  ]);

  const pageBySpeciesId = parseSerebiiPokedexIndex(indexHtml, serebiiIndexUrl);
  const missingPageSpeciesIds = Array.from(
    new Set(
      pokemon
        .filter((entry) => !pageBySpeciesId.has(entry.speciesId))
        .map((entry) => entry.speciesId)
    )
  );
  if (missingPageSpeciesIds.length > 0) {
    throw new Error(
      `Serebii index is missing species: ${missingPageSpeciesIds.join(", ")}`
    );
  }

  const uniquePageUrls = Array.from(
    new Set(pokemon.map((entry) => pageBySpeciesId.get(entry.speciesId)))
  );
  console.log(
    `Loading ${uniquePageUrls.length} unique Serebii pages for ${pokemon.length} M-B forms...`
  );
  const pageHtmlValues = await mapWithConcurrency(uniquePageUrls, concurrency, fetchText);
  const htmlByPageUrl = new Map(
    uniquePageUrls.map((pageUrl, index) => [pageUrl, pageHtmlValues[index]])
  );
  const priorIndex = createPriorLearnsetIndex(priorSourceLearnsets);
  const localFormCounts = new Map();
  for (const entry of pokemon) {
    localFormCounts.set(entry.speciesId, (localFormCounts.get(entry.speciesId) ?? 0) + 1);
  }
  const pokeapiMovesByPokemonId = new Map(
    pokemonMoveCandidates.entries.map((entry) => [entry.pokemonId, entry.moveIds])
  );
  const knownMoveIds = new Set(moveCandidates.entries.map((entry) => entry.id));

  const entries = pokemon.map((pokemonEntry) => {
    const pageUrl = pageBySpeciesId.get(pokemonEntry.speciesId);
    const html = htmlByPageUrl.get(pageUrl);
    const { tableHeading, specialFormName } = resolveSerebiiFormConfig(pokemonEntry);
    const prior = resolvePriorLearnset(
      pokemonEntry,
      priorIndex,
      localFormCounts.get(pokemonEntry.speciesId)
    );
    const pokeapiMoveIds = [...pokeapiMovesByPokemonId.get(pokemonEntry.id)].sort();

    try {
      const serebiiMoveIds = extractSerebiiMoveIds(
        html,
        tableHeading,
        specialFormName
      );
      const matchedMoveIds = intersection(serebiiMoveIds, prior.moveIds);
      const addedSincePriorMoveIds = difference(serebiiMoveIds, prior.moveIds);
      const removedSincePriorMoveIds = difference(prior.moveIds, serebiiMoveIds);
      const comparisonStatus =
        prior.mappingStatus === "missing"
          ? "newly-covered"
          : sameStrings(serebiiMoveIds, prior.moveIds)
            ? "exact-match"
            : prior.mappingStatus === "collapsed"
              ? "form-specific-refresh"
              : "source-updated";
      return {
        pokemonId: pokemonEntry.id,
        championsId: pokemonEntry.championsId,
        speciesId: pokemonEntry.speciesId,
        form: pokemonEntry.form,
        pageUrl,
        tableHeading,
        specialFormName,
        priorSourcePokemonName: prior.sourcePokemonName,
        priorMappingStatus: prior.mappingStatus,
        comparisonStatus,
        serebiiMoveIds,
        priorCandidateMoveIds: prior.moveIds,
        matchedMoveIds,
        addedSincePriorMoveIds,
        removedSincePriorMoveIds,
        pokeapiMoveIds,
        serebiiOnlyMoveIds: difference(serebiiMoveIds, pokeapiMoveIds),
        pokeapiOnlyMoveIds: difference(pokeapiMoveIds, serebiiMoveIds),
        unknownMoveIds: serebiiMoveIds.filter((moveId) => !knownMoveIds.has(moveId)),
        error: null,
        publishStatus: "review-candidate"
      };
    } catch (error) {
      return {
        pokemonId: pokemonEntry.id,
        championsId: pokemonEntry.championsId,
        speciesId: pokemonEntry.speciesId,
        form: pokemonEntry.form,
        pageUrl,
        tableHeading,
        specialFormName,
        priorSourcePokemonName: prior.sourcePokemonName,
        priorMappingStatus: prior.mappingStatus,
        comparisonStatus: "parse-failed",
        serebiiMoveIds: [],
        priorCandidateMoveIds: prior.moveIds,
        matchedMoveIds: [],
        addedSincePriorMoveIds: [],
        removedSincePriorMoveIds: [],
        pokeapiMoveIds,
        serebiiOnlyMoveIds: [],
        pokeapiOnlyMoveIds: pokeapiMoveIds,
        unknownMoveIds: [],
        error: error instanceof Error ? error.message : String(error),
        publishStatus: "review-candidate"
      };
    }
  });

  const incineroar = entries.find((entry) => entry.pokemonId === "incineroar");
  const snapshot = {
    schemaVersion: 1,
    regulationId: roster.regulationId,
    checkedAt: getCheckedAt(),
    rosterCheckedAt: roster.checkedAt,
    scope: "serebii-current-learnsets",
    source: {
      id: "serebii-champions-pokedex",
      indexUrl: serebiiIndexUrl,
      relationshipToPrior: "upstream-source-refresh",
      independentVerification: false,
      contentUsage: "factual-move-identifiers-only",
      priorDatasetUrl,
      priorVersionUrl,
      priorDatasetVersion: priorVersion.version,
      priorLastUpdated: priorVersion.lastUpdated,
      priorLicense: "CC-BY-4.0",
      priorAttribution: "Pokemon Champions Data Contributors"
    },
    limitations: [
      "The prior community dataset identifies Serebii as its learnset source, so this is not independent verification.",
      "Serebii move descriptions are not copied; only factual move identifiers are retained.",
      "Non-matching and newly covered entries remain review candidates."
    ],
    sourceChecks: {
      incineroarExcludesKnockOff:
        incineroar !== undefined && !incineroar.serebiiMoveIds.includes("knock-off"),
      psybeamUserCount: entries.filter((entry) => entry.serebiiMoveIds.includes("psybeam"))
        .length
    },
    summary: {
      pokemonCount: entries.length,
      uniquePageCount: uniquePageUrls.length,
      exactMatchCount: entries.filter((entry) => entry.comparisonStatus === "exact-match")
        .length,
      sourceUpdatedCount: entries.filter(
        (entry) => entry.comparisonStatus === "source-updated"
      ).length,
      formReviewCount: entries.filter(
        (entry) => entry.comparisonStatus === "form-specific-refresh"
      ).length,
      newlyCoveredCount: entries.filter(
        (entry) => entry.comparisonStatus === "newly-covered"
      ).length,
      parseFailedCount: entries.filter(
        (entry) => entry.comparisonStatus === "parse-failed"
      ).length,
      moveReferenceCount: entries.reduce(
        (total, entry) => total + entry.serebiiMoveIds.length,
        0
      ),
      unknownMoveReferenceCount: entries.reduce(
        (total, entry) => total + entry.unknownMoveIds.length,
        0
      )
    },
    entries
  };

  const reviewEntries = entries
    .filter(
      (entry) => entry.comparisonStatus === "parse-failed" || entry.unknownMoveIds.length > 0
    )
    .map((entry) => ({
      pokemonId: entry.pokemonId,
      championsId: entry.championsId,
      form: entry.form,
      comparisonStatus: entry.comparisonStatus,
      pageUrl: entry.pageUrl,
      currentMoveCount: entry.serebiiMoveIds.length,
      priorMoveCount: entry.priorCandidateMoveIds.length,
      addedMoveIds: entry.addedSincePriorMoveIds,
      removedMoveIds: entry.removedSincePriorMoveIds,
      unknownMoveIds: entry.unknownMoveIds,
      reviewReasons: getReviewReasons(entry)
    }));
  const reviewSnapshot = {
    schemaVersion: 1,
    regulationId: snapshot.regulationId,
    checkedAt: snapshot.checkedAt,
    scope: "serebii-learnset-review",
    sourceSnapshot: "data/generated/serebii-learnsets-m-b.json",
    summary: {
      reviewCount: reviewEntries.length,
      sourceUpdatedCount: reviewEntries.filter(
        (entry) => entry.comparisonStatus === "source-updated"
      ).length,
      formReviewCount: reviewEntries.filter(
        (entry) => entry.comparisonStatus === "form-specific-refresh"
      ).length,
      newlyCoveredCount: reviewEntries.filter(
        (entry) => entry.comparisonStatus === "newly-covered"
      ).length,
      parseFailedCount: reviewEntries.filter(
        (entry) => entry.comparisonStatus === "parse-failed"
      ).length
    },
    entries: reviewEntries
  };

  validateFullSerebiiLearnsetSnapshot(
    snapshot,
    roster,
    pokemon,
    pokemonMoveCandidates,
    moveCandidates
  );
  validateSerebiiLearnsetReviewSnapshot(reviewSnapshot, snapshot);
  await mkdir(generatedDirectory, { recursive: true });
  await Promise.all([
    writeJsonAtomically(outputPath, snapshot),
    writeJsonAtomically(reviewOutputPath, reviewSnapshot)
  ]);
  console.log(
    `Serebii M-B learnsets written: ${snapshot.summary.pokemonCount} forms; ${snapshot.summary.exactMatchCount} exact; ${reviewSnapshot.summary.reviewCount} review; ${snapshot.summary.parseFailedCount} failed.`
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
