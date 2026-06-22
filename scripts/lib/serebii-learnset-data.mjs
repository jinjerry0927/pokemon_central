function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertUniqueStrings(values, label) {
  assert(Array.isArray(values), `${label} must be an array.`);
  assert(
    values.every((value) => typeof value === "string" && value.length > 0),
    `${label} must contain non-empty strings.`
  );
  assert(new Set(values).size === values.length, `${label} contains duplicate values.`);
}

function sameStrings(left, right) {
  return JSON.stringify([...left].sort()) === JSON.stringify([...right].sort());
}

export function decodeHtml(value) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCodePoint(Number.parseInt(code, 16))
    )
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

export function toMoveId(name) {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]s\b/g, "s")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function extractTables(html) {
  return Array.from(
    html.matchAll(/<table\s+class="dextable">[\s\S]*?<\/table>/gi),
    (match) => match[0]
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
            throw new Error(`Serebii Special Moves entry is missing a move for ${formName}.`);
          }
          return toMoveId(decodeHtml(moveName));
        })
    )
  ).sort();
}

export function extractSerebiiMoveIds(html, tableHeading, specialFormName = null) {
  const standardMoveIds = extractStandardMoveIds(html, tableHeading);
  const specialFormMoveIds = specialFormName
    ? extractSpecialFormMoveIds(html, specialFormName)
    : [];
  return Array.from(new Set([...standardMoveIds, ...specialFormMoveIds])).sort();
}

export function parseSerebiiPokedexIndex(html, baseUrl) {
  const pageBySpeciesId = new Map();
  for (const match of html.matchAll(
    /<option[^>]+value="(?<path>\/pokedex-champions\/[^"]+\/)"[^>]*>\s*(?<dex>\d{3,4})\s+[^<]+<\/option>/gi
  )) {
    pageBySpeciesId.set(Number(match.groups.dex), new URL(match.groups.path, baseUrl).href);
  }
  return pageBySpeciesId;
}

export function resolveSerebiiFormConfig(pokemon) {
  const headingByForm = {
    alolan: "Alola Form Standard Moves",
    galarian: "Galarian Form Standard Moves",
    hisuian: "Hisuian Form Standard Moves",
    "paldean-combat": "Paldean Form Standard Moves",
    "paldean-blaze": "Standard Moves - Blaze Breed",
    "paldean-aqua": "Standard Moves - Aqua Breed",
    "eternal-flower": "Standard Moves - Eternal Floette",
    midnight: "Standard Moves - Midnight Form",
    dusk: "Standard Moves - Dusk Form"
  };
  if (pokemon.form === "male" && [678, 902].includes(pokemon.speciesId)) {
    return { tableHeading: "Standard Moves - Male", specialFormName: null };
  }
  if (pokemon.form === "female" && [678, 902].includes(pokemon.speciesId)) {
    return { tableHeading: "Standard Moves - Female", specialFormName: null };
  }

  const rotomSpecialForms = {
    heat: "Heat Rotom",
    wash: "Wash Rotom",
    frost: "Frost Rotom",
    fan: "Fan Rotom",
    mow: "Mow Rotom"
  };
  return {
    tableHeading: headingByForm[pokemon.form] ?? "Standard Moves",
    specialFormName: rotomSpecialForms[pokemon.form] ?? null
  };
}

function getRegionalPrefix(form) {
  if (form === "alolan") return "Alolan ";
  if (form === "galarian") return "Galarian ";
  if (form === "hisuian") return "Hisuian ";
  if (form.startsWith("paldean-")) return "Paldean ";
  return null;
}

export function createPriorLearnsetIndex(sourceLearnsets) {
  const entriesBySpeciesId = new Map();
  for (const [name, entry] of Object.entries(sourceLearnsets)) {
    if (entry.form === "Mega") continue;
    const values = entriesBySpeciesId.get(entry.dexNumber) ?? [];
    values.push({ name, entry });
    entriesBySpeciesId.set(entry.dexNumber, values);
  }
  return entriesBySpeciesId;
}

export function resolvePriorLearnset(pokemon, entriesBySpeciesId, localFormCount) {
  const candidates = entriesBySpeciesId.get(pokemon.speciesId) ?? [];
  if (candidates.length === 0) {
    return {
      sourcePokemonName: null,
      mappingStatus: "missing",
      moveIds: []
    };
  }

  const regionalPrefix = getRegionalPrefix(pokemon.form);
  let selected;
  if (regionalPrefix) {
    selected = candidates.find((candidate) => candidate.name.startsWith(regionalPrefix));
  } else if (pokemon.form === "base") {
    selected =
      candidates.find((candidate) => candidate.entry.form === "Base") ?? candidates[0];
  } else {
    selected = candidates.length === 1 ? candidates[0] : candidates.find((candidate) => candidate.entry.form === "Base");
  }

  if (!selected) {
    return {
      sourcePokemonName: null,
      mappingStatus: "missing",
      moveIds: []
    };
  }

  const selectedByMultipleLocalForms =
    localFormCount > 1 &&
    pokemon.form !== "base" &&
    !["alolan", "galarian", "hisuian"].includes(pokemon.form);
  return {
    sourcePokemonName: selected.name,
    mappingStatus: selectedByMultipleLocalForms ? "collapsed" : "exact",
    moveIds: Array.from(
      new Set(selected.entry.moves.map((move) => toMoveId(move.name)))
    ).sort()
  };
}

export function validateFullSerebiiLearnsetSnapshot(
  snapshot,
  rosterSnapshot,
  pokemon,
  pokemonMoveSnapshot,
  moveSnapshot
) {
  assert(typeof snapshot === "object" && snapshot !== null, "Full Serebii learnset snapshot is required.");
  assert(snapshot.schemaVersion === 1, "Full Serebii learnset schemaVersion must be 1.");
  assert(snapshot.regulationId === rosterSnapshot.regulationId, "Full Serebii learnset regulationId is invalid.");
  assert(/^\d{4}-\d{2}-\d{2}$/.test(snapshot.checkedAt), "Full Serebii learnset checkedAt is invalid.");
  assert(snapshot.rosterCheckedAt === rosterSnapshot.checkedAt, "Full Serebii learnset rosterCheckedAt is invalid.");
  assert(snapshot.scope === "serebii-current-learnsets", "Full Serebii learnset scope is invalid.");
  assert(snapshot.source.id === "serebii-champions-pokedex", "Full Serebii learnset source ID is invalid.");
  for (const key of ["indexUrl", "priorDatasetUrl", "priorVersionUrl"]) {
    assert(typeof snapshot.source[key] === "string" && snapshot.source[key].startsWith("https://"), `Full Serebii learnset source.${key} is invalid.`);
  }
  assert(snapshot.source.relationshipToPrior === "upstream-source-refresh", "Full Serebii source relationship is invalid.");
  assert(snapshot.source.independentVerification === false, "Full Serebii source must not be marked independent.");
  assert(snapshot.source.priorLicense === "CC-BY-4.0", "Full Serebii prior license is invalid.");
  assertUniqueStrings(snapshot.limitations, "Full Serebii learnset limitations");
  assert(snapshot.sourceChecks.incineroarExcludesKnockOff === true, "Full Serebii snapshot must exclude Knock Off from Incineroar.");
  assert(snapshot.sourceChecks.psybeamUserCount === 0, "Full Serebii snapshot must preserve the Psybeam exclusion check.");
  assert(Array.isArray(snapshot.entries) && snapshot.entries.length === pokemon.length, "Full Serebii learnset count is invalid.");

  const pokemonById = new Map(pokemon.map((entry) => [entry.id, entry]));
  const pokeapiMovesByPokemonId = new Map(
    pokemonMoveSnapshot.entries.map((entry) => [entry.pokemonId, entry.moveIds])
  );
  const knownMoveIds = new Set(moveSnapshot.entries.map((entry) => entry.id));
  const seenPokemonIds = new Set();
  for (const [index, entry] of snapshot.entries.entries()) {
    const label = `serebii-learnsets.entries[${index}]`;
    const pokemonEntry = pokemonById.get(entry.pokemonId);
    const localPokeapiMoveIds = pokeapiMovesByPokemonId.get(entry.pokemonId);
    assert(pokemonEntry && localPokeapiMoveIds, `${label}.pokemonId is missing from local data.`);
    assert(!seenPokemonIds.has(entry.pokemonId), `${label}.pokemonId is duplicated.`);
    assert(entry.championsId === pokemonEntry.championsId, `${label}.championsId is invalid.`);
    assert(entry.speciesId === pokemonEntry.speciesId, `${label}.speciesId is invalid.`);
    assert(entry.form === pokemonEntry.form, `${label}.form is invalid.`);
    assert(typeof entry.pageUrl === "string" && entry.pageUrl.startsWith("https://"), `${label}.pageUrl is invalid.`);
    assert(typeof entry.tableHeading === "string" && entry.tableHeading.length > 0, `${label}.tableHeading is required.`);
    assert(entry.specialFormName === null || (typeof entry.specialFormName === "string" && entry.specialFormName.length > 0), `${label}.specialFormName is invalid.`);
    assert(["exact", "collapsed", "missing"].includes(entry.priorMappingStatus), `${label}.priorMappingStatus is invalid.`);
    assert(["exact-match", "source-updated", "form-specific-refresh", "newly-covered", "parse-failed"].includes(entry.comparisonStatus), `${label}.comparisonStatus is invalid.`);
    assert(entry.publishStatus === "review-candidate", `${label}.publishStatus must remain review-candidate.`);
    assert(entry.error === null || (typeof entry.error === "string" && entry.error.length > 0), `${label}.error is invalid.`);

    for (const key of [
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
      assertUniqueStrings(entry[key], `${label}.${key}`);
    }
    assert(sameStrings(entry.pokeapiMoveIds, localPokeapiMoveIds), `${label}.pokeapiMoveIds is inconsistent.`);

    if (entry.comparisonStatus === "parse-failed") {
      assert(entry.error !== null, `${label}.parse-failed requires an error.`);
      assert(entry.serebiiMoveIds.length === 0, `${label}.parse-failed must not contain Serebii moves.`);
    } else {
      assert(entry.error === null, `${label}.error must be null after successful parsing.`);
      assert(entry.serebiiMoveIds.length > 0, `${label}.serebiiMoveIds must not be empty.`);
      const expectedMatched = entry.serebiiMoveIds.filter((moveId) => entry.priorCandidateMoveIds.includes(moveId));
      const expectedAdded = entry.serebiiMoveIds.filter((moveId) => !entry.priorCandidateMoveIds.includes(moveId));
      const expectedRemoved = entry.priorCandidateMoveIds.filter((moveId) => !entry.serebiiMoveIds.includes(moveId));
      const expectedSerebiiOnly = entry.serebiiMoveIds.filter((moveId) => !entry.pokeapiMoveIds.includes(moveId));
      const expectedPokeapiOnly = entry.pokeapiMoveIds.filter((moveId) => !entry.serebiiMoveIds.includes(moveId));
      const expectedUnknown = entry.serebiiMoveIds.filter((moveId) => !knownMoveIds.has(moveId));
      for (const [key, expected] of [
        ["matchedMoveIds", expectedMatched],
        ["addedSincePriorMoveIds", expectedAdded],
        ["removedSincePriorMoveIds", expectedRemoved],
        ["serebiiOnlyMoveIds", expectedSerebiiOnly],
        ["pokeapiOnlyMoveIds", expectedPokeapiOnly],
        ["unknownMoveIds", expectedUnknown]
      ]) {
        assert(sameStrings(entry[key], expected), `${label}.${key} is inconsistent.`);
      }
      const expectedStatus =
        entry.priorMappingStatus === "missing"
          ? "newly-covered"
          : sameStrings(entry.serebiiMoveIds, entry.priorCandidateMoveIds)
            ? "exact-match"
            : entry.priorMappingStatus === "collapsed"
              ? "form-specific-refresh"
              : "source-updated";
      assert(entry.comparisonStatus === expectedStatus, `${label}.comparisonStatus is inconsistent.`);
    }
    seenPokemonIds.add(entry.pokemonId);
  }
  assert(pokemon.every((entry) => seenPokemonIds.has(entry.id)), "Full Serebii snapshot is missing a Pokémon.");

  const statusCount = (status) =>
    snapshot.entries.filter((entry) => entry.comparisonStatus === status).length;
  const expectedMoveReferenceCount = snapshot.entries.reduce(
    (total, entry) => total + entry.serebiiMoveIds.length,
    0
  );
  assert(snapshot.summary.pokemonCount === pokemon.length, "Full Serebii summary Pokémon count is invalid.");
  assert(snapshot.summary.exactMatchCount === statusCount("exact-match"), "Full Serebii exact count is invalid.");
  assert(snapshot.summary.sourceUpdatedCount === statusCount("source-updated"), "Full Serebii updated count is invalid.");
  assert(snapshot.summary.formReviewCount === statusCount("form-specific-refresh"), "Full Serebii form count is invalid.");
  assert(snapshot.summary.newlyCoveredCount === statusCount("newly-covered"), "Full Serebii new count is invalid.");
  assert(snapshot.summary.parseFailedCount === statusCount("parse-failed"), "Full Serebii failed count is invalid.");
  assert(snapshot.summary.moveReferenceCount === expectedMoveReferenceCount, "Full Serebii move count is invalid.");
  return snapshot;
}

export function validateSerebiiLearnsetReviewSnapshot(review, sourceSnapshot) {
  assert(typeof review === "object" && review !== null, "Serebii learnset review snapshot is required.");
  assert(review.schemaVersion === 1, "Serebii learnset review schemaVersion must be 1.");
  assert(review.regulationId === sourceSnapshot.regulationId, "Serebii learnset review regulationId is invalid.");
  assert(review.checkedAt === sourceSnapshot.checkedAt, "Serebii learnset review checkedAt is invalid.");
  assert(review.scope === "serebii-learnset-review", "Serebii learnset review scope is invalid.");
  assert(review.sourceSnapshot === "data/generated/serebii-learnsets-m-b.json", "Serebii learnset review sourceSnapshot is invalid.");
  const expectedEntries = sourceSnapshot.entries.filter(
    (entry) => entry.comparisonStatus === "parse-failed" || entry.unknownMoveIds.length > 0
  );
  assert(Array.isArray(review.entries) && review.entries.length === expectedEntries.length, "Serebii learnset review count is invalid.");
  const expectedById = new Map(expectedEntries.map((entry) => [entry.pokemonId, entry]));
  const seen = new Set();
  for (const [index, entry] of review.entries.entries()) {
    const label = `serebii-learnset-review.entries[${index}]`;
    const sourceEntry = expectedById.get(entry.pokemonId);
    assert(sourceEntry, `${label}.pokemonId is not reviewable.`);
    assert(!seen.has(entry.pokemonId), `${label}.pokemonId is duplicated.`);
    assert(entry.championsId === sourceEntry.championsId, `${label}.championsId is invalid.`);
    assert(entry.form === sourceEntry.form, `${label}.form is invalid.`);
    assert(entry.comparisonStatus === sourceEntry.comparisonStatus, `${label}.comparisonStatus is invalid.`);
    assert(entry.pageUrl === sourceEntry.pageUrl, `${label}.pageUrl is invalid.`);
    assert(entry.currentMoveCount === sourceEntry.serebiiMoveIds.length, `${label}.currentMoveCount is invalid.`);
    assert(entry.priorMoveCount === sourceEntry.priorCandidateMoveIds.length, `${label}.priorMoveCount is invalid.`);
    for (const key of ["addedMoveIds", "removedMoveIds", "unknownMoveIds", "reviewReasons"]) {
      assertUniqueStrings(entry[key], `${label}.${key}`);
    }
    assert(sameStrings(entry.addedMoveIds, sourceEntry.addedSincePriorMoveIds), `${label}.addedMoveIds is invalid.`);
    assert(sameStrings(entry.removedMoveIds, sourceEntry.removedSincePriorMoveIds), `${label}.removedMoveIds is invalid.`);
    assert(sameStrings(entry.unknownMoveIds, sourceEntry.unknownMoveIds), `${label}.unknownMoveIds is invalid.`);
    assert(entry.reviewReasons.length > 0, `${label}.reviewReasons must not be empty.`);
    seen.add(entry.pokemonId);
  }
  assert(review.summary.reviewCount === expectedEntries.length, "Serebii learnset review summary is invalid.");
  return review;
}
