import { eq } from "drizzle-orm";
import { siteSettings } from "@/db/schema";
import { getDb } from "./_db";

export async function getSiteSettings(): Promise<Record<string, string>> {
  const db = await getDb();
  const rows = await db.select().from(siteSettings);
  const map: Record<string, string> = {};
  for (const row of rows) {
    map[row.key] = row.value;
  }
  return map;
}

export async function getSiteSetting(key: string): Promise<string | null> {
  const db = await getDb();
  const [row] = await db.select().from(siteSettings).where(eq(siteSettings.key, key));
  return row?.value ?? null;
}

export async function updateSiteSettings(values: Record<string, string>): Promise<void> {
  const db = await getDb();
  const now = Math.floor(Date.now() / 1000);
  for (const [key, value] of Object.entries(values)) {
    const [existing] = await db.select().from(siteSettings).where(eq(siteSettings.key, key));
    if (existing) {
      await db.update(siteSettings).set({ value, updatedAt: now }).where(eq(siteSettings.key, key));
    } else {
      await db.insert(siteSettings).values({ key, value });
    }
  }
}
