import { mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  readJson,
  validateChampionsLearnsetPilotSnapshot,
  validateMoveCandidateSnapshot,
  validatePokemonMoveCandidateSnapshot,
  validateRegulationRosterSnapshot,
  validateSyncedRegulationPokemon
} from "./lib/pokemon-data.mjs";

const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const generatedDirectory = path.join(rootDirectory, "data", "generated");
const rosterPath = path.join(generatedDirectory, "champions-roster-m-b.json");
const pokemonPath = path.join(generatedDirectory, "pokemon-m-b-preview.json");
const moveCandidatePath = path.join(generatedDirectory, "moves-m-b-candidates.json");
const pokemonMoveCandidatePath = path.join(
  generatedDirectory,
  "pokemon-move-candidates-m-b.json"
);
const outputPath = path.join(generatedDirectory, "champions-learnset-pilot-m-b.json");
const repositoryUrl = "https://github.com/otterlyclueless/pokemon-champions-data";
const rawBaseUrl =
  "https://raw.githubusercontent.com/otterlyclueless/pokemon-champions-data/main";
const learnsetsUrl = `${rawBaseUrl}/learnsets/learnsets.json`;
const versionUrl = `${rawBaseUrl}/meta/version.json`;

const pilotCases = [
  { pokemonId: "venusaur", sourcePokemonName: "Venusaur", formMapping: "exact" },
  {
    pokemonId: "raichu-alola",
    sourcePokemonName: "Alolan Raichu",
    formMapping: "exact"
  },
  { pokemonId: "rotom-wash", sourcePokemonName: "Rotom", formMapping: "collapsed" },
  { pokemonId: "incineroar", sourcePokemonName: "Incineroar", formMapping: "exact" },
  { pokemonId: "gholdengo", sourcePokemonName: "Gholdengo", formMapping: "missing" }
];

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function fetchJson(url) {
  let lastError;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "pokemon-central-champions-learnset-pilot/0.1"
        },
        signal: AbortSignal.timeout(20_000)
      });

      if (response.ok) {
        return response.json();
      }
      lastError = new Error(
        `Champions learnset request failed: ${response.status} ${response.statusText}`
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

function toMoveId(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function difference(values, excludedValues) {
  const excluded = new Set(excludedValues);
  return values.filter((value) => !excluded.has(value));
}

function intersection(values, comparedValues) {
  const compared = new Set(comparedValues);
  return values.filter((value) => compared.has(value));
}

async function writeJsonAtomically(filePath, value) {
  const temporaryPath = `${filePath}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(temporaryPath, filePath);
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
  const [sourceVersion, sourceLearnsets] = await Promise.all([
    fetchJson(versionUrl),
    fetchJson(learnsetsUrl)
  ]);

  const pokemonById = new Map(pokemon.map((entry) => [entry.id, entry]));
  const pokeapiMovesByPokemonId = new Map(
    pokemonMoveCandidates.entries.map((entry) => [entry.pokemonId, entry.moveIds])
  );
  const knownMoveIds = new Set(moveCandidates.entries.map((entry) => entry.id));

  const entries = pilotCases.map((pilotCase) => {
    const pokemonEntry = pokemonById.get(pilotCase.pokemonId);
    const pokeapiMoveIds = [...(pokeapiMovesByPokemonId.get(pilotCase.pokemonId) ?? [])].sort();
    if (!pokemonEntry || pokeapiMoveIds.length === 0) {
      throw new Error(`Pilot Pokémon ${pilotCase.pokemonId} is missing from local M-B data.`);
    }

    const sourceEntry = sourceLearnsets[pilotCase.sourcePokemonName];
    if (!sourceEntry) {
      return {
        pokemonId: pokemonEntry.id,
        championsId: pokemonEntry.championsId,
        sourcePokemonName: pilotCase.sourcePokemonName,
        formMapping: pilotCase.formMapping,
        candidateStatus: "source-missing",
        sourceClaimsVerified: false,
        sourceEvidence: null,
        championsMoveCandidateIds: [],
        pokeapiMoveIds,
        intersectionMoveIds: [],
        sourceOnlyMoveIds: [],
        pokeapiOnlyMoveIds: pokeapiMoveIds,
        unknownMoveIds: [],
        publishStatus: "review-candidate"
      };
    }

    const championsMoveCandidateIds = Array.from(
      new Set(sourceEntry.moves.map((move) => toMoveId(move.name)))
    ).sort();
    if (sourceEntry.moveCount !== championsMoveCandidateIds.length) {
      throw new Error(
        `${pilotCase.sourcePokemonName} source moveCount does not match its move list.`
      );
    }

    return {
      pokemonId: pokemonEntry.id,
      championsId: pokemonEntry.championsId,
      sourcePokemonName: pilotCase.sourcePokemonName,
      formMapping: pilotCase.formMapping,
      candidateStatus:
        pilotCase.formMapping === "collapsed"
          ? "form-review-required"
          : "source-candidate",
      sourceClaimsVerified: sourceEntry.championsVerified === true,
      sourceEvidence: sourceEntry.source ?? null,
      championsMoveCandidateIds,
      pokeapiMoveIds,
      intersectionMoveIds: intersection(championsMoveCandidateIds, pokeapiMoveIds),
      sourceOnlyMoveIds: difference(championsMoveCandidateIds, pokeapiMoveIds),
      pokeapiOnlyMoveIds: difference(pokeapiMoveIds, championsMoveCandidateIds),
      unknownMoveIds: championsMoveCandidateIds.filter((moveId) => !knownMoveIds.has(moveId)),
      publishStatus: "review-candidate"
    };
  });

  const allSourceEntries = Object.values(sourceLearnsets);
  const psybeamUserCount = allSourceEntries.filter((entry) =>
    entry.moves.some((move) => toMoveId(move.name) === "psybeam")
  ).length;
  const incineroar = entries.find((entry) => entry.pokemonId === "incineroar");
  const snapshot = {
    schemaVersion: 1,
    regulationId: roster.regulationId,
    checkedAt: roster.checkedAt,
    scope: "third-party-champions-learnset-pilot",
    source: {
      id: "pokemon-champions-data",
      repositoryUrl,
      learnsetsUrl,
      versionUrl,
      license: "CC-BY-4.0",
      datasetVersion: sourceVersion.version,
      lastUpdated: sourceVersion.lastUpdated,
      freshness:
        sourceVersion.lastUpdated < roster.checkedAt
          ? "predates-roster-check"
          : "current-or-newer-than-roster-check",
      attribution: "Pokemon Champions Data Contributors"
    },
    limitations: [
      ...(sourceVersion.lastUpdated < roster.checkedAt
        ? ["The source snapshot predates the Regulation M-B roster check."]
        : []),
      "The source repository does not provide the original Serebii page URLs or scraper.",
      "Candidate moves require independent in-game or second-source verification before publication."
    ],
    sourceChecks: {
      incineroarExcludesKnockOff:
        incineroar !== undefined &&
        !incineroar.championsMoveCandidateIds.includes("knock-off"),
      psybeamUserCount
    },
    summary: {
      pilotPokemonCount: entries.length,
      mappedPokemonCount: entries.filter((entry) => entry.candidateStatus !== "source-missing")
        .length,
      missingPokemonCount: entries.filter((entry) => entry.candidateStatus === "source-missing")
        .length,
      formReviewCount: entries.filter(
        (entry) => entry.candidateStatus === "form-review-required"
      ).length,
      candidateMoveReferenceCount: entries.reduce(
        (total, entry) => total + entry.championsMoveCandidateIds.length,
        0
      )
    },
    entries
  };

  validateChampionsLearnsetPilotSnapshot(
    snapshot,
    pokemon,
    pokemonMoveCandidates,
    moveCandidates
  );
  await mkdir(generatedDirectory, { recursive: true });
  await writeJsonAtomically(outputPath, snapshot);
  console.log(
    `Champions learnset pilot written: ${snapshot.summary.mappedPokemonCount}/${snapshot.summary.pilotPokemonCount} mapped; ${snapshot.summary.formReviewCount} form review; ${snapshot.summary.missingPokemonCount} missing.`
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
