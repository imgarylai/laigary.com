import { describe, expect, it } from "vitest";
import { createLowlight } from "lowlight";
import {
  CODE_LANGUAGE_GRAMMARS,
  CODE_LANGUAGE_OPTIONS,
  DETECTABLE_LANGUAGES,
  PLAIN_LANGUAGE,
} from "@/lib/code-languages";

describe("code-languages", () => {
  it("should register every detectable language when the grammars are loaded into lowlight", () => {
    const lowlight = createLowlight(CODE_LANGUAGE_GRAMMARS);
    const registered = lowlight.listLanguages();

    for (const language of DETECTABLE_LANGUAGES) {
      expect(registered, `${language} has no grammar`).toContain(language);
    }
  });

  it("should carry each grammar's aliases so a fence can use the short name", () => {
    const lowlight = createLowlight(CODE_LANGUAGE_GRAMMARS);

    // The note corpus writes ```py in a dozen places; aliases ride along with
    // the grammar definition, so no separate entry is needed for them.
    expect(lowlight.registered("py")).toBe(true);
    expect(lowlight.registered("js")).toBe(true);
    expect(lowlight.registered("ts")).toBe(true);
  });

  it("should exclude the plain-text marker from detection since it means 'do not highlight'", () => {
    expect(DETECTABLE_LANGUAGES).not.toContain(PLAIN_LANGUAGE);
  });

  it("should register the plain-text marker so an unresolved language never auto-detects instead", () => {
    // Tiptap's lowlight plugin falls back to highlightAuto for a language it
    // cannot resolve, so leaving ```text unregistered would colour the one kind
    // of block that must stay plain.
    const lowlight = createLowlight(CODE_LANGUAGE_GRAMMARS);

    expect(lowlight.registered(PLAIN_LANGUAGE)).toBe(true);
    expect(CODE_LANGUAGE_OPTIONS.map((o) => o.value)).toContain(PLAIN_LANGUAGE);
  });

  it("should back every other picker option with a grammar so nothing offered renders uncoloured", () => {
    const offered = CODE_LANGUAGE_OPTIONS.map((o) => o.value).filter((v) => v !== PLAIN_LANGUAGE);

    expect(offered.sort()).toEqual([...DETECTABLE_LANGUAGES].sort());
  });

  it("should give every option a distinct value so the picker cannot show duplicates", () => {
    const values = CODE_LANGUAGE_OPTIONS.map((o) => o.value);

    expect(new Set(values).size).toBe(values.length);
  });
});
