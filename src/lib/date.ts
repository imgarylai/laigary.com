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
