import { eq } from "drizzle-orm";
import { pages } from "@/db/schema";
import { getDb } from "./_db";
import { revalidateContent } from "./_revalidate";

export class PageNotFoundError extends Error {
  constructor(slug: string) {
    super(`Page ${slug} not found`);
    this.name = "PageNotFoundError";
  }
}

export async function getPageBySlug(slug: string) {
  const db = await getDb();
  const [page] = await db.select().from(pages).where(eq(pages.slug, slug));
  return page ?? null;
}

export async function getAllPages() {
  const db = await getDb();
  return db.select().from(pages);
}

export type PageListItem = { id: string; slug: string; title: string; updatedAt: number };

// Lean list for the pages admin table — no content_md (which can be large).
export async function getPagesList(): Promise<PageListItem[]> {
  const db = await getDb();
  return db
    .select({ id: pages.id, slug: pages.slug, title: pages.title, updatedAt: pages.updatedAt })
    .from(pages);
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

  await revalidateContent();
  return { slug };
}

// Keyed by slug like the rest of this module: the admin routes address a page
// by slug, and upsertPage treats it as the identity of the row.
export async function deletePage(slug: string): Promise<void> {
  const db = await getDb();
  const [existing] = await db.select({ id: pages.id }).from(pages).where(eq(pages.slug, slug));
  if (!existing) throw new PageNotFoundError(slug);
  await db.delete(pages).where(eq(pages.slug, slug));
  await revalidateContent();
}
