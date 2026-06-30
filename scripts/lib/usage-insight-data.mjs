function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertUsagePercent(value, label) {
  assert(
    typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100,
    `${label}.usagePercent must be a number from 0 to 100.`
  );
}

function validateUsageList(entries, knownIds, idKey, label) {
  assert(Array.isArray(entries), `${label} must be an array.`);
  const ids = new Set();

  for (const [index, entry] of entries.entries()) {
    const entryLabel = `${label}[${index}]`;
    assert(typeof entry === "object" && entry !== null, `${entryLabel} is required.`);
    assert(
      typeof entry[idKey] === "string" && knownIds.has(entry[idKey]),
      `${entryLabel}.${idKey} is invalid.`
    );
    assert(!ids.has(entry[idKey]), `${entryLabel}.${idKey} is duplicated.`);
    assertUsagePercent(entry.usagePercent, entryLabel);
    ids.add(entry[idKey]);
  }
}

function validateStatPointSpread(entry, label) {
  assert(typeof entry === "object" && entry !== null, `${label} is required.`);
  assert(typeof entry.label === "string" && entry.label.length > 0, `${label}.label is required.`);
  assertUsagePercent(entry.usagePercent, label);
  assert(typeof entry.statPoints === "object" && entry.statPoints !== null, `${label}.statPoints is required.`);

  const statKeys = ["hp", "attack", "specialAttack", "defense", "specialDefense", "speed"];
  let total = 0;
  for (const statKey of statKeys) {
    const value = entry.statPoints[statKey];
    assert(Number.isInteger(value) && value >= 0, `${label}.statPoints.${statKey} is invalid.`);
    total += value;
  }
  assert(total <= 66, `${label}.statPoints total must not exceed 66.`);
}

export function validateUsageInsightSnapshot(
  snapshot,
  pokemon,
  moveSnapshot,
  itemSnapshot,
  abilitySnapshot
) {
  assert(typeof snapshot === "object" && snapshot !== null, "Usage insight snapshot is required.");
  assert(snapshot.schemaVersion === 1, "Usage insight schemaVersion must be 1.");
  assert(snapshot.regulationId === "M-B", "Usage insight regulationId must be M-B.");
  assert(/^\d{4}-\d{2}-\d{2}$/.test(snapshot.checkedAt), "Usage insight checkedAt is invalid.");
  assert(typeof snapshot.source === "object" && snapshot.source !== null, "Usage insight source is required.");
  assert(typeof snapshot.source.id === "string" && snapshot.source.id.length > 0, "Usage insight source.id is required.");
  assert(
    typeof snapshot.source.description === "string" && snapshot.source.description.length > 0,
    "Usage insight source.description is required."
  );
  assert(Array.isArray(snapshot.entries), "Usage insight entries must be an array.");

  const pokemonIds = new Set(pokemon.map((entry) => entry.id));
  const moveIds = new Set(moveSnapshot.entries.map((entry) => entry.id));
  const itemIds = new Set(itemSnapshot.entries.map((entry) => entry.id));
  const abilityIds = new Set(abilitySnapshot.abilities.map((entry) => entry.id));
  const seenPokemonIds = new Set();

  for (const [index, entry] of snapshot.entries.entries()) {
    const label = `usage-insights.entries[${index}]`;
    assert(typeof entry === "object" && entry !== null, `${label} is required.`);
    assert(typeof entry.pokemonId === "string" && pokemonIds.has(entry.pokemonId), `${label}.pokemonId is invalid.`);
    assert(!seenPokemonIds.has(entry.pokemonId), `${label}.pokemonId is duplicated.`);
    assert(Number.isInteger(entry.usageRank) && entry.usageRank > 0, `${label}.usageRank is invalid.`);

    validateUsageList(entry.moves, moveIds, "moveId", `${label}.moves`);
    validateUsageList(entry.abilities, abilityIds, "abilityId", `${label}.abilities`);
    validateUsageList(entry.items, itemIds, "itemId", `${label}.items`);

    assert(Array.isArray(entry.statPointSpreads), `${label}.statPointSpreads must be an array.`);
    entry.statPointSpreads.forEach((spread, spreadIndex) =>
      validateStatPointSpread(spread, `${label}.statPointSpreads[${spreadIndex}]`)
    );

    assert(Array.isArray(entry.natureModifiers), `${label}.natureModifiers must be an array.`);
    for (const [modifierIndex, modifier] of entry.natureModifiers.entries()) {
      const modifierLabel = `${label}.natureModifiers[${modifierIndex}]`;
      assert(typeof modifier === "object" && modifier !== null, `${modifierLabel} is required.`);
      assert(
        typeof modifier.labelKo === "string" && modifier.labelKo.length > 0,
        `${modifierLabel}.labelKo is required.`
      );
      assertUsagePercent(modifier.usagePercent, modifierLabel);
    }

    assert(typeof entry.notesKo === "string", `${label}.notesKo is required.`);
    seenPokemonIds.add(entry.pokemonId);
  }

  return snapshot;
}
