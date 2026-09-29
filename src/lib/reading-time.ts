type Translate = (key: string, params?: Record<string, string>) => string;

export function formatReadingTime(minutes: number, t: Translate): string {
  if (minutes < 60) return t("blog.interview.minRead", { min: String(minutes) });
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder
    ? t("blog.interview.hourMinRead", { hours: String(hours), min: String(remainder) })
    : t("blog.interview.hourRead", { hours: String(hours) });
}
