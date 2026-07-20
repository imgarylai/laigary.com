import { eq } from "drizzle-orm";
import { pages } from "@/db/schema";
import { getDb } from "./_db";

export async function getPageBySlug(slug: string) {
  const db = await getDb();
  const [page] = await db.select().from(pages).where(eq(pages.slug, slug));
  return page ?? null;
}

export async function getAllPages() {
  const db = await getDb();
  return db.select().from(pages);
}

export async function upsertPage(
  slug: string,
  input: { title?: string; contentMd?: string },
): Promise<{ slug: string }> {
  const db = await getDb();
  const [existing] = await db.select().from(pages).where(eq(pages.slug, slug));

  if (existing) {
    await db
      .update(pages)
      .set({
        title: input.title ?? existing.title,
        contentMd: input.contentMd ?? existing.contentMd,
        updatedAt: Math.floor(Date.now() / 1000),
      })
      .where(eq(pages.slug, slug));
  } else {
    await db.insert(pages).values({
      id: crypto.randomUUID(),
      slug,
      title: input.title ?? slug,
      contentMd: input.contentMd ?? "",
    });
  }

  return { slug };
}
