import { readFile } from "node:fs/promises";

const pokemonStatuses = new Set(["confirmed", "unverified", "removed", "rumored", "sample"]);
const rosterStatuses = new Set(["confirmed", "unverified", "removed"]);
const statKeys = ["hp", "attack", "defense", "specialAttack", "specialDefense", "speed"];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertUniqueStrings(values, label) {
  assert(Array.isArray(values), `${label} must be an array.`);
  assert(values.every((value) => typeof value === "string" && value.length > 0), `${label} must contain non-empty strings.`);
  assert(new Set(values).size === values.length, `${label} contains duplicate values.`);
}

export async function readJson(filePath) {
  const source = await readFile(filePath, "utf8");
  return JSON.parse(source);
}

export function validateRoster(roster) {
  assert(Array.isArray(roster) && roster.length > 0, "Champions roster must be a non-empty array.");

  const ids = new Set();
  const slugs = new Set();

  for (const [index, entry] of roster.entries()) {
    const label = `champions-roster[${index}]`;
    assert(Number.isInteger(entry.pokeapiId) && entry.pokeapiId > 0, `${label}.pokeapiId must be a positive integer.`);
    assert(typeof entry.slug === "string" && /^[a-z0-9-]+$/.test(entry.slug), `${label}.slug is invalid.`);
    assert(rosterStatuses.has(entry.status), `${label}.status is invalid.`);
    assert(typeof entry.publishStatus === "string" && entry.publishStatus.length > 0, `${label}.publishStatus is required.`);
    assert(typeof entry.evidence === "string" && entry.evidence.length > 0, `${label}.evidence is required.`);
    assert(entry.evidenceUrl === null || typeof entry.evidenceUrl === "string", `${label}.evidenceUrl must be a string or null.`);
    assert(entry.lastChecked === null || /^\d{4}-\d{2}-\d{2}$/.test(entry.lastChecked), `${label}.lastChecked must use YYYY-MM-DD or null.`);
    assert(typeof entry.championsNotes === "string" && entry.championsNotes.length > 0, `${label}.championsNotes is required.`);
    assert(!ids.has(entry.pokeapiId), `${label}.pokeapiId is duplicated.`);
    assert(!slugs.has(entry.slug), `${label}.slug is duplicated.`);

    if (entry.status === "confirmed") {
      assert(entry.lastChecked !== null, `${label} confirmed entries require lastChecked.`);
      assert(entry.evidenceUrl !== null, `${label} confirmed entries require evidenceUrl.`);
      assert(entry.publishStatus !== "mvp-sample", `${label} confirmed entries cannot remain mvp-sample.`);
    }

    ids.add(entry.pokeapiId);
    slugs.add(entry.slug);
  }

  return roster;
}

export function validateRegulationRosterSnapshot(snapshot) {
  assert(typeof snapshot === "object" && snapshot !== null, "Regulation roster snapshot is required.");
  assert(snapshot.schemaVersion === 1, "Regulation roster schemaVersion must be 1.");
  assert(typeof snapshot.regulationId === "string" && snapshot.regulationId.length > 0, "Regulation roster regulationId is required.");
  assert(/^\d{4}-\d{2}-\d{2}$/.test(snapshot.checkedAt), "Regulation roster checkedAt must use YYYY-MM-DD.");
  assert(typeof snapshot.sources === "object" && snapshot.sources !== null, "Regulation roster sources are required.");
  for (const sourceKey of ["newsListUrl", "articleUrl", "eligiblePokemonUrl"]) {
    assert(typeof snapshot.sources[sourceKey] === "string" && snapshot.sources[sourceKey].startsWith("https://"), `Regulation roster sources.${sourceKey} is invalid.`);
  }
  assert(snapshot.previousRegulationId === null || typeof snapshot.previousRegulationId === "string", "Regulation roster previousRegulationId is invalid.");
  assertUniqueStrings(snapshot.addedSincePrevious, "Regulation roster addedSincePrevious");
  assert(Array.isArray(snapshot.entries) && snapshot.entries.length > 0, "Regulation roster entries must be a non-empty array.");

  const championsIds = new Set();
  for (const [index, entry] of snapshot.entries.entries()) {
    const label = `regulation-roster.entries[${index}]`;
    assert(/^\d{4}-\d{3}$/.test(entry.championsId), `${label}.championsId is invalid.`);
    assert(!championsIds.has(entry.championsId), `${label}.championsId is duplicated.`);
    assert(Number.isInteger(entry.speciesId) && entry.speciesId === Number(entry.championsId.slice(0, 4)), `${label}.speciesId does not match championsId.`);
    assert(typeof entry.pokeapiSlug === "string" && /^[a-z0-9-]+$/.test(entry.pokeapiSlug), `${label}.pokeapiSlug is invalid.`);
    assert(typeof entry.form === "string" && /^[a-z0-9-]+$/.test(entry.form), `${label}.form is invalid.`);
    assert(typeof entry.nameEn === "string" && entry.nameEn.length > 0, `${label}.nameEn is required.`);
    assert(entry.status === "confirmed", `${label}.status must be confirmed.`);
    assert(entry.currentEligible === true, `${label}.currentEligible must be true.`);
    assert(typeof entry.firstSeenRegulation === "string" && entry.firstSeenRegulation.length > 0, `${label}.firstSeenRegulation is required.`);
    assert(typeof entry.evidenceUrl === "string" && entry.evidenceUrl === snapshot.sources.eligiblePokemonUrl, `${label}.evidenceUrl must match the official eligible Pokémon URL.`);
    assert(entry.lastChecked === snapshot.checkedAt, `${label}.lastChecked must match snapshot.checkedAt.`);
    assert(entry.publishStatus === "review-candidate", `${label}.publishStatus must remain review-candidate.`);
    championsIds.add(entry.championsId);
  }

  for (const championsId of snapshot.addedSincePrevious) {
    assert(championsIds.has(championsId), `Added Champions ID ${championsId} is missing from entries.`);
  }
  if (snapshot.previousRegulationId !== null) {
    const firstSeenInCurrent = snapshot.entries
      .filter((entry) => entry.firstSeenRegulation === snapshot.regulationId)
      .map((entry) => entry.championsId)
      .sort();
    const addedSincePrevious = [...snapshot.addedSincePrevious].sort();
    assert(
      JSON.stringify(firstSeenInCurrent) === JSON.stringify(addedSincePrevious),
      "Regulation roster addedSincePrevious does not match firstSeenRegulation."
    );
  }

  return snapshot;
}

function validateRegulationPokemonConsistency(entries, snapshot, labelPrefix, publishStatus) {
  validatePokemonEntries(entries, labelPrefix);
  validateRegulationRosterSnapshot(snapshot);
  assert(entries.length === snapshot.entries.length, "Synced Pokémon count does not match regulation roster count.");

  const rosterByChampionsId = new Map(
    snapshot.entries.map((entry) => [entry.championsId, entry])
  );
  for (const [index, entry] of entries.entries()) {
    const label = `${labelPrefix}[${index}]`;
    const rosterEntry = rosterByChampionsId.get(entry.championsId);
    assert(rosterEntry, `${label}.championsId is missing from the M-B roster.`);
    assert(entry.id === rosterEntry.pokeapiSlug, `${label}.id does not match pokeapiSlug.`);
    assert(entry.pokeapiSlug === rosterEntry.pokeapiSlug, `${label}.pokeapiSlug does not match the M-B roster.`);
    assert(entry.speciesId === rosterEntry.speciesId, `${label}.speciesId does not match the M-B roster.`);
    assert(entry.form === rosterEntry.form, `${label}.form does not match the M-B roster.`);
    assert(entry.nameEn === rosterEntry.nameEn, `${label}.nameEn does not match the official roster.`);
    assert(entry.championsAvailability.status === "confirmed", `${label} must remain confirmed.`);
    assert(entry.championsAvailability.currentEligible === true, `${label} must remain currently eligible.`);
    assert(entry.championsAvailability.regulationId === snapshot.regulationId, `${label}.regulationId is invalid.`);
    assert(entry.championsAvailability.firstSeenRegulation === rosterEntry.firstSeenRegulation, `${label}.firstSeenRegulation is invalid.`);
    assert(entry.championsAvailability.evidenceUrl === rosterEntry.evidenceUrl, `${label}.evidenceUrl is invalid.`);
    assert(entry.publishStatus === publishStatus, `${label}.publishStatus must be ${publishStatus}.`);
  }

  return entries;
}

export function validateSyncedRegulationPokemon(entries, snapshot) {
  return validateRegulationPokemonConsistency(
    entries,
    snapshot,
    "pokemon-m-b-preview",
    "review-candidate"
  );
}

export function validatePublishedRegulationPokemon(entries, snapshot) {
  return validateRegulationPokemonConsistency(entries, snapshot, "pokemon", "public");
}

export function validatePokemonEntries(entries, label = "pokemon") {
  assert(Array.isArray(entries) && entries.length > 0, `${label} must be a non-empty array.`);
  const ids = new Set();

  for (const [index, entry] of entries.entries()) {
    const entryLabel = `${label}[${index}]`;
    assert(typeof entry.id === "string" && /^[a-z0-9-]+$/.test(entry.id), `${entryLabel}.id is invalid.`);
    assert(!ids.has(entry.id), `${entryLabel}.id is duplicated.`);
    assert(typeof entry.nameKo === "string" && entry.nameKo.length > 0, `${entryLabel}.nameKo is required.`);
    assert(typeof entry.nameEn === "string" && entry.nameEn.length > 0, `${entryLabel}.nameEn is required.`);
    assertUniqueStrings(entry.types, `${entryLabel}.types`);
    assert(entry.types.length >= 1 && entry.types.length <= 2, `${entryLabel}.types must contain one or two values.`);
    assert(typeof entry.baseStats === "object" && entry.baseStats !== null, `${entryLabel}.baseStats is required.`);

    for (const statKey of statKeys) {
      assert(Number.isInteger(entry.baseStats[statKey]) && entry.baseStats[statKey] > 0, `${entryLabel}.baseStats.${statKey} must be a positive integer.`);
    }

    assertUniqueStrings(entry.abilities, `${entryLabel}.abilities`);
    assertUniqueStrings(entry.keyMoveIds, `${entryLabel}.keyMoveIds`);
    assert(typeof entry.championsAvailability === "object" && entry.championsAvailability !== null, `${entryLabel}.championsAvailability is required.`);
    assert(pokemonStatuses.has(entry.championsAvailability.status), `${entryLabel}.championsAvailability.status is invalid.`);
    assert(entry.championsAvailability.lastChecked === null || /^\d{4}-\d{2}-\d{2}$/.test(entry.championsAvailability.lastChecked), `${entryLabel}.championsAvailability.lastChecked is invalid.`);
    assert(typeof entry.championsAvailability.evidence === "string" && entry.championsAvailability.evidence.length > 0, `${entryLabel}.championsAvailability.evidence is required.`);
    assert(entry.championsAvailability.evidenceUrl === undefined || entry.championsAvailability.evidenceUrl === null || typeof entry.championsAvailability.evidenceUrl === "string", `${entryLabel}.championsAvailability.evidenceUrl must be a string, null, or omitted.`);
    assert(typeof entry.publishStatus === "string" && entry.publishStatus.length > 0, `${entryLabel}.publishStatus is required.`);
    assert(typeof entry.championsNotes === "string" && entry.championsNotes.length > 0, `${entryLabel}.championsNotes is required.`);
    assertUniqueStrings(entry.sources, `${entryLabel}.sources`);
    ids.add(entry.id);
  }

  return entries;
}
