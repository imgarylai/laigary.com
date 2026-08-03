// Date formatting utilities

import { format, fromUnixTime, parseISO } from "date-fns";

export function fmtDate(iso: string, fmt: "long" | "iso" | "short" = "long"): string {
  const d = parseISO(iso);
  if (fmt === "iso") return format(d, "yyyy.MM.dd");
  if (fmt === "short") return format(d, "MMM d");
  return format(d, "d MMM yyyy");
}

export function unixToIso(unix: number): string {
  return format(fromUnixTime(unix), "yyyy-MM-dd");
}

/**
 * A unix timestamp as the `yyyy-MM-ddTHH:mm` an `<input type="datetime-local">`
 * expects, in the READER'S zone.
 *
 * Local wall-clock is the whole point — the author picks "9am Tuesday" meaning
 * their own 9am — which is also why nothing may call this while rendering on
 * the server: the Worker runs in UTC, so an SSR pass and the hydrating browser
 * would produce two different strings for the same instant. `PublishedAtInput`
 * defers to after mount for exactly this reason.
 */
export function unixToDatetimeLocal(unix: number): string {
  return format(fromUnixTime(unix), "yyyy-MM-dd'T'HH:mm");
}

/**
 * The inverse: a datetime-local value back to unix seconds, or null when the
 * field is empty (the author cleared it) or holds a half-typed date the browser
 * handed over anyway.
 */
export function datetimeLocalToUnix(value: string): number | null {
  if (!value) return null;
  // `parseISO` reads an offset-less string as local time, which is what the
  // input means by it.
  const parsed = parseISO(value);
  const ms = parsed.getTime();
  return Number.isNaN(ms) ? null : Math.floor(ms / 1000);
}

/**
 * A work's editorial year, as one label: `2025` for a single year, `2021–2023`
 * for a range. An `endYear` equal to `year` collapses back to the single form
 * rather than rendering `2021–2021`.
 *
 * En dash, not a hyphen — this is a range, and the terminal type is monospace
 * so the wider glyph still lines up.
 */
export function fmtYearRange(year: number, endYear: number | null): string {
  return endYear && endYear !== year ? `${year}–${endYear}` : String(year);
}

/** Largest unit first; each entry is how many seconds one of that unit is. */
const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31_536_000],
  ["month", 2_592_000],
  ["week", 604_800],
  ["day", 86_400],
  ["hour", 3600],
  ["minute", 60],
];

/**
 * A unix timestamp as "3 hours ago", in the caller's locale.
 *
 * For the admin lists, where an absolute date is close to useless: almost
 * everything was edited recently, and "3 hours ago" vs "yesterday" is the
 * distinction being scanned for (#180). The exact date still goes in a tooltip.
 *
 * `Intl.RelativeTimeFormat` rather than date-fns, which would need its locale
 * bundles imported per language to say this in anything but English.
 */
export function fmtRelativeFromUnix(
  unix: number,
  locale: string,
  now: number = Date.now(),
): string {
  const seconds = Math.round((unix * 1000 - now) / 1000);
  const magnitude = Math.abs(seconds);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  for (const [unitName, unitSeconds] of RELATIVE_UNITS) {
    if (magnitude >= unitSeconds) {
      return rtf.format(Math.trunc(seconds / unitSeconds), unitName);
    }
  }
  // Under a minute. `numeric: "auto"` turns 0 into "now" rather than
  // "in 0 seconds", which is what a just-saved row should read as.
  return rtf.format(0, "second");
}

export function computeReadingTime(contentMd: string): number {
  // CJK characters count as ~1.5 words each; split on whitespace for latin
  const cjkCount = (contentMd.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length;
  const latinWords = contentMd
    .replace(/[\u4e00-\u9fff\u3400-\u4dbf]/g, "")
    .split(/\s+/)
    .filter(Boolean).length;
  const totalWords = latinWords + cjkCount * 1.5;
  return Math.max(1, Math.ceil(totalWords / 200));
}
