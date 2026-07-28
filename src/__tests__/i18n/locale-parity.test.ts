// @vitest-environment node
//
// AGENTS.md requires every key to exist in BOTH locale files. That is the one
// rule in the document with a hard, machine-checkable invariant, and nothing
// checked it — 7 entries could be deleted from zh-TW.json and the whole suite
// stayed green (#207).
//
// It matters more than a missing translation because `getTranslation` has no
// `en` fallback: an unresolved path renders the raw dotted string, so a zh-TW
// reader gets a literal "blog.archive.noMatch" on the page.

import { describe, it, expect } from "vitest";
import en from "@/i18n/locales/en.json";
import zhTW from "@/i18n/locales/zh-TW.json";

/** Every leaf as [dotted.path, value]. Objects are walked; anything else is a leaf. */
function leaves(node: unknown, path = ""): [string, unknown][] {
  if (typeof node !== "object" || node === null) return [[path, node]];
  return Object.entries(node).flatMap(([k, v]) => leaves(v, path ? `${path}.${k}` : k));
}

/** Interpolation names in a string: `t("x", { count })` substitutes `{count}`. */
function placeholders(value: unknown): string[] {
  return [...String(value).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
}

const enLeaves = leaves(en);
const zhLeaves = leaves(zhTW);
const enKeys = new Set(enLeaves.map(([k]) => k));
const zhKeys = new Set(zhLeaves.map(([k]) => k));

const only = (a: Set<string>, b: Set<string>) => [...a].filter((k) => !b.has(k)).sort();

describe("locale key parity", () => {
  it("defines the same keys in en and zh-TW, in both directions", () => {
    // Asserted as one object so a failure names the exact keys per side — the
    // point is to fix it from the CI log without diffing two files locally.
    expect({
      missingFromZhTW: only(enKeys, zhKeys),
      missingFromEn: only(zhKeys, enKeys),
    }).toEqual({ missingFromZhTW: [], missingFromEn: [] });
  });

  it("resolves every key to a string in both locales", () => {
    // A key that is an object in one file and a string in the other passes the
    // set comparison above only if the nesting matches; this catches the rest.
    // getTranslation returns the key path for a non-string, so an object here
    // renders as raw dotted text exactly like a missing key would.
    const nonStrings = [...enLeaves, ...zhLeaves]
      .filter(([, v]) => typeof v !== "string")
      .map(([k]) => k);

    expect(nonStrings).toEqual([]);
  });

  it("uses the same interpolation names for a given key in both locales", () => {
    // `t()` substitutes by name, so a zh-TW string that drops `{count}` silently
    // loses the number rather than failing — the sentence just reads wrong.
    const zhByKey = new Map(zhLeaves);
    const mismatched = enLeaves
      .filter(([k]) => zhByKey.has(k))
      .map(([k, v]) => ({ key: k, en: placeholders(v), zhTW: placeholders(zhByKey.get(k)) }))
      .filter(({ en: e, zhTW: z }) => e.join(",") !== z.join(","));

    expect(mismatched).toEqual([]);
  });

  it("is comparing a non-trivial number of keys", () => {
    // Guards the walker itself: if `leaves` ever stopped recursing it would
    // return almost nothing and all three tests above would pass vacuously.
    expect(enKeys.size).toBeGreaterThan(300);
    expect(zhKeys.size).toBe(enKeys.size);
  });
});
