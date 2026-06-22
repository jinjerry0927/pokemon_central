import { mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  readJson,
  validateChampionsLearnsetPilotSnapshot,
  validateMoveCandidateSnapshot,
  validatePokemonMoveCandidateSnapshot,
  validateRegulationRosterSnapshot,
  validateSerebiiLearnsetPilotSnapshot,
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
const priorPilotPath = path.join(generatedDirectory, "champions-learnset-pilot-m-b.json");
const outputPath = path.join(generatedDirectory, "serebii-learnset-pilot-m-b.json");
const pokedexBaseUrl = "https://www.serebii.net/pokedex-champions";

const pilotCases = [
  { pokemonId: "venusaur", pageSlug: "venusaur", tableHeading: "Standard Moves" },
  {
    pokemonId: "raichu-alola",
    pageSlug: "raichu",
    tableHeading: "Alola Form Standard Moves"
  },
  {
    pokemonId: "rotom-wash",
    pageSlug: "rotom",
    tableHeading: "Standard Moves",
    specialFormName: "Wash Rotom"
  },
  { pokemonId: "incineroar", pageSlug: "incineroar", tableHeading: "Standard Moves" },
  { pokemonId: "gholdengo", pageSlug: "gholdengo", tableHeading: "Standard Moves" }
];

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function fetchText(url) {
  let lastError;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: "text/html",
          "User-Agent": "pokemon-central-serebii-learnset-pilot/0.1"
        },
        signal: AbortSignal.timeout(20_000)
      });

      if (response.ok) {
        return response.text();
      }
      lastError = new Error(
        `Serebii request failed for ${url}: ${response.status} ${response.statusText}`
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

function decodeHtml(value) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&amp;/gi, "&")
    .replace(/&apos;|&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&eacute;/gi, "é")
    .replace(/&nbsp;/gi, " ");
}

function stripHtml(value) {
  return decodeHtml(value.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function toMoveId(name) {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function extractTables(html) {
  return Array.from(html.matchAll(/<table\s+class="dextable">[\s\S]*?<\/table>/gi), (match) =>
    match[0]
  );
}

function extractMoveIds(tableHtml) {
  return Array.from(
    new Set(
      Array.from(
        tableHtml.matchAll(
          /<a href="\/attackdex-champions\/[^\"]+\.shtml">(?<name>[^<]+)<\/a>/gi
        ),
        (match) => toMoveId(decodeHtml(match.groups.name))
      )
    )
  ).sort();
}

function extractStandardMoveIds(html, tableHeading) {
  const table = extractTables(html).find((candidate) => {
    const heading = candidate.match(/<h3>(?<heading>[\s\S]*?)<\/h3>/i)?.groups.heading;
    return heading !== undefined && stripHtml(heading) === tableHeading;
  });
  if (!table) {
    throw new Error(`Serebii table not found: ${tableHeading}`);
  }
  return extractMoveIds(table);
}

function extractSpecialFormMoveIds(html, formName) {
  const specialMovesTable = extractTables(html).find((candidate) =>
    />\s*Special Moves\s*</i.test(candidate)
  );
  if (!specialMovesTable) {
    throw new Error(`Serebii Special Moves table not found for ${formName}.`);
  }

  return Array.from(
    new Set(
      specialMovesTable
        .split(/<tr><td rowspan="2" class="fooinfo">/i)
        .slice(1)
        .filter((segment) => segment.includes(`alt="${formName}"`))
        .map((segment) => {
          const moveName = segment.match(
            /<a href="\/attackdex-champions\/[^\"]+\.shtml">(?<name>[^<]+)<\/a>/i
          )?.groups.name;
          if (!moveName) {
            throw new Error(`Serebii Special Moves entry is missing a move name for ${formName}.`);
          }
          return toMoveId(decodeHtml(moveName));
        })
    )
  ).sort();
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
  const priorPilot = validateChampionsLearnsetPilotSnapshot(
    await readJson(priorPilotPath),
    pokemon,
    pokemonMoveCandidates,
    moveCandidates
  );

  const pokemonById = new Map(pokemon.map((entry) => [entry.id, entry]));
  const priorByPokemonId = new Map(
    priorPilot.entries.map((entry) => [entry.pokemonId, entry])
  );
  const pokeapiMovesByPokemonId = new Map(
    pokemonMoveCandidates.entries.map((entry) => [entry.pokemonId, entry.moveIds])
  );
  const knownMoveIds = new Set(moveCandidates.entries.map((entry) => entry.id));
  const entries = [];

  for (const pilotCase of pilotCases) {
    const pokemonEntry = pokemonById.get(pilotCase.pokemonId);
    const priorEntry = priorByPokemonId.get(pilotCase.pokemonId);
    const pokeapiMoveIds = [...(pokeapiMovesByPokemonId.get(pilotCase.pokemonId) ?? [])].sort();
    if (!pokemonEntry || !priorEntry || pokeapiMoveIds.length === 0) {
      throw new Error(`Pilot Pokémon ${pilotCase.pokemonId} is missing from local candidate data.`);
    }

    const pageUrl = `${pokedexBaseUrl}/${pilotCase.pageSlug}/`;
    const html = await fetchText(pageUrl);
    const standardMoveIds = extractStandardMoveIds(html, pilotCase.tableHeading);
    const specialFormMoveIds = pilotCase.specialFormName
      ? extractSpecialFormMoveIds(html, pilotCase.specialFormName)
      : [];
    const serebiiMoveIds = Array.from(
      new Set([...standardMoveIds, ...specialFormMoveIds])
    ).sort();
    const priorCandidateMoveIds = [...priorEntry.championsMoveCandidateIds].sort();
    const addedSincePriorMoveIds = difference(serebiiMoveIds, priorCandidateMoveIds);
    const removedSincePriorMoveIds = difference(priorCandidateMoveIds, serebiiMoveIds);
    const comparisonStatus =
      priorCandidateMoveIds.length === 0
        ? "newly-covered"
        : pilotCase.specialFormName
          ? "form-specific-refresh"
          : addedSincePriorMoveIds.length > 0 || removedSincePriorMoveIds.length > 0
            ? "source-updated"
            : "exact-match";

    entries.push({
      pokemonId: pokemonEntry.id,
      championsId: pokemonEntry.championsId,
      pageUrl,
      tableHeading: pilotCase.tableHeading,
      specialFormName: pilotCase.specialFormName ?? null,
      comparisonStatus,
      serebiiMoveIds,
      priorCandidateMoveIds,
      matchedMoveIds: intersection(serebiiMoveIds, priorCandidateMoveIds),
      addedSincePriorMoveIds,
      removedSincePriorMoveIds,
      pokeapiMoveIds,
      serebiiOnlyMoveIds: difference(serebiiMoveIds, pokeapiMoveIds),
      pokeapiOnlyMoveIds: difference(pokeapiMoveIds, serebiiMoveIds),
      unknownMoveIds: serebiiMoveIds.filter((moveId) => !knownMoveIds.has(moveId)),
      publishStatus: "review-candidate"
    });

    await wait(250);
  }

  const incineroar = entries.find((entry) => entry.pokemonId === "incineroar");
  const snapshot = {
    schemaVersion: 1,
    regulationId: roster.regulationId,
    checkedAt: roster.checkedAt,
    scope: "serebii-current-learnset-pilot",
    source: {
      id: "serebii-champions-pokedex",
      baseUrl: `${pokedexBaseUrl}/`,
      relationshipToPrimary: "upstream-source-refresh",
      independentVerification: false,
      contentUsage: "factual-move-identifiers-only"
    },
    limitations: [
      "The prior community dataset identifies Serebii as its learnset source, so this is not independent verification.",
      "Serebii move descriptions are not copied; only factual move identifiers are retained.",
      "Changed or newly covered entries remain review candidates until conflict-focused verification."
    ],
    sourceChecks: {
      incineroarExcludesKnockOff:
        incineroar !== undefined && !incineroar.serebiiMoveIds.includes("knock-off"),
      pilotContainsPsybeam: entries.some((entry) => entry.serebiiMoveIds.includes("psybeam"))
    },
    summary: {
      pilotPokemonCount: entries.length,
      exactMatchCount: entries.filter((entry) => entry.comparisonStatus === "exact-match")
        .length,
      changedCount: entries.filter((entry) =>
        ["source-updated", "form-specific-refresh"].includes(entry.comparisonStatus)
      ).length,
      newlyCoveredCount: entries.filter(
        (entry) => entry.comparisonStatus === "newly-covered"
      ).length,
      currentMoveReferenceCount: entries.reduce(
        (total, entry) => total + entry.serebiiMoveIds.length,
        0
      )
    },
    entries
  };

  validateSerebiiLearnsetPilotSnapshot(
    snapshot,
    priorPilot,
    pokemon,
    pokemonMoveCandidates,
    moveCandidates
  );
  await mkdir(generatedDirectory, { recursive: true });
  await writeJsonAtomically(outputPath, snapshot);
  console.log(
    `Serebii learnset pilot written: ${snapshot.summary.exactMatchCount} exact; ${snapshot.summary.changedCount} changed; ${snapshot.summary.newlyCoveredCount} newly covered.`
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
