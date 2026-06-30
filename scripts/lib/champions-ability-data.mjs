import { decodeHtml, toMoveId } from "./serebii-learnset-data.mjs";

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

const serebiiAbilityAliases = new Map([["compoundeyes", "compound-eyes"]]);

function toAbilityId(name) {
  const normalizedId = toMoveId(name);
  return serebiiAbilityAliases.get(normalizedId) ?? normalizedId;
}

export function extractSerebiiAbilityIds(html) {
  const abilityCell = html.match(
    /<td[^>]*>\s*<b>Abilities<\/b>\s*:(?<body>[\s\S]*?)<\/td>/i
  )?.groups.body;
  if (!abilityCell) {
    throw new Error("Serebii ability summary was not found.");
  }

  const abilityIds = Array.from(
    new Set(
      Array.from(
        abilityCell.matchAll(
          /<a href="\/abilitydex\/[^"]+\.shtml"><b>(?<name>[^<]+)<\/b><\/a>/gi
        ),
        (match) => toAbilityId(decodeHtml(match.groups.name))
      )
    )
  ).sort();
  if (abilityIds.length === 0) {
    throw new Error("Serebii ability summary did not contain ability links.");
  }
  return abilityIds;
}

export function validateChampionsAbilitySnapshot(snapshot, pokemon) {
  assert(
    typeof snapshot === "object" && snapshot !== null,
    "Champions ability snapshot is required."
  );
  assert(snapshot.schemaVersion === 1, "Champions ability schemaVersion must be 1.");
  assert(snapshot.regulationId === "M-B", "Champions ability regulationId must be M-B.");
  assert(
    /^\d{4}-\d{2}-\d{2}$/.test(snapshot.checkedAt),
    "Champions ability checkedAt is invalid."
  );
  assert(
    snapshot.scope === "serebii-champions-form-abilities",
    "Champions ability scope is invalid."
  );
  assert(
    snapshot.source.serebiiId === "serebii-champions-pokedex",
    "Champions ability Serebii source is invalid."
  );
  assert(snapshot.source.pokeapiId === "pokeapi", "Champions ability PokeAPI source is invalid.");
  assertUniqueStrings(snapshot.limitations, "Champions ability limitations");
  assert(
    Array.isArray(snapshot.abilities) && snapshot.abilities.length > 0,
    "Champions ability details are required."
  );
  assert(
    Array.isArray(snapshot.pokemonAbilities) &&
      snapshot.pokemonAbilities.length === pokemon.length,
    "Champions Pokemon ability mappings are incomplete."
  );

  const knownAbilityIds = new Set();
  for (const [index, ability] of snapshot.abilities.entries()) {
    const label = `champions-abilities.abilities[${index}]`;
    assert(typeof ability.id === "string" && /^[a-z0-9-]+$/.test(ability.id), `${label}.id is invalid.`);
    assert(!knownAbilityIds.has(ability.id), `${label}.id is duplicated.`);
    assert(Number.isInteger(ability.pokeapiId), `${label}.pokeapiId is invalid.`);
    assert(ability.nameKo === null || (typeof ability.nameKo === "string" && ability.nameKo.length > 0), `${label}.nameKo is invalid.`);
    assert(typeof ability.nameEn === "string" && ability.nameEn.length > 0, `${label}.nameEn is required.`);
    assert(ability.publishStatus === "review-candidate", `${label}.publishStatus is invalid.`);
    assertUniqueStrings(ability.sources, `${label}.sources`);
    assert(sameStrings(ability.sources, ["pokeapi"]), `${label}.sources is invalid.`);
    knownAbilityIds.add(ability.id);
  }

  const pokemonById = new Map(pokemon.map((entry) => [entry.id, entry]));
  const seenPokemonIds = new Set();
  for (const [index, mapping] of snapshot.pokemonAbilities.entries()) {
    const label = `champions-abilities.pokemonAbilities[${index}]`;
    const pokemonEntry = pokemonById.get(mapping.pokemonId);
    assert(pokemonEntry, `${label}.pokemonId is missing from published Pokemon.`);
    assert(!seenPokemonIds.has(mapping.pokemonId), `${label}.pokemonId is duplicated.`);
    assert(mapping.championsId === pokemonEntry.championsId, `${label}.championsId is invalid.`);
    assert(mapping.form === pokemonEntry.form, `${label}.form is invalid.`);
    assert(typeof mapping.pageUrl === "string" && mapping.pageUrl.startsWith("https://"), `${label}.pageUrl is invalid.`);
    assertUniqueStrings(mapping.abilityIds, `${label}.abilityIds`);
    assertUniqueStrings(mapping.sourceSpeciesAbilityIds, `${label}.sourceSpeciesAbilityIds`);
    assertUniqueStrings(mapping.unconfirmedAbilityIds, `${label}.unconfirmedAbilityIds`);
    assert(sameStrings(mapping.abilityIds, pokemonEntry.abilities), `${label}.abilityIds differs from Pokemon data.`);
    assert(mapping.abilityIds.every((id) => knownAbilityIds.has(id)), `${label}.abilityIds contains unknown details.`);
    assert(
      sameStrings(
        mapping.unconfirmedAbilityIds,
        mapping.abilityIds.filter((id) => !mapping.sourceSpeciesAbilityIds.includes(id))
      ),
      `${label}.unconfirmedAbilityIds is inconsistent.`
    );
    assert(mapping.verificationStatus === (mapping.unconfirmedAbilityIds.length === 0 ? "confirmed" : "review-required"), `${label}.verificationStatus is inconsistent.`);
    assert(mapping.publishStatus === "review-candidate", `${label}.publishStatus is invalid.`);
    seenPokemonIds.add(mapping.pokemonId);
  }

  const missingKoreanNameCount = snapshot.abilities.filter((entry) => entry.nameKo === null).length;
  const reviewRequiredCount = snapshot.pokemonAbilities.filter(
    (entry) => entry.verificationStatus === "review-required"
  ).length;
  assert(snapshot.summary.pokemonCount === pokemon.length, "Champions ability Pokemon count is invalid.");
  assert(snapshot.summary.abilityCount === snapshot.abilities.length, "Champions ability count is invalid.");
  assert(snapshot.summary.missingKoreanNameCount === missingKoreanNameCount, "Champions ability localization count is invalid.");
  assert(snapshot.summary.reviewRequiredCount === reviewRequiredCount, "Champions ability review count is invalid.");
  return snapshot;
}
