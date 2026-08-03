// @vitest-environment node
//
// The scheduling primitives: what "live" means, and when the caches have to let
// go of a page because a post is about to become one.

import { describe, it, expect, vi } from "vitest";
import { setupTestDb } from "../helpers/test-db";
import { seedNote, seedSection } from "../../factories";

setupTestDb();

const HOUR = 3600;
const now = () => Math.floor(Date.now() / 1000);

describe("resolvePublishedAt", () => {
  it("should stamp now when a post is published without a chosen date", async () => {
    const { resolvePublishedAt } = await import("@/db/queries/_visibility");
    expect(resolvePublishedAt("published", undefined, null)).toBeCloseTo(now(), -1);
  });

  it("should leave a draft undated when nobody has chosen a date", async () => {
    const { resolvePublishedAt } = await import("@/db/queries/_visibility");
    expect(resolvePublishedAt("draft", undefined, null)).toBeNull();
  });

  it("should keep a date chosen on a draft so the schedule survives the save", async () => {
    // Without this, setting up a schedule would take two saves: pick the date,
    // lose it, publish, get stamped with now.
    const { resolvePublishedAt } = await import("@/db/queries/_visibility");
    expect(resolvePublishedAt("draft", 2_000_000_000, null)).toBe(2_000_000_000);
  });

  it("should keep the stored date when an edit does not mention one", async () => {
    const { resolvePublishedAt } = await import("@/db/queries/_visibility");
    expect(resolvePublishedAt("published", undefined, 1_500_000_000)).toBe(1_500_000_000);
  });

  it("should re-stamp rather than blank the date when a published post clears it", async () => {
    // NULL on a published row would drop it off the site entirely — every
    // public read compares the date and NULL matches nothing.
    const { resolvePublishedAt } = await import("@/db/queries/_visibility");
    expect(resolvePublishedAt("published", null, 1_500_000_000)).toBeCloseTo(now(), -1);
  });

  it("should let a draft that clears its date go back to undated", async () => {
    const { resolvePublishedAt } = await import("@/db/queries/_visibility");
    expect(resolvePublishedAt("draft", null, 1_500_000_000)).toBeNull();
  });
});

describe("getNextScheduledPublishAt", () => {
  it("should report nothing when only past-dated content exists", async () => {
    const { createPost, getNextScheduledPublishAt } = await import("@/db/queries");
    await createPost({
      title: "Live",
      slug: "live",
      contentMd: "x",
      status: "published",
      publishedAt: now() - HOUR,
    });
    expect(await getNextScheduledPublishAt()).toBeNull();
  });

  it("should report the soonest schedule across posts and notes, not merely the first found", async () => {
    // A note sooner than the post, seeded second: a query that stops at posts,
    // or takes the max, returns the wrong one.
    const { createPost, createNote, getNextScheduledPublishAt } = await import("@/db/queries");
    const section = await seedSection();
    await createPost({
      title: "Later",
      slug: "later",
      contentMd: "x",
      status: "published",
      publishedAt: now() + 2 * HOUR,
    });
    await createNote({
      slug: "sooner",
      sectionId: section.id,
      title: "Sooner",
      status: "published",
      publishedAt: now() + HOUR,
    });

    expect(await getNextScheduledPublishAt()).toBeCloseTo(now() + HOUR, -1);
  });

  it("should ignore a scheduled DRAFT, which no date will ever make public", async () => {
    const { createPost, getNextScheduledPublishAt } = await import("@/db/queries");
    await createPost({
      title: "Someday",
      slug: "someday",
      contentMd: "x",
      status: "draft",
      publishedAt: now() + HOUR,
    });
    expect(await getNextScheduledPublishAt()).toBeNull();
  });

  it("should stop reporting a schedule once its moment has passed, despite the cache", async () => {
    // The cached answer is the dangerous one: it is read to decide how long the
    // edge may hold a page, so serving a lapsed timestamp for a full TTL is
    // exactly the case that would keep a just-published post invisible.
    const { createPost, getNextScheduledPublishAt } = await import("@/db/queries");
    const at = now() + 60;
    await createPost({
      title: "Soon",
      slug: "soon",
      contentMd: "x",
      status: "published",
      publishedAt: at,
    });
    expect(await getNextScheduledPublishAt()).toBe(at);

    const clock = vi.spyOn(Date, "now").mockReturnValue((at + 1) * 1000);
    expect(await getNextScheduledPublishAt()).toBeNull();
    clock.mockRestore();
  });

  it("should notice a schedule added after an empty answer was cached", async () => {
    const { createPost, getNextScheduledPublishAt } = await import("@/db/queries");
    const section = await seedSection();
    await seedNote(section.id);
    expect(await getNextScheduledPublishAt()).toBeNull();

    // createPost calls revalidateContent, which drops the derived caches.
    const at = now() + HOUR;
    await createPost({
      title: "Tomorrow",
      slug: "tomorrow",
      contentMd: "x",
      status: "published",
      publishedAt: at,
    });
    expect(await getNextScheduledPublishAt()).toBe(at);
  });
});
