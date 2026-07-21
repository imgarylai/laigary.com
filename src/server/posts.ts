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

export const searchPostsFn = createServerFn({ method: "GET" })
  .validator((data: unknown) => searchSchema.parse(data ?? {}))
  .handler(async ({ data }): Promise<{ posts: PublicPost[]; total: number }> => {
    const { getPublishedPosts } = await import("@/db/queries");
    return getPublishedPosts({
      query: data.q,
      tag: data.tag,
      limit: data.limit ?? 100,
      offset: data.offset ?? 0,
    });
  });
