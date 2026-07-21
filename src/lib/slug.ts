import { toWadeGiles } from "use-wg";

/**
 * Turn a human title into a URL slug: 中文 → Wade-Giles, lowercased and reduced
 * to the `[a-z0-9-]` charset the post/note slug schemas require.
 *
 * use-wg's `urlSafe` handles the full cleanup — including punctuation like
 * "1. Test" → "1-test" — as of v2.0.5 (imgarylai/use-wg#33), so no extra
 * sanitizing is needed here. slug.test.ts guards this in case that regresses.
 */
export function slugify(text: string): string {
  return toWadeGiles(text, { urlSafe: true }).text;
}
