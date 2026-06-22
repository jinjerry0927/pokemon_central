import { mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  parseChampionsHeldItems,
  validateChampionsItemSnapshot
} from "./lib/champions-item-data.mjs";

const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = path.join(rootDirectory, "data", "generated");
const outputPath = path.join(outputDirectory, "champions-items-m-b.json");
const itemsUrl = "https://www.serebii.net/pokemonchampions/items.shtml";
const officialRegulationUrl = "https://champions-news.pokemon-home.com/en/page/776.html";
const pokeapiBaseUrl = "https://pokeapi.co/api/v2";
const concurrency = 10;

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
          "User-Agent": "pokemon-central-champions-item-sync/0.1"
        },
        signal: AbortSignal.timeout(20_000)
      });
      if (response.ok) return response.text();
      lastError = new Error(`Item source request failed: ${response.status} ${response.statusText}`);
      if (response.status !== 429 && response.status < 500) throw lastError;
    } catch (error) {
      lastError = error;
    }
    if (attempt < 2) await wait(500 * 2 ** attempt);
  }
  throw lastError;
}

async function fetchPokeapiItem(itemId) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(`${pokeapiBaseUrl}/item/${itemId}`, {
        headers: {
          Accept: "application/json",
          "User-Agent": "pokemon-central-champions-item-sync/0.1"
        },
        signal: AbortSignal.timeout(20_000)
      });
      if (response.status === 404) return null;
      if (response.ok) return response.json();
      lastError = new Error(
        `PokeAPI item request failed for ${itemId}: ${response.status} ${response.statusText}`
      );
      if (response.status !== 429 && response.status < 500) throw lastError;
    } catch (error) {
      lastError = error;
    }
    if (attempt < 2) await wait(500 * 2 ** attempt);
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
      if (completed % 20 === 0 || completed === values.length) {
        console.log(`Loaded item details ${completed}/${values.length}`);
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
  const html = await fetchText(itemsUrl);
  const sourceEntries = parseChampionsHeldItems(html);
  console.log(`Loading ${sourceEntries.length} Champions held item candidates...`);
  const entries = await mapWithConcurrency(sourceEntries, concurrency, async (entry) => {
    const pokeapiItem = await fetchPokeapiItem(entry.id);
    const nameKo = pokeapiItem ? getLocalizedName(pokeapiItem.names, "ko") : null;
    return {
      id: entry.id,
      nameKo,
      nameEn: entry.nameEn,
      category: entry.category,
      itemDexUrl: new URL(entry.itemDexPath, itemsUrl).href,
      pokeapiId: pokeapiItem?.id ?? null,
      pokeapiStatus: pokeapiItem ? "matched" : "missing",
      localizationStatus: nameKo ? "complete" : "missing-ko",
      publishStatus: "review-candidate",
      sources: ["serebii-champions-items", ...(pokeapiItem ? ["pokeapi"] : [])]
    };
  });
  const snapshot = {
    schemaVersion: 1,
    regulationId: "M-B",
    checkedAt: getCheckedAt(),
    scope: "serebii-champions-held-items",
    source: {
      id: "serebii-champions-items",
      itemsUrl,
      officialRegulationUrl,
      contentUsage: "factual-item-identifiers-only"
    },
    rules: {
      duplicateHeldItemsAllowed: false,
      evidence: "Duplicate held items are not allowed.",
      evidenceUrl: officialRegulationUrl
    },
    limitations: [
      "Only Hold Items and Berries are collected; miscellaneous non-held items are excluded.",
      "Serebii item descriptions are not copied; only factual identifiers and categories are retained.",
      "Entries remain review candidates until promoted for public item guidance."
    ],
    summary: {
      itemCount: entries.length,
      heldItemCount: entries.filter((entry) => entry.category === "held-item").length,
      berryCount: entries.filter((entry) => entry.category === "berry").length,
      pokeapiMatchedCount: entries.filter((entry) => entry.pokeapiStatus === "matched").length,
      pokeapiMissingCount: entries.filter((entry) => entry.pokeapiStatus === "missing").length,
      missingKoreanNameCount: entries.filter((entry) => entry.nameKo === null).length
    },
    entries: entries.sort((left, right) => left.id.localeCompare(right.id))
  };

  validateChampionsItemSnapshot(snapshot);
  await mkdir(outputDirectory, { recursive: true });
  await writeJsonAtomically(outputPath, snapshot);
  console.log(
    `Champions items written: ${snapshot.summary.itemCount} items; ${snapshot.summary.pokeapiMatchedCount} PokeAPI matches; ${snapshot.summary.missingKoreanNameCount} missing Korean names.`
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
