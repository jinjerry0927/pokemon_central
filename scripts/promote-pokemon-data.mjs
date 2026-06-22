import { rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  readJson,
  validatePublishedRegulationPokemon,
  validateRegulationRosterSnapshot,
  validateSyncedRegulationPokemon
} from "./lib/pokemon-data.mjs";

const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rosterPath = path.join(
  rootDirectory,
  "data",
  "generated",
  "champions-roster-m-b.json"
);
const previewPath = path.join(
  rootDirectory,
  "data",
  "generated",
  "pokemon-m-b-preview.json"
);
const outputPath = path.join(rootDirectory, "data", "pokemon.json");
const temporaryOutputPath = `${outputPath}.tmp`;

async function main() {
  const roster = validateRegulationRosterSnapshot(await readJson(rosterPath));
  const preview = validateSyncedRegulationPokemon(await readJson(previewPath), roster);
  const published = preview.map((entry) => {
    const publishedEntry = { ...entry };
    delete publishedEntry.learnableMoveIds;
    return {
      ...publishedEntry,
      publishStatus: "public",
      championsNotes: `Pokemon Champions Regulation ${roster.regulationId} 공식 사용 가능 포켓몬. 주요 기술은 별도 큐레이션 후 추가한다.`
    };
  });

  validatePublishedRegulationPokemon(published, roster);
  await writeFile(temporaryOutputPath, `${JSON.stringify(published, null, 2)}\n`, "utf8");
  await rename(temporaryOutputPath, outputPath);
  console.log(
    `Published Pokémon data written: ${path.relative(rootDirectory, outputPath)} (${published.length} entries; Regulation ${roster.regulationId})`
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
