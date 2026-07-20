// Date formatting utilities

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function fmtDate(iso: string, fmt: "long" | "iso" | "short" = "long"): string {
  const [y, m, d] = iso.split("-");
  if (fmt === "iso") return `${y}.${m}.${d}`;
  if (fmt === "short") return `${MONTHS[+m - 1]} ${+d}`;
  return `${+d} ${MONTHS[+m - 1]} ${y}`;
}

export function unixToIso(unix: number): string {
  const d = new Date(unix * 1000);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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
