import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { PublicPost } from "@/db/queries";

// Public published-post search. Backs the ⌘K command palette (built in the
// frontend phase) — exposed as a GET server function rather than a raw
// /api/posts route, which the palette calls via RPC.
const searchSchema = z.object({
  q: z.string().optional(),
  tag: z.string().optional(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
});

export type SearchPostsInput = z.infer<typeof searchSchema>;

// Split out of the wrapper, the way every other server fn in this repo is: a
// createServerFn handler body cannot run under vitest at all, and `limit ?? 100`
// silently deciding how much of the archive the palette can reach is not
// something to leave unmeasured for that reason.
export async function searchPostsImpl(
  data: SearchPostsInput,
): Promise<{ posts: PublicPost[]; total: number }> {
  const { getPublishedPosts } = await import("@/db/queries");
  return getPublishedPosts({
    query: data.q,
    tag: data.tag,
    limit: data.limit ?? 100,
    offset: data.offset ?? 0,
  });
}

/* v8 ignore start -- RPC boundary, unreachable under vitest (see AGENTS.md). */
export const searchPostsFn = createServerFn({ method: "GET" })
  .validator((data: unknown) => searchSchema.parse(data ?? {}))
  .handler(({ data }) => searchPostsImpl(data));
/* v8 ignore stop */
