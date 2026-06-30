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

function validateRegulationPokemonConsistency(
  entries,
  snapshot,
  labelPrefix,
  publishStatus,
  requireLearnableMoves
) {
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
    if (requireLearnableMoves) {
      assertUniqueStrings(entry.learnableMoveIds, `${label}.learnableMoveIds`);
      assert(entry.learnableMoveIds.length > 0, `${label}.learnableMoveIds must not be empty.`);
    } else {
      assert(entry.learnableMoveIds === undefined, `${label}.learnableMoveIds must stay out of public data.`);
    }
  }

  return entries;
}

export function validateSyncedRegulationPokemon(entries, snapshot) {
  return validateRegulationPokemonConsistency(
    entries,
    snapshot,
    "pokemon-m-b-preview",
    "review-candidate",
    true
  );
}

export function validatePublishedRegulationPokemon(entries, snapshot) {
  return validateRegulationPokemonConsistency(
    entries,
    snapshot,
    "pokemon",
    "public",
    false
  );
}

export function validateMoveCandidateSnapshot(snapshot) {
  assert(typeof snapshot === "object" && snapshot !== null, "Move candidate snapshot is required.");
  assert(snapshot.schemaVersion === 1, "Move candidate schemaVersion must be 1.");
  assert(typeof snapshot.regulationId === "string" && snapshot.regulationId.length > 0, "Move candidate regulationId is required.");
  assert(/^\d{4}-\d{2}-\d{2}$/.test(snapshot.checkedAt), "Move candidate checkedAt is invalid.");
  assert(snapshot.scope === "pokeapi-all-version-candidate", "Move candidate scope is invalid.");
  assert(Array.isArray(snapshot.entries) && snapshot.entries.length > 0, "Move candidate entries are required.");

  const ids = new Set();
  for (const [index, entry] of snapshot.entries.entries()) {
    const label = `move-candidates.entries[${index}]`;
    assert(typeof entry.id === "string" && /^[a-z0-9-]+$/.test(entry.id), `${label}.id is invalid.`);
    assert(!ids.has(entry.id), `${label}.id is duplicated.`);
    assert(entry.nameKo === null || (typeof entry.nameKo === "string" && entry.nameKo.length > 0), `${label}.nameKo is invalid.`);
    assert(typeof entry.nameEn === "string" && entry.nameEn.length > 0, `${label}.nameEn is required.`);
    assert(typeof entry.type === "string" && entry.type.length > 0, `${label}.type is required.`);
    assert(["Physical", "Special", "Status"].includes(entry.category), `${label}.category is invalid.`);
    assert(entry.power === null || Number.isInteger(entry.power), `${label}.power is invalid.`);
    assert(entry.accuracy === null || Number.isInteger(entry.accuracy), `${label}.accuracy is invalid.`);
    assert(Number.isInteger(entry.pp) && entry.pp > 0, `${label}.pp is invalid.`);
    assert(Number.isInteger(entry.priority), `${label}.priority is invalid.`);
    assert(typeof entry.generation === "string" && entry.generation.length > 0, `${label}.generation is required.`);
    assert(
      entry.localizationStatus === (entry.nameKo ? "complete" : "missing-ko"),
      `${label}.localizationStatus is invalid.`
    );
    assert(entry.publishStatus === "review-candidate", `${label}.publishStatus must remain review-candidate.`);
    assertUniqueStrings(entry.sources, `${label}.sources`);
    ids.add(entry.id);
  }

  return snapshot;
}

export function validatePokemonMoveCandidateSnapshot(snapshot, pokemon, moveSnapshot) {
  assert(typeof snapshot === "object" && snapshot !== null, "Pokemon move candidate snapshot is required.");
  assert(snapshot.schemaVersion === 1, "Pokemon move candidate schemaVersion must be 1.");
  assert(snapshot.regulationId === moveSnapshot.regulationId, "Pokemon move candidate regulationId is invalid.");
  assert(snapshot.checkedAt === moveSnapshot.checkedAt, "Pokemon move candidate checkedAt is invalid.");
  assert(snapshot.scope === moveSnapshot.scope, "Pokemon move candidate scope is invalid.");
  assert(Array.isArray(snapshot.entries) && snapshot.entries.length === pokemon.length, "Pokemon move candidate count is invalid.");

  const moveIds = new Set(moveSnapshot.entries.map((entry) => entry.id));
  const pokemonById = new Map(pokemon.map((entry) => [entry.id, entry]));
  const mappedPokemonIds = new Set();
  for (const [index, entry] of snapshot.entries.entries()) {
    const label = `pokemon-move-candidates.entries[${index}]`;
    const pokemonEntry = pokemonById.get(entry.pokemonId);
    assert(pokemonEntry, `${label}.pokemonId is missing from synced Pokémon.`);
    assert(!mappedPokemonIds.has(entry.pokemonId), `${label}.pokemonId is duplicated.`);
    assert(entry.championsId === pokemonEntry.championsId, `${label}.championsId is invalid.`);
    assertUniqueStrings(entry.moveIds, `${label}.moveIds`);
    assert(entry.moveIds.length > 0, `${label}.moveIds must not be empty.`);
    assert(entry.moveIds.every((moveId) => moveIds.has(moveId)), `${label}.moveIds contains an unknown move.`);
    assert(
      JSON.stringify([...entry.moveIds].sort()) ===
        JSON.stringify([...pokemonEntry.learnableMoveIds].sort()),
      `${label}.moveIds does not match the PokeAPI candidate list.`
    );
    mappedPokemonIds.add(entry.pokemonId);
  }

  return snapshot;
}

export function validateChampionsLearnsetPilotSnapshot(
  snapshot,
  pokemon,
  pokemonMoveSnapshot,
  moveSnapshot
) {
  assert(typeof snapshot === "object" && snapshot !== null, "Champions learnset pilot snapshot is required.");
  assert(snapshot.schemaVersion === 1, "Champions learnset pilot schemaVersion must be 1.");
  assert(snapshot.regulationId === pokemonMoveSnapshot.regulationId, "Champions learnset pilot regulationId is invalid.");
  assert(snapshot.checkedAt === pokemonMoveSnapshot.checkedAt, "Champions learnset pilot checkedAt is invalid.");
  assert(snapshot.scope === "third-party-champions-learnset-pilot", "Champions learnset pilot scope is invalid.");
  assert(typeof snapshot.source === "object" && snapshot.source !== null, "Champions learnset pilot source is required.");
  assert(snapshot.source.id === "pokemon-champions-data", "Champions learnset pilot source ID is invalid.");
  for (const sourceUrlKey of ["repositoryUrl", "learnsetsUrl", "versionUrl"]) {
    assert(
      typeof snapshot.source[sourceUrlKey] === "string" &&
        snapshot.source[sourceUrlKey].startsWith("https://"),
      `Champions learnset pilot source.${sourceUrlKey} is invalid.`
    );
  }
  assert(snapshot.source.license === "CC-BY-4.0", "Champions learnset pilot license is invalid.");
  assert(typeof snapshot.source.datasetVersion === "string" && snapshot.source.datasetVersion.length > 0, "Champions learnset pilot datasetVersion is required.");
  assert(/^\d{4}-\d{2}-\d{2}$/.test(snapshot.source.lastUpdated), "Champions learnset pilot source lastUpdated is invalid.");
  assert(
    ["predates-roster-check", "current-or-newer-than-roster-check"].includes(
      snapshot.source.freshness
    ),
    "Champions learnset pilot source freshness is invalid."
  );
  assert(
    snapshot.source.freshness ===
      (snapshot.source.lastUpdated < snapshot.checkedAt
        ? "predates-roster-check"
        : "current-or-newer-than-roster-check"),
    "Champions learnset pilot source freshness does not match its dates."
  );
  assert(typeof snapshot.source.attribution === "string" && snapshot.source.attribution.length > 0, "Champions learnset pilot attribution is required.");
  assertUniqueStrings(snapshot.limitations, "Champions learnset pilot limitations");
  assert(snapshot.limitations.length > 0, "Champions learnset pilot limitations are required.");
  assert(typeof snapshot.sourceChecks === "object" && snapshot.sourceChecks !== null, "Champions learnset pilot sourceChecks are required.");
  assert(snapshot.sourceChecks.incineroarExcludesKnockOff === true, "Champions learnset pilot must preserve the Incineroar Knock Off exclusion check.");
  assert(snapshot.sourceChecks.psybeamUserCount === 0, "Champions learnset pilot must preserve the global Psybeam exclusion check.");

  const expectedPilotIds = [
    "venusaur",
    "raichu-alola",
    "rotom-wash",
    "incineroar",
    "gholdengo"
  ];
  assert(Array.isArray(snapshot.entries) && snapshot.entries.length === expectedPilotIds.length, "Champions learnset pilot must contain five entries.");

  const pokemonById = new Map(pokemon.map((entry) => [entry.id, entry]));
  const pokeapiMovesByPokemonId = new Map(
    pokemonMoveSnapshot.entries.map((entry) => [entry.pokemonId, entry.moveIds])
  );
  const knownMoveIds = new Set(moveSnapshot.entries.map((entry) => entry.id));
  const mappedPokemonIds = new Set();

  for (const [index, entry] of snapshot.entries.entries()) {
    const label = `champions-learnset-pilot.entries[${index}]`;
    const pokemonEntry = pokemonById.get(entry.pokemonId);
    assert(expectedPilotIds.includes(entry.pokemonId), `${label}.pokemonId is outside the pilot scope.`);
    assert(!mappedPokemonIds.has(entry.pokemonId), `${label}.pokemonId is duplicated.`);
    assert(pokemonEntry, `${label}.pokemonId is missing from synced Pokémon.`);
    assert(entry.championsId === pokemonEntry.championsId, `${label}.championsId is invalid.`);
    assert(typeof entry.sourcePokemonName === "string" && entry.sourcePokemonName.length > 0, `${label}.sourcePokemonName is required.`);
    assert(["exact", "collapsed", "missing"].includes(entry.formMapping), `${label}.formMapping is invalid.`);
    assert(["source-candidate", "form-review-required", "source-missing"].includes(entry.candidateStatus), `${label}.candidateStatus is invalid.`);
    assert(entry.publishStatus === "review-candidate", `${label}.publishStatus must remain review-candidate.`);

    for (const arrayKey of [
      "championsMoveCandidateIds",
      "pokeapiMoveIds",
      "intersectionMoveIds",
      "sourceOnlyMoveIds",
      "pokeapiOnlyMoveIds",
      "unknownMoveIds"
    ]) {
      assertUniqueStrings(entry[arrayKey], `${label}.${arrayKey}`);
    }

    const localPokeapiMoveIds = pokeapiMovesByPokemonId.get(entry.pokemonId);
    assert(localPokeapiMoveIds, `${label}.pokemonId is missing from the PokeAPI move mapping.`);
    assert(
      JSON.stringify([...entry.pokeapiMoveIds].sort()) ===
        JSON.stringify([...localPokeapiMoveIds].sort()),
      `${label}.pokeapiMoveIds does not match the local candidate mapping.`
    );

    const expectedIntersection = entry.championsMoveCandidateIds
      .filter((moveId) => entry.pokeapiMoveIds.includes(moveId))
      .sort();
    const expectedSourceOnly = entry.championsMoveCandidateIds
      .filter((moveId) => !entry.pokeapiMoveIds.includes(moveId))
      .sort();
    const expectedPokeapiOnly = entry.pokeapiMoveIds
      .filter((moveId) => !entry.championsMoveCandidateIds.includes(moveId))
      .sort();
    const expectedUnknown = entry.championsMoveCandidateIds
      .filter((moveId) => !knownMoveIds.has(moveId))
      .sort();
    for (const [arrayKey, expectedValues] of [
      ["intersectionMoveIds", expectedIntersection],
      ["sourceOnlyMoveIds", expectedSourceOnly],
      ["pokeapiOnlyMoveIds", expectedPokeapiOnly],
      ["unknownMoveIds", expectedUnknown]
    ]) {
      assert(
        JSON.stringify([...entry[arrayKey]].sort()) === JSON.stringify(expectedValues),
        `${label}.${arrayKey} is inconsistent.`
      );
    }

    if (entry.candidateStatus === "source-missing") {
      assert(entry.formMapping === "missing", `${label}.source-missing requires missing formMapping.`);
      assert(entry.sourceClaimsVerified === false, `${label}.sourceClaimsVerified must be false when missing.`);
      assert(entry.sourceEvidence === null, `${label}.sourceEvidence must be null when missing.`);
      assert(entry.championsMoveCandidateIds.length === 0, `${label} must not invent source candidates.`);
    } else {
      assert(entry.sourceClaimsVerified === true, `${label}.sourceClaimsVerified must preserve the source claim.`);
      assert(typeof entry.sourceEvidence === "string" && entry.sourceEvidence.length > 0, `${label}.sourceEvidence is required.`);
      assert(entry.championsMoveCandidateIds.length > 0, `${label}.championsMoveCandidateIds must not be empty.`);
      assert(
        entry.candidateStatus ===
          (entry.formMapping === "collapsed" ? "form-review-required" : "source-candidate"),
        `${label}.candidateStatus does not match formMapping.`
      );
    }
    mappedPokemonIds.add(entry.pokemonId);
  }

  assert(
    expectedPilotIds.every((pokemonId) => mappedPokemonIds.has(pokemonId)),
    "Champions learnset pilot is missing an expected Pokémon."
  );
  assert(typeof snapshot.summary === "object" && snapshot.summary !== null, "Champions learnset pilot summary is required.");
  const expectedMappedCount = snapshot.entries.filter((entry) => entry.candidateStatus !== "source-missing").length;
  const expectedMissingCount = snapshot.entries.length - expectedMappedCount;
  const expectedFormReviewCount = snapshot.entries.filter((entry) => entry.candidateStatus === "form-review-required").length;
  const expectedCandidateMoveReferenceCount = snapshot.entries.reduce(
    (total, entry) => total + entry.championsMoveCandidateIds.length,
    0
  );
  assert(snapshot.summary.pilotPokemonCount === expectedPilotIds.length, "Champions learnset pilot summary count is invalid.");
  assert(snapshot.summary.mappedPokemonCount === expectedMappedCount, "Champions learnset pilot mapped count is invalid.");
  assert(snapshot.summary.missingPokemonCount === expectedMissingCount, "Champions learnset pilot missing count is invalid.");
  assert(snapshot.summary.formReviewCount === expectedFormReviewCount, "Champions learnset pilot form review count is invalid.");
  assert(snapshot.summary.candidateMoveReferenceCount === expectedCandidateMoveReferenceCount, "Champions learnset pilot move reference count is invalid.");

  return snapshot;
}

export function validateSerebiiLearnsetPilotSnapshot(
  snapshot,
  priorSnapshot,
  pokemon,
  pokemonMoveSnapshot,
  moveSnapshot
) {
  assert(typeof snapshot === "object" && snapshot !== null, "Serebii learnset pilot snapshot is required.");
  assert(snapshot.schemaVersion === 1, "Serebii learnset pilot schemaVersion must be 1.");
  assert(snapshot.regulationId === priorSnapshot.regulationId, "Serebii learnset pilot regulationId is invalid.");
  assert(snapshot.checkedAt === priorSnapshot.checkedAt, "Serebii learnset pilot checkedAt is invalid.");
  assert(snapshot.scope === "serebii-current-learnset-pilot", "Serebii learnset pilot scope is invalid.");
  assert(typeof snapshot.source === "object" && snapshot.source !== null, "Serebii learnset pilot source is required.");
  assert(snapshot.source.id === "serebii-champions-pokedex", "Serebii learnset pilot source ID is invalid.");
  assert(typeof snapshot.source.baseUrl === "string" && snapshot.source.baseUrl.startsWith("https://"), "Serebii learnset pilot baseUrl is invalid.");
  assert(snapshot.source.relationshipToPrimary === "upstream-source-refresh", "Serebii source relationship is invalid.");
  assert(snapshot.source.independentVerification === false, "Serebii must not be marked as independent verification.");
  assert(snapshot.source.contentUsage === "factual-move-identifiers-only", "Serebii content usage is invalid.");
  assertUniqueStrings(snapshot.limitations, "Serebii learnset pilot limitations");
  assert(snapshot.limitations.length > 0, "Serebii learnset pilot limitations are required.");
  assert(snapshot.sourceChecks.incineroarExcludesKnockOff === true, "Serebii pilot must preserve the Incineroar Knock Off exclusion check.");
  assert(snapshot.sourceChecks.pilotContainsPsybeam === false, "Serebii pilot must preserve the pilot Psybeam exclusion check.");

  const expectedPilotIds = [
    "venusaur",
    "raichu-alola",
    "rotom-wash",
    "incineroar",
    "gholdengo"
  ];
  assert(Array.isArray(snapshot.entries) && snapshot.entries.length === expectedPilotIds.length, "Serebii learnset pilot must contain five entries.");

  const pokemonById = new Map(pokemon.map((entry) => [entry.id, entry]));
  const priorByPokemonId = new Map(
    priorSnapshot.entries.map((entry) => [entry.pokemonId, entry])
  );
  const pokeapiMovesByPokemonId = new Map(
    pokemonMoveSnapshot.entries.map((entry) => [entry.pokemonId, entry.moveIds])
  );
  const knownMoveIds = new Set(moveSnapshot.entries.map((entry) => entry.id));
  const seenPokemonIds = new Set();

  for (const [index, entry] of snapshot.entries.entries()) {
    const label = `serebii-learnset-pilot.entries[${index}]`;
    const pokemonEntry = pokemonById.get(entry.pokemonId);
    const priorEntry = priorByPokemonId.get(entry.pokemonId);
    const localPokeapiMoveIds = pokeapiMovesByPokemonId.get(entry.pokemonId);
    assert(expectedPilotIds.includes(entry.pokemonId), `${label}.pokemonId is outside the pilot scope.`);
    assert(!seenPokemonIds.has(entry.pokemonId), `${label}.pokemonId is duplicated.`);
    assert(pokemonEntry && priorEntry && localPokeapiMoveIds, `${label}.pokemonId is missing from local candidate data.`);
    assert(entry.championsId === pokemonEntry.championsId, `${label}.championsId is invalid.`);
    assert(typeof entry.pageUrl === "string" && entry.pageUrl.startsWith(snapshot.source.baseUrl), `${label}.pageUrl is invalid.`);
    assert(typeof entry.tableHeading === "string" && entry.tableHeading.length > 0, `${label}.tableHeading is required.`);
    assert(entry.specialFormName === null || (typeof entry.specialFormName === "string" && entry.specialFormName.length > 0), `${label}.specialFormName is invalid.`);
    assert(["exact-match", "source-updated", "form-specific-refresh", "newly-covered"].includes(entry.comparisonStatus), `${label}.comparisonStatus is invalid.`);
    assert(entry.publishStatus === "review-candidate", `${label}.publishStatus must remain review-candidate.`);

    for (const arrayKey of [
      "serebiiMoveIds",
      "priorCandidateMoveIds",
      "matchedMoveIds",
      "addedSincePriorMoveIds",
      "removedSincePriorMoveIds",
      "pokeapiMoveIds",
      "serebiiOnlyMoveIds",
      "pokeapiOnlyMoveIds",
      "unknownMoveIds"
    ]) {
      assertUniqueStrings(entry[arrayKey], `${label}.${arrayKey}`);
    }
    assert(entry.serebiiMoveIds.length > 0, `${label}.serebiiMoveIds must not be empty.`);
    assert(
      JSON.stringify([...entry.priorCandidateMoveIds].sort()) ===
        JSON.stringify([...priorEntry.championsMoveCandidateIds].sort()),
      `${label}.priorCandidateMoveIds does not match the prior snapshot.`
    );
    assert(
      JSON.stringify([...entry.pokeapiMoveIds].sort()) ===
        JSON.stringify([...localPokeapiMoveIds].sort()),
      `${label}.pokeapiMoveIds does not match the local candidate mapping.`
    );

    const expectedMatched = entry.serebiiMoveIds
      .filter((moveId) => entry.priorCandidateMoveIds.includes(moveId))
      .sort();
    const expectedAdded = entry.serebiiMoveIds
      .filter((moveId) => !entry.priorCandidateMoveIds.includes(moveId))
      .sort();
    const expectedRemoved = entry.priorCandidateMoveIds
      .filter((moveId) => !entry.serebiiMoveIds.includes(moveId))
      .sort();
    const expectedSerebiiOnly = entry.serebiiMoveIds
      .filter((moveId) => !entry.pokeapiMoveIds.includes(moveId))
      .sort();
    const expectedPokeapiOnly = entry.pokeapiMoveIds
      .filter((moveId) => !entry.serebiiMoveIds.includes(moveId))
      .sort();
    const expectedUnknown = entry.serebiiMoveIds
      .filter((moveId) => !knownMoveIds.has(moveId))
      .sort();
    for (const [arrayKey, expectedValues] of [
      ["matchedMoveIds", expectedMatched],
      ["addedSincePriorMoveIds", expectedAdded],
      ["removedSincePriorMoveIds", expectedRemoved],
      ["serebiiOnlyMoveIds", expectedSerebiiOnly],
      ["pokeapiOnlyMoveIds", expectedPokeapiOnly],
      ["unknownMoveIds", expectedUnknown]
    ]) {
      assert(
        JSON.stringify([...entry[arrayKey]].sort()) === JSON.stringify(expectedValues),
        `${label}.${arrayKey} is inconsistent.`
      );
    }

    const expectedStatus =
      entry.priorCandidateMoveIds.length === 0
        ? "newly-covered"
        : entry.specialFormName !== null
          ? "form-specific-refresh"
          : expectedAdded.length > 0 || expectedRemoved.length > 0
            ? "source-updated"
            : "exact-match";
    assert(entry.comparisonStatus === expectedStatus, `${label}.comparisonStatus is inconsistent.`);
    seenPokemonIds.add(entry.pokemonId);
  }

  assert(expectedPilotIds.every((pokemonId) => seenPokemonIds.has(pokemonId)), "Serebii learnset pilot is missing an expected Pokémon.");
  const washRotom = snapshot.entries.find((entry) => entry.pokemonId === "rotom-wash");
  assert(washRotom?.specialFormName === "Wash Rotom", "Serebii pilot must use the Wash Rotom special move filter.");
  assert(washRotom.serebiiMoveIds.includes("hydro-pump"), "Wash Rotom must include Hydro Pump.");
  assert(
    ["overheat", "blizzard", "air-slash", "leaf-storm"].every(
      (moveId) => !washRotom.serebiiMoveIds.includes(moveId)
    ),
    "Wash Rotom must exclude other Rotom form-exclusive moves."
  );

  assert(typeof snapshot.summary === "object" && snapshot.summary !== null, "Serebii learnset pilot summary is required.");
  const expectedExactMatchCount = snapshot.entries.filter((entry) => entry.comparisonStatus === "exact-match").length;
  const expectedChangedCount = snapshot.entries.filter((entry) => ["source-updated", "form-specific-refresh"].includes(entry.comparisonStatus)).length;
  const expectedNewlyCoveredCount = snapshot.entries.filter((entry) => entry.comparisonStatus === "newly-covered").length;
  const expectedMoveReferenceCount = snapshot.entries.reduce(
    (total, entry) => total + entry.serebiiMoveIds.length,
    0
  );
  assert(snapshot.summary.pilotPokemonCount === expectedPilotIds.length, "Serebii learnset pilot summary count is invalid.");
  assert(snapshot.summary.exactMatchCount === expectedExactMatchCount, "Serebii learnset pilot exact count is invalid.");
  assert(snapshot.summary.changedCount === expectedChangedCount, "Serebii learnset pilot changed count is invalid.");
  assert(snapshot.summary.newlyCoveredCount === expectedNewlyCoveredCount, "Serebii learnset pilot newly covered count is invalid.");
  assert(snapshot.summary.currentMoveReferenceCount === expectedMoveReferenceCount, "Serebii learnset pilot move reference count is invalid.");

  return snapshot;
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
    assert(entry.spriteUrl === null || (typeof entry.spriteUrl === "string" && entry.spriteUrl.startsWith("https://")), `${entryLabel}.spriteUrl must be an HTTPS URL or null.`);
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
