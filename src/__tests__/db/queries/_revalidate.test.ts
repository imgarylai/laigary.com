// @vitest-environment node
//
// The content version behind the edge cache key. If it stops moving, a publish
// is invisible for a day; if it moves when nothing was written, the edge cache
// never gets a hit and the whole layer is dead weight.

import { describe, it, expect } from "vitest";
import { setupTestDb } from "../helpers/test-db";
import { seedNote, seedPost, seedSection, seedTag } from "../../factories";

const harness = setupTestDb();

describe("getContentVersion", () => {
  it("should report a version for a database nothing has been written to", async () => {
    const { getContentVersion } = await import("@/db/queries/_revalidate");
    expect(await getContentVersion()).toBe("0");
  });

  it("should serve the version from cache rather than reading it per request", async () => {
    // Read on every cacheable request, so a query each time would trade the
    // edge cache's savings straight back.
    const { getContentVersion } = await import("@/db/queries/_revalidate");
    await getContentVersion();

    harness.sqlite
      .prepare("INSERT INTO cache_meta (key, value) VALUES ('content_version', 'behind-its-back')")
      .run();

    expect(await getContentVersion()).toBe("0");
  });
});

describe("revalidateContent", () => {
  it("should move the version so previously cached pages stop being reachable", async () => {
    const { getContentVersion, revalidateContent } = await import("@/db/queries/_revalidate");
    expect(await getContentVersion()).toBe("0");

    await revalidateContent();
    expect(await getContentVersion()).toBe("1");
  });

  it("should keep moving the version when two writes land in the same millisecond", async () => {
    // A timestamp would stamp both with the same value, and the second write's
    // pages would go on being served from the first write's cache entries.
    const { getContentVersion, revalidateContent } = await import("@/db/queries/_revalidate");
    await Promise.all([revalidateContent(), revalidateContent(), revalidateContent()]);
    expect(await getContentVersion()).toBe("3");
  });

  it("should not throw when the version write fails", async () => {
    // It runs after the mutation has committed. Failing the save here would
    // report a lost post that is in fact saved, and the retry would collide on
    // the slug.
    const { revalidateContent } = await import("@/db/queries/_revalidate");
    harness.sqlite.exec("DROP TABLE cache_meta");

    await expect(revalidateContent()).resolves.toBeUndefined();

    harness.sqlite.exec(
      "CREATE TABLE cache_meta (key text PRIMARY KEY NOT NULL, value text NOT NULL, updated_at integer DEFAULT (strftime('%s', 'now')) NOT NULL)",
    );
  });
});

// Every mutation that changes what a public page renders has to reach the
// version, or that page stays cached at the edge for a full day.
describe("content mutations", () => {
  it("should move the version when a post is created", async () => {
    const { getContentVersion } = await import("@/db/queries/_revalidate");
    const before = await getContentVersion();
    await seedPost({ slug: "p1" });
    expect(await getContentVersion()).not.toBe(before);
  });

  it("should move the version when a post is updated or deleted", async () => {
    const { updatePost, deletePost } = await import("@/db/queries");
    const { getContentVersion } = await import("@/db/queries/_revalidate");
    const post = await seedPost({ slug: "p1" });

    const afterCreate = await getContentVersion();
    await updatePost(post.id, { title: "Renamed" });
    const afterUpdate = await getContentVersion();
    expect(afterUpdate).not.toBe(afterCreate);

    await deletePost(post.id);
    expect(await getContentVersion()).not.toBe(afterUpdate);
  });

  it("should move the version when a note is created", async () => {
    const { getContentVersion } = await import("@/db/queries/_revalidate");
    const section = await seedSection({ slug: "coding" });
    const before = await getContentVersion();
    await seedNote(section.id, { slug: "n1" });
    expect(await getContentVersion()).not.toBe(before);
  });

  it("should move the version when a tag is renamed", async () => {
    // A rename changes the chip row and every tag page that lists it.
    const { updateTag } = await import("@/db/queries");
    const { getContentVersion } = await import("@/db/queries/_revalidate");
    const tag = await seedTag({ name: "Go", slug: "go" });
    const before = await getContentVersion();

    await updateTag(tag.id, { name: "Golang" });

    expect(await getContentVersion()).not.toBe(before);
  });
});
