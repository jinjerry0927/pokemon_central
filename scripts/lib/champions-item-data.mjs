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

export function toItemId(name) {
  return decodeHtml(name)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]s\b/g, "s")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function extractSectionTable(html, heading) {
  const headingPattern = new RegExp(`<u>\\s*${heading}\\s*<\\/u>`, "i");
  const headingMatch = headingPattern.exec(html);
  if (!headingMatch) {
    throw new Error(`Serebii item section not found: ${heading}`);
  }
  const tableStart = html.indexOf("<table", headingMatch.index);
  const tableEnd = html.indexOf("</table>", tableStart);
  if (tableStart < 0 || tableEnd < 0) {
    throw new Error(`Serebii item table not found: ${heading}`);
  }
  return html.slice(tableStart, tableEnd + "</table>".length);
}

function extractSectionItems(html, heading, category) {
  const table = extractSectionTable(html, heading);
  return Array.from(
    table.matchAll(
      /<td class="fooinfo"><a href="(?<path>\/itemdex\/[^\"]+\.shtml)">(?<name>[^<]+)<\/a><\/td>/gi
    ),
    (match) => {
      const nameEn = decodeHtml(match.groups.name).trim();
      return {
        id: toItemId(nameEn),
        nameEn,
        category,
        itemDexPath: match.groups.path
      };
    }
  );
}

export function parseChampionsHeldItems(html) {
  const entries = [
    ...extractSectionItems(html, "Hold Items", "held-item"),
    ...extractSectionItems(html, "Berries", "berry")
  ];
  const ids = new Set();
  for (const entry of entries) {
    if (ids.has(entry.id)) {
      throw new Error(`Duplicate Serebii item ID: ${entry.id}`);
    }
    ids.add(entry.id);
  }
  return entries;
}

export function validateChampionsItemSnapshot(snapshot) {
  assert(typeof snapshot === "object" && snapshot !== null, "Champions item snapshot is required.");
  assert(snapshot.schemaVersion === 1, "Champions item schemaVersion must be 1.");
  assert(snapshot.regulationId === "M-B", "Champions item regulationId must be M-B.");
  assert(/^\d{4}-\d{2}-\d{2}$/.test(snapshot.checkedAt), "Champions item checkedAt is invalid.");
  assert(snapshot.scope === "serebii-champions-held-items", "Champions item scope is invalid.");
  assert(snapshot.source.id === "serebii-champions-items", "Champions item source ID is invalid.");
  for (const key of ["itemsUrl", "officialRegulationUrl"]) {
    assert(
      typeof snapshot.source[key] === "string" && snapshot.source[key].startsWith("https://"),
      `Champions item source.${key} is invalid.`
    );
  }
  assert(snapshot.source.contentUsage === "factual-item-identifiers-only", "Champions item content usage is invalid.");
  assert(snapshot.rules.duplicateHeldItemsAllowed === false, "Champions item duplicate rule is invalid.");
  assert(
    snapshot.rules.evidenceUrl === snapshot.source.officialRegulationUrl,
    "Champions item rule evidence URL is invalid."
  );
  assertUniqueStrings(snapshot.limitations, "Champions item limitations");
  assert(Array.isArray(snapshot.entries) && snapshot.entries.length > 0, "Champions item entries are required.");

  const ids = new Set();
  for (const [index, entry] of snapshot.entries.entries()) {
    const label = `champions-items.entries[${index}]`;
    assert(typeof entry.id === "string" && /^[a-z0-9-]+$/.test(entry.id), `${label}.id is invalid.`);
    assert(!ids.has(entry.id), `${label}.id is duplicated.`);
    assert(entry.nameKo === null || (typeof entry.nameKo === "string" && entry.nameKo.length > 0), `${label}.nameKo is invalid.`);
    assert(typeof entry.nameEn === "string" && entry.nameEn.length > 0, `${label}.nameEn is required.`);
    assert(["held-item", "berry"].includes(entry.category), `${label}.category is invalid.`);
    assert(typeof entry.itemDexUrl === "string" && entry.itemDexUrl.startsWith("https://"), `${label}.itemDexUrl is invalid.`);
    assert(entry.pokeapiId === null || Number.isInteger(entry.pokeapiId), `${label}.pokeapiId is invalid.`);
    assert(["matched", "missing"].includes(entry.pokeapiStatus), `${label}.pokeapiStatus is invalid.`);
    assert(entry.localizationStatus === (entry.nameKo ? "complete" : "missing-ko"), `${label}.localizationStatus is invalid.`);
    assert(entry.publishStatus === "review-candidate", `${label}.publishStatus must remain review-candidate.`);
    assertUniqueStrings(entry.sources, `${label}.sources`);
    assert(entry.sources.includes("serebii-champions-items"), `${label}.sources must include Serebii.`);
    assert(
      entry.pokeapiStatus === (entry.pokeapiId === null ? "missing" : "matched"),
      `${label}.pokeapiStatus does not match pokeapiId.`
    );
    assert(
      entry.sources.includes("pokeapi") === (entry.pokeapiStatus === "matched"),
      `${label}.sources does not match PokeAPI status.`
    );
    ids.add(entry.id);
  }

  const heldItemCount = snapshot.entries.filter((entry) => entry.category === "held-item").length;
  const berryCount = snapshot.entries.filter((entry) => entry.category === "berry").length;
  const pokeapiMatchedCount = snapshot.entries.filter((entry) => entry.pokeapiStatus === "matched").length;
  const missingKoreanNameCount = snapshot.entries.filter((entry) => entry.nameKo === null).length;
  assert(snapshot.summary.itemCount === snapshot.entries.length, "Champions item summary itemCount is invalid.");
  assert(snapshot.summary.heldItemCount === heldItemCount, "Champions item summary heldItemCount is invalid.");
  assert(snapshot.summary.berryCount === berryCount, "Champions item summary berryCount is invalid.");
  assert(snapshot.summary.pokeapiMatchedCount === pokeapiMatchedCount, "Champions item summary PokeAPI count is invalid.");
  assert(snapshot.summary.pokeapiMissingCount === snapshot.entries.length - pokeapiMatchedCount, "Champions item summary missing count is invalid.");
  assert(snapshot.summary.missingKoreanNameCount === missingKoreanNameCount, "Champions item summary localization count is invalid.");
  return snapshot;
}
