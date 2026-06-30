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
const megaStoneAllowedPokemonIds = new Map([
  ["abomasite", ["abomasnow"]],
  ["absolite", ["absol"]],
  ["aerodactylite", ["aerodactyl"]],
  ["aggronite", ["aggron"]],
  ["alakazite", ["alakazam"]],
  ["altarianite", ["altaria"]],
  ["ampharosite", ["ampharos"]],
  ["audinite", ["audino"]],
  ["banettite", ["banette"]],
  ["barbaracite", ["barbaracle"]],
  ["beedrillite", ["beedrill"]],
  ["blastoisinite", ["blastoise"]],
  ["blazikenite", ["blaziken"]],
  ["cameruptite", ["camerupt"]],
  ["chandelurite", ["chandelure"]],
  ["charizardite-x", ["charizard"]],
  ["charizardite-y", ["charizard"]],
  ["chesnaughtite", ["chesnaught"]],
  ["chimechite", ["chimecho"]],
  ["clefablite", ["clefable"]],
  ["crabominite", ["crabominable"]],
  ["delphoxite", ["delphox"]],
  ["dragalgite", ["dragalge"]],
  ["dragoninite", ["dragonite"]],
  ["drampanite", ["drampa"]],
  ["eelektrossite", ["eelektross"]],
  ["emboarite", ["emboar"]],
  ["excadrite", ["excadrill"]],
  ["falinksite", ["falinks"]],
  ["feraligite", ["feraligatr"]],
  ["floettite", ["floette-eternal"]],
  ["froslassite", ["froslass"]],
  ["galladite", ["gallade"]],
  ["garchompite", ["garchomp"]],
  ["gardevoirite", ["gardevoir"]],
  ["gengarite", ["gengar"]],
  ["glalitite", ["glalie"]],
  ["glimmoranite", ["glimmora"]],
  ["golurkite", ["golurk"]],
  ["greninjite", ["greninja"]],
  ["gyaradosite", ["gyarados"]],
  ["hawluchanite", ["hawlucha"]],
  ["heracronite", ["heracross"]],
  ["houndoominite", ["houndoom"]],
  ["kangaskhanite", ["kangaskhan"]],
  ["lopunnite", ["lopunny"]],
  ["lucarionite", ["lucario"]],
  ["malamarite", ["malamar"]],
  ["manectite", ["manectric"]],
  ["mawilite", ["mawile"]],
  ["medichamite", ["medicham"]],
  ["meganiumite", ["meganium"]],
  ["meowsticite", ["meowstic-male", "meowstic-female"]],
  ["metagrossite", ["metagross"]],
  ["pidgeotite", ["pidgeot"]],
  ["pinsirite", ["pinsir"]],
  ["pyroarite", ["pyroar-male"]],
  ["raichunite-x", ["raichu"]],
  ["raichunite-y", ["raichu"]],
  ["sablenite", ["sableye"]],
  ["sceptilite", ["sceptile"]],
  ["scizorite", ["scizor"]],
  ["scolipite", ["scolipede"]],
  ["scovillainite", ["scovillain"]],
  ["scraftinite", ["scrafty"]],
  ["sharpedonite", ["sharpedo"]],
  ["skarmorite", ["skarmory"]],
  ["slowbronite", ["slowbro"]],
  ["staraptite", ["staraptor"]],
  ["starminite", ["starmie"]],
  ["steelixite", ["steelix"]],
  ["swampertite", ["swampert"]],
  ["tyranitarite", ["tyranitar"]],
  ["venusaurite", ["venusaur"]],
  ["victreebelite", ["victreebel"]]
]);
const megaStoneKoreanNameFallbacks = new Map([
  ["audinite", "다부니나이트"],
  ["barbaracite", "거북손데스나이트"],
  ["chandelurite", "샹델라나이트"],
  ["chesnaughtite", "브리가론나이트"],
  ["chimechite", "치렁나이트"],
  ["clefablite", "픽시나이트"],
  ["crabominite", "모단단게나이트"],
  ["delphoxite", "마폭시나이트"],
  ["dragalgite", "드래캄나이트"],
  ["dragoninite", "망나뇽나이트"],
  ["drampanite", "할비롱나이트"],
  ["eelektrossite", "저리더프나이트"],
  ["emboarite", "염무왕나이트"],
  ["excadrite", "몰드류나이트"],
  ["falinksite", "대여르나이트"],
  ["feraligite", "장크로다일나이트"],
  ["floettite", "플라엣테나이트"],
  ["froslassite", "눈여아나이트"],
  ["glimmoranite", "킬라플로르나이트"],
  ["golurkite", "골루그나이트"],
  ["greninjite", "개굴닌자나이트"],
  ["hawluchanite", "루차불나이트"],
  ["malamarite", "칼라마네로나이트"],
  ["meganiumite", "메가니움나이트"],
  ["meowsticite", "냐오닉스나이트"],
  ["pyroarite", "화염레오나이트"],
  ["raichunite-x", "라이츄나이트X"],
  ["raichunite-y", "라이츄나이트Y"],
  ["scolipite", "펜드라나이트"],
  ["scovillainite", "스코빌런나이트"],
  ["scraftinite", "곤율거니나이트"],
  ["skarmorite", "무장조나이트"],
  ["staraptite", "찌르호크나이트"],
  ["starminite", "아쿠스타나이트"],
  ["victreebelite", "우츠보트나이트"]
]);

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
    const nameKo =
      (pokeapiItem ? getLocalizedName(pokeapiItem.names, "ko") : null) ??
      megaStoneKoreanNameFallbacks.get(entry.id) ??
      null;
    const allowedPokemonIds =
      entry.category === "mega-stone" ? megaStoneAllowedPokemonIds.get(entry.id) : undefined;
    if (entry.category === "mega-stone" && !allowedPokemonIds) {
      throw new Error(`Mega Stone ${entry.id} is missing a Pokémon restriction mapping.`);
    }
    return {
      id: entry.id,
      nameKo,
      nameEn: entry.nameEn,
      category: entry.category,
      ...(allowedPokemonIds ? { allowedPokemonIds } : {}),
      itemDexUrl: new URL(entry.itemDexPath, itemsUrl).href,
      pokeapiId: pokeapiItem?.id ?? null,
      pokeapiStatus: pokeapiItem ? "matched" : "missing",
      localizationStatus: nameKo ? "complete" : "missing-ko",
      publishStatus: "review-candidate",
      sources: [
        "serebii-champions-items",
        ...(entry.category === "mega-stone" ? ["manual-mega-stone-curation"] : []),
        ...(pokeapiItem ? ["pokeapi"] : [])
      ]
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
      "Mega Stones are added by manual curation and restricted to their matching Pokémon in the team builder.",
      "Serebii item descriptions are not copied; only factual identifiers and categories are retained.",
      "Entries remain review candidates until promoted for public item guidance."
    ],
    summary: {
      itemCount: entries.length,
      heldItemCount: entries.filter((entry) => entry.category === "held-item").length,
      berryCount: entries.filter((entry) => entry.category === "berry").length,
      megaStoneCount: entries.filter((entry) => entry.category === "mega-stone").length,
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
