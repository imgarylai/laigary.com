import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { pageChrome } from "./_shared";

// /labs read server function. There is no content here to fetch — the demo
// pages are code and the listing is the static `@/lib/labs` registry — so the
// only reason a loader exists is the site's title template, which lives in DB
// settings. Hence one shared chrome-only function rather than a per-page one.
export async function labsChromeImpl(data: { title: string }) {
  return pageChrome(data.title);
}

/* v8 ignore start -- RPC boundary, unreachable under vitest (see AGENTS.md). */
export const labsChromeFn = createServerFn({ method: "GET" })
  .validator(z.object({ title: z.string().min(1).max(120) }))
  .handler(({ data }) => labsChromeImpl(data));
/* v8 ignore stop */
