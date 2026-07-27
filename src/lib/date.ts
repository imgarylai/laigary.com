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
