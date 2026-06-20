import { mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateRegulationRosterSnapshot } from "./lib/pokemon-data.mjs";

const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = path.join(rootDirectory, "data", "generated");
const newsListUrl = "https://champions-news.pokemon-home.com/en/json/list.json";
const targetRegulationId = readArgument("--regulation") ?? "M-B";
const outputPath = path.join(
  outputDirectory,
  `champions-roster-${targetRegulationId.toLowerCase()}.json`
);
const temporaryOutputPath = `${outputPath}.tmp`;

const formMappings = new Map([
  ["0026-001", { form: "alolan", pokeapiSlug: "raichu-alola" }],
  ["0038-001", { form: "alolan", pokeapiSlug: "ninetales-alola" }],
  ["0059-001", { form: "hisuian", pokeapiSlug: "arcanine-hisui" }],
  ["0080-002", { form: "galarian", pokeapiSlug: "slowbro-galar" }],
  ["0128-001", { form: "paldean-combat", pokeapiSlug: "tauros-paldea-combat-breed" }],
  ["0128-002", { form: "paldean-blaze", pokeapiSlug: "tauros-paldea-blaze-breed" }],
  ["0128-003", { form: "paldean-aqua", pokeapiSlug: "tauros-paldea-aqua-breed" }],
  ["0157-001", { form: "hisuian", pokeapiSlug: "typhlosion-hisui" }],
  ["0199-001", { form: "galarian", pokeapiSlug: "slowking-galar" }],
  ["0479-000", { form: "normal", pokeapiSlug: "rotom" }],
  ["0479-001", { form: "heat", pokeapiSlug: "rotom-heat" }],
  ["0479-002", { form: "wash", pokeapiSlug: "rotom-wash" }],
  ["0479-003", { form: "frost", pokeapiSlug: "rotom-frost" }],
  ["0479-004", { form: "fan", pokeapiSlug: "rotom-fan" }],
  ["0479-005", { form: "mow", pokeapiSlug: "rotom-mow" }],
  ["0503-001", { form: "hisuian", pokeapiSlug: "samurott-hisui" }],
  ["0571-001", { form: "hisuian", pokeapiSlug: "zoroark-hisui" }],
  ["0618-001", { form: "galarian", pokeapiSlug: "stunfisk-galar" }],
  ["0666-018", { form: "champions-default", pokeapiSlug: "vivillon" }],
  ["0668-000", { form: "male", pokeapiSlug: "pyroar-male" }],
  ["0670-005", { form: "eternal-flower", pokeapiSlug: "floette-eternal" }],
  ["0678-000", { form: "male", pokeapiSlug: "meowstic-male" }],
  ["0678-001", { form: "female", pokeapiSlug: "meowstic-female" }],
  ["0681-000", { form: "shield", pokeapiSlug: "aegislash-shield" }],
  ["0706-001", { form: "hisuian", pokeapiSlug: "goodra-hisui" }],
  ["0711-000", { form: "medium", pokeapiSlug: "gourgeist-average" }],
  ["0711-001", { form: "small", pokeapiSlug: "gourgeist-small" }],
  ["0711-002", { form: "large", pokeapiSlug: "gourgeist-large" }],
  ["0711-003", { form: "jumbo", pokeapiSlug: "gourgeist-super" }],
  ["0713-001", { form: "hisuian", pokeapiSlug: "avalugg-hisui" }],
  ["0724-001", { form: "hisuian", pokeapiSlug: "decidueye-hisui" }],
  ["0745-000", { form: "midday", pokeapiSlug: "lycanroc-midday" }],
  ["0745-001", { form: "midnight", pokeapiSlug: "lycanroc-midnight" }],
  ["0745-002", { form: "dusk", pokeapiSlug: "lycanroc-dusk" }],
  ["0778-000", { form: "disguised", pokeapiSlug: "mimikyu-disguised" }],
  ["0877-000", { form: "full-belly", pokeapiSlug: "morpeko-full-belly" }],
  ["0902-000", { form: "male", pokeapiSlug: "basculegion-male" }],
  ["0902-001", { form: "female", pokeapiSlug: "basculegion-female" }],
  ["0925-000", { form: "family-of-four", pokeapiSlug: "maushold-family-of-four" }],
  ["0964-000", { form: "zero", pokeapiSlug: "palafin-zero" }]
]);

function readArgument(name) {
  const prefix = `${name}=`;
  return process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length);
}

function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeOfficialEntry([championsId, , nameEn]) {
  const [speciesCode, formCode] = championsId.split("-");
  const speciesId = Number(speciesCode);
  const explicitMapping = formMappings.get(championsId);
  const baseName = nameEn.split(" (")[0];

  if (!explicitMapping && formCode !== "000") {
    throw new Error(`Missing form mapping for ${championsId} ${nameEn}.`);
  }

  return {
    championsId,
    speciesId,
    pokeapiSlug: explicitMapping?.pokeapiSlug ?? slugify(baseName),
    form: explicitMapping?.form ?? "base",
    nameEn
  };
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "text/html,application/json",
      "User-Agent": "pokemon-central-roster-sync/0.1"
    },
    signal: AbortSignal.timeout(20_000)
  });

  if (!response.ok) {
    throw new Error(`Official Champions request failed: ${response.status} ${response.statusText} (${url})`);
  }

  return response.text();
}

function parseEligibleUrl(articleHtml, articleUrl) {
  const match = articleHtml.match(/href="([^"]+\/pokemon\.html)"[^>]*>Eligible Pokémon<\/a>/i);

  if (!match) {
    throw new Error(`Eligible Pokémon link was not found in ${articleUrl}.`);
  }

  return new URL(match[1], articleUrl).toString();
}

function parseEligiblePokemon(pageHtml, sourceUrl) {
  const match = pageHtml.match(/const pokemons = (\[.*?\]);const noPrefix/s);

  if (!match) {
    throw new Error(`Official Pokémon array was not found in ${sourceUrl}.`);
  }

  const rows = JSON.parse(match[1]);
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error(`Official Pokémon array is empty in ${sourceUrl}.`);
  }

  return rows.map(normalizeOfficialEntry);
}

async function loadRegulationSnapshot(article) {
  const articleUrl = new URL(article.link, "https://champions-news.pokemon-home.com/en/").toString();
  const articleHtml = await fetchText(articleUrl);
  const eligiblePokemonUrl = parseEligibleUrl(articleHtml, articleUrl);
  const eligiblePokemon = parseEligiblePokemon(await fetchText(eligiblePokemonUrl), eligiblePokemonUrl);

  return {
    regulationId: article.regulationId,
    publishedAt: article.stAt,
    articleUrl,
    eligiblePokemonUrl,
    eligiblePokemon
  };
}

async function main() {
  const news = JSON.parse(await fetchText(newsListUrl));
  const regulationArticles = news.data
    .map((article) => {
      const match = article.title.match(/^Regulation Set (.+)$/);
      return match ? { ...article, regulationId: match[1] } : null;
    })
    .filter(Boolean)
    .sort((left, right) => left.stAt - right.stAt);
  const targetArticleIndex = regulationArticles.findIndex(
    (article) => article.regulationId === targetRegulationId
  );

  if (targetArticleIndex < 0) {
    throw new Error(`Regulation Set ${targetRegulationId} was not found in the official news list.`);
  }

  const relevantArticles = regulationArticles.slice(0, targetArticleIndex + 1);
  console.log(
    `Loading official regulation snapshots: ${relevantArticles.map((article) => article.regulationId).join(", ")}`
  );
  const regulationSnapshots = [];
  for (const article of relevantArticles) {
    regulationSnapshots.push(await loadRegulationSnapshot(article));
  }

  const targetSnapshot = regulationSnapshots.at(-1);
  const firstSeenByChampionsId = new Map();
  for (const snapshot of regulationSnapshots) {
    for (const entry of snapshot.eligiblePokemon) {
      if (!firstSeenByChampionsId.has(entry.championsId)) {
        firstSeenByChampionsId.set(entry.championsId, snapshot.regulationId);
      }
    }
  }

  const checkedAt = new Date().toISOString().slice(0, 10);
  const entries = targetSnapshot.eligiblePokemon.map((entry) => ({
    ...entry,
    status: "confirmed",
    currentEligible: true,
    firstSeenRegulation: firstSeenByChampionsId.get(entry.championsId),
    evidenceUrl: targetSnapshot.eligiblePokemonUrl,
    lastChecked: checkedAt,
    publishStatus: "review-candidate"
  }));
  const previousSnapshot = regulationSnapshots.at(-2);
  const previousIds = new Set(
    previousSnapshot?.eligiblePokemon.map((entry) => entry.championsId) ?? []
  );
  const addedSincePrevious = entries
    .filter((entry) => !previousIds.has(entry.championsId))
    .map((entry) => entry.championsId);
  const snapshot = {
    schemaVersion: 1,
    regulationId: targetSnapshot.regulationId,
    checkedAt,
    sources: {
      newsListUrl,
      articleUrl: targetSnapshot.articleUrl,
      eligiblePokemonUrl: targetSnapshot.eligiblePokemonUrl
    },
    previousRegulationId: previousSnapshot?.regulationId ?? null,
    addedSincePrevious,
    entries
  };

  validateRegulationRosterSnapshot(snapshot);
  await mkdir(outputDirectory, { recursive: true });
  await writeFile(temporaryOutputPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  await rename(temporaryOutputPath, outputPath);
  console.log(
    `Official roster written: ${path.relative(rootDirectory, outputPath)} (${entries.length} forms; ${addedSincePrevious.length} added since ${snapshot.previousRegulationId ?? "none"})`
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
