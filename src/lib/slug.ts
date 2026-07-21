import { toWadeGiles } from "use-wg";

/**
 * Turn a human title into a URL slug. 中文 is romanized to Wade-Giles; the
 * result is lowercased and reduced to the `[a-z0-9-]` charset the post/note
 * slug schemas require.
 *
 * `toWadeGiles({ urlSafe })` only lowercases and turns spaces into hyphens — it
 * leaves punctuation (". + , &" …) intact, so "1. Test" would become "1.-test"
 * and fail validation. Collapsing every run of non-alphanumerics into a single
 * hyphen (and trimming the ends) fixes that: "1. Test" → "1-test".
 */
export function slugify(text: string): string {
  return toWadeGiles(text, { urlSafe: true })
    .text.toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
