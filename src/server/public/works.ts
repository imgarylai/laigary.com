import { createServerFn } from "@tanstack/react-start";
import { pageChrome, renderMd, slugInput } from "./_shared";

// Works (portfolio) read server functions. Same split as blog.ts — the
// exported `*Impl` functions hold the logic and are unit-tested against the
// better-sqlite3 harness, the createServerFn wrappers are the thin validated
// RPC boundary.

// The whole portfolio in one payload. No paging: /works is a couple of dozen
// entries at most, and `TmPager` there would hide work rather than help anyone
// find it. The limit is a runaway guard, not a page size.
export async function worksDataImpl() {
  const { getPublishedWorks } = await import("@/db/queries");
  const { works } = await getPublishedWorks({ limit: 200 });
  return { works, ...(await pageChrome("Works")) };
}

export const worksDataFn = createServerFn({ method: "GET" }).handler(worksDataImpl);

export async function workDataImpl(data: { slug: string }) {
  const { getWorkBySlug } = await import("@/db/queries");
  const { plainTextSummary, META_SUMMARY_MAX } = await import("@/lib/summary");
  const work = await getWorkBySlug(data.slug);
  if (!work) return null;
  const html = await renderMd(work.contentMd);
  return {
    work,
    html,
    // `summary` is non-null so this nearly always short-circuits; the fallback
    // covers a work whose summary was left blank but which has a write-up.
    description: work.summary || plainTextSummary(html, META_SUMMARY_MAX),
    ...(await pageChrome(work.title)),
  };
}

/* v8 ignore start -- RPC boundary, unreachable under vitest (see AGENTS.md). */
export const workDataFn = createServerFn({ method: "GET" })
  .validator(slugInput)
  .handler(({ data }) => workDataImpl(data));
/* v8 ignore stop */
