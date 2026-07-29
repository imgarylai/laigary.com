// @vitest-environment node

import { describe, it, expect } from "vitest";
import { setupTestDb } from "../helpers/test-db";
import { seedNote, seedPost, seedSection, seedTag, seedWork } from "../../factories";

const harness = setupTestDb();

describe("tags queries", () => {
  it("createTag inserts a new row", async () => {
    const { createTag } = await import("@/db/queries");
    const tag = await createTag({ name: "Life", slug: "life" });

    expect(tag.id).toBeTruthy();
    expect(tag.name).toBe("Life");
    expect(tag.slug).toBe("life");
  });

  it("createTag throws TagConflictError on duplicate slug", async () => {
    const { createTag, TagConflictError } = await import("@/db/queries");
    await createTag({ name: "Life", slug: "life" });

    await expect(createTag({ name: "Life Two", slug: "life" })).rejects.toBeInstanceOf(
      TagConflictError,
    );
  });

  it("updateTag changes the name", async () => {
    const { createTag, updateTag, getTagsWithUsage } = await import("@/db/queries");
    const created = await createTag({ name: "Old", slug: "old" });

    await updateTag(created.id, { name: "New" });
    const all = await getTagsWithUsage();
    expect(all.find((t) => t.id === created.id)?.name).toBe("New");
  });

  it("updateTag throws TagNotFoundError for unknown id", async () => {
    const { updateTag, TagNotFoundError } = await import("@/db/queries");
    await expect(updateTag("does-not-exist", { name: "x" })).rejects.toBeInstanceOf(
      TagNotFoundError,
    );
  });

  it("deleteTag removes the row", async () => {
    const { createTag, deleteTag, getTagsWithUsage } = await import("@/db/queries");
    const created = await createTag({ name: "Tmp", slug: "tmp" });

    await deleteTag(created.id);
    const all = await getTagsWithUsage();
    expect(all).toHaveLength(0);
  });

  it("deleteTag throws TagNotFoundError for unknown id", async () => {
    const { deleteTag, TagNotFoundError } = await import("@/db/queries");
    await expect(deleteTag("does-not-exist")).rejects.toBeInstanceOf(TagNotFoundError);
  });
});

describe("getTagBySlug", () => {
  it("returns the tag's name and slug for a known slug, null otherwise", async () => {
    const { createTag, getTagBySlug } = await import("@/db/queries");
    await createTag({ name: "Life", slug: "life" });

    expect(await getTagBySlug("life")).toEqual({ name: "Life", slug: "life" });
    expect(await getTagBySlug("nope")).toBeNull();
  });
});

describe("getAllTags", () => {
  it("returns id/name/slug for every tag, sorted by name", async () => {
    const { createTag, getAllTags } = await import("@/db/queries");
    await createTag({ name: "Zeta", slug: "zeta" });
    await createTag({ name: "Alpha", slug: "alpha" });

    const all = await getAllTags();
    expect(all.map((t) => t.name)).toEqual(["Alpha", "Zeta"]);
    expect(all[0]).toEqual({ id: expect.any(String), name: "Alpha", slug: "alpha" });
  });
});

describe("tag branch gaps", () => {
  it("getTagsWithUsage includes note usage alongside post usage", async () => {
    const { createTag, getTagsWithUsage } = await import("@/db/queries");
    const tag = await createTag({ name: "DP", slug: "dp" });
    const section = await seedSection();
    await seedNote(section.id, { title: "Knapsack", slug: "knapsack", tagIds: [tag.id] });

    const [usage] = await getTagsWithUsage();
    expect(usage.noteCount).toBe(1);
    expect(usage.postCount).toBe(0);
    expect(usage.usedBy).toEqual([{ type: "note", title: "Knapsack", slug: "knapsack" }]);
  });

  it("getTagsWithUsage includes work usage alongside posts and notes", async () => {
    // Under-reporting here is how a tag still carried by a work gets deleted
    // from the admin list without the warning ever mentioning it.
    const { createTag, getTagsWithUsage } = await import("@/db/queries");
    const tag = await createTag({ name: "Cloudflare", slug: "cloudflare" });
    await seedWork({ title: "laigary.com", slug: "laigary-com", tagIds: [tag.id] });

    const [usage] = await getTagsWithUsage();
    expect(usage.workCount).toBe(1);
    expect(usage.postCount).toBe(0);
    expect(usage.usedBy).toEqual([{ type: "work", title: "laigary.com", slug: "laigary-com" }]);
  });

  it("getTagsWithUsage counts a draft work, which still holds the tag", async () => {
    // Unlike getTagsWithCounts, this feeds the delete warning — detaching a
    // tag from an unpublished work still destroys work the author did.
    const { createTag, getTagsWithUsage } = await import("@/db/queries");
    const tag = await createTag({ name: "WIP", slug: "wip" });
    await seedWork({ slug: "unpublished", status: "draft", tagIds: [tag.id] });

    const [usage] = await getTagsWithUsage();
    expect(usage.workCount).toBe(1);
  });

  it("createTag rethrows non-conflict errors untouched", async () => {
    const { createTag, TagConflictError } = await import("@/db/queries");
    // NOT NULL violation — must NOT be converted into a TagConflictError.
    const err = await createTag({ name: undefined as never, slug: "x" }).catch((e) => e);
    expect(err).toBeInstanceOf(Error);
    expect(err).not.toBeInstanceOf(TagConflictError);
  });

  it("updateTag throws TagConflictError when renaming onto an existing name", async () => {
    const { createTag, updateTag, TagConflictError } = await import("@/db/queries");
    await createTag({ name: "Taken", slug: "taken" });
    const mine = await createTag({ name: "Mine", slug: "mine" });
    await expect(updateTag(mine.id, { name: "Taken" })).rejects.toBeInstanceOf(TagConflictError);
  });

  it("updateTag rethrows non-conflict errors untouched", async () => {
    const { createTag, updateTag, TagConflictError } = await import("@/db/queries");
    const tag = await createTag({ name: "A", slug: "a" });
    const err = await updateTag(tag.id, { name: undefined as never }).catch((e) => e);
    expect(err).toBeInstanceOf(Error);
    expect(err).not.toBeInstanceOf(TagConflictError);
  });
});

// One namespace across posts and notes: `/tags` and the sitemap both read this,
// and both present it as a ranking, so the ordering is part of the contract.
describe("getTagsWithCounts", () => {
  it("ranks tags by their combined post and note count", async () => {
    // Seeded deliberately out of order — `few` is created first and would come
    // out on top if the sort were dropped or reversed.
    const few = await seedTag({ name: "Few", slug: "few" });
    const many = await seedTag({ name: "Many", slug: "many" });
    await seedPost({ slug: "p1", tagIds: [few.id, many.id] });
    await seedPost({ slug: "p2", tagIds: [many.id] });
    await seedPost({ slug: "p3", tagIds: [many.id] });
    const { getTagsWithCounts } = await import("@/db/queries");

    expect(await getTagsWithCounts()).toEqual([
      { name: "Many", slug: "many", count: 3 },
      { name: "Few", slug: "few", count: 1 },
    ]);
  });

  it("adds a tag's note count to its post count rather than replacing it", async () => {
    const tag = await seedTag({ name: "Greedy", slug: "greedy" });
    const section = await seedSection({ slug: "coding" });
    await seedPost({ slug: "p1", tagIds: [tag.id] });
    await seedNote(section.id, { slug: "gas", tagIds: [tag.id] });
    const { getTagsWithCounts } = await import("@/db/queries");

    expect(await getTagsWithCounts()).toEqual([{ name: "Greedy", slug: "greedy", count: 2 }]);
  });

  it("adds a tag's work count so a works-only tag still appears", async () => {
    // Without the works arm this tag ranks as nonexistent, /tags/$slug 404s,
    // and the link the work's own page renders points at nothing.
    const tag = await seedTag({ name: "Cloudflare", slug: "cloudflare" });
    await seedWork({ slug: "w1", tagIds: [tag.id] });
    const { getTagsWithCounts } = await import("@/db/queries");

    expect(await getTagsWithCounts()).toEqual([
      { name: "Cloudflare", slug: "cloudflare", count: 1 },
    ]);
  });

  it("sums a tag carried by a post, a note and a work", async () => {
    const tag = await seedTag({ name: "Go", slug: "go" });
    const section = await seedSection({ slug: "coding" });
    await seedPost({ slug: "p1", tagIds: [tag.id] });
    await seedNote(section.id, { slug: "n1", tagIds: [tag.id] });
    await seedWork({ slug: "w1", tagIds: [tag.id] });
    const { getTagsWithCounts } = await import("@/db/queries");

    expect(await getTagsWithCounts()).toEqual([{ name: "Go", slug: "go", count: 3 }]);
  });

  it("leaves out tags whose only content is unpublished", async () => {
    const tag = await seedTag({ name: "Draft only", slug: "draft-only" });
    await seedPost({ slug: "wip", status: "draft", tagIds: [tag.id] });
    const { getTagsWithCounts } = await import("@/db/queries");

    expect(await getTagsWithCounts()).toEqual([]);
  });

  it("leaves out a tag whose only work is a draft", async () => {
    // The publish-gated half of the works arm — the assertion that can fail if
    // the status filter is dropped from the new count query.
    const tag = await seedTag({ name: "Secret", slug: "secret" });
    await seedWork({ slug: "unpublished", status: "draft", tagIds: [tag.id] });
    const { getTagsWithCounts } = await import("@/db/queries");

    expect(await getTagsWithCounts()).toEqual([]);
  });

  // This aggregate makes SQLite scan the whole posts/notes/works tables, and
  // /tags and the home page both run it on every navigation, so it is cached.
  // What the cache must not do is outlive a publish.
  it("should serve counts from cache until a content mutation invalidates them", async () => {
    const tag = await seedTag({ name: "Greedy", slug: "greedy" });
    await seedPost({ slug: "p1", tagIds: [tag.id] });
    const { getTagsWithCounts } = await import("@/db/queries");
    expect(await getTagsWithCounts()).toEqual([{ name: "Greedy", slug: "greedy", count: 1 }]);

    // Link a second post to the tag without going through the query layer: a
    // stale count here proves the read was served from memory.
    harness.sqlite
      .prepare(
        "INSERT INTO posts (id, slug, title, content_md, status, published_at) VALUES ('x', 'p2', 'P2', '', 'published', 1)",
      )
      .run();
    harness.sqlite.prepare("INSERT INTO post_tags (post_id, tag_id) VALUES ('x', ?)").run(tag.id);
    expect(await getTagsWithCounts()).toEqual([{ name: "Greedy", slug: "greedy", count: 1 }]);

    // A real publish goes through createPost, which invalidates.
    await seedPost({ slug: "p3", tagIds: [tag.id] });
    expect(await getTagsWithCounts()).toEqual([{ name: "Greedy", slug: "greedy", count: 3 }]);
  });

  it("should invalidate the cached counts when a work is published", async () => {
    // Works now feed this aggregate, so publishing one has to bust the same
    // cache a post does. Without revalidateContent in the works mutations the
    // new entry is invisible on /tags until something else happens to publish.
    const tag = await seedTag({ name: "Cloudflare", slug: "cloudflare" });
    await seedPost({ slug: "p1", tagIds: [tag.id] });
    const { getTagsWithCounts } = await import("@/db/queries");
    expect(await getTagsWithCounts()).toEqual([
      { name: "Cloudflare", slug: "cloudflare", count: 1 },
    ]);

    await seedWork({ slug: "w1", tagIds: [tag.id] });

    expect(await getTagsWithCounts()).toEqual([
      { name: "Cloudflare", slug: "cloudflare", count: 2 },
    ]);
  });
});
