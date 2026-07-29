import { count, eq } from "drizzle-orm";
import { posts, interviewNotes, pages, tags, works } from "@/db/schema";
import { getDb } from "./_db";

export type DashboardStats = {
  postsTotal: number;
  postsPublished: number;
  postsDrafts: number;
  notes: number;
  works: number;
  pages: number;
  tags: number;
};

// Dashboard content counts. All cheap COUNT(*)s off already-stored data — no
// traffic/view tracking here (that would need a separate write path).
export async function getDashboardStats(): Promise<DashboardStats> {
  const db = await getDb();
  const [postsTotal, postsPublished, notes, workCount, pageCount, tagCount] = await Promise.all([
    db.select({ n: count() }).from(posts),
    db.select({ n: count() }).from(posts).where(eq(posts.status, "published")),
    db.select({ n: count() }).from(interviewNotes),
    db.select({ n: count() }).from(works),
    db.select({ n: count() }).from(pages),
    db.select({ n: count() }).from(tags),
  ]);
  const total = postsTotal[0].n;
  const published = postsPublished[0].n;
  return {
    postsTotal: total,
    postsPublished: published,
    postsDrafts: total - published,
    notes: notes[0].n,
    works: workCount[0].n,
    pages: pageCount[0].n,
    tags: tagCount[0].n,
  };
}
