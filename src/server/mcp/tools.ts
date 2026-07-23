// MCP tool registry. Read tools are public; write tools require the bearer
// token (they're hidden from unauthenticated tools/list AND refused at call
// time). All DB access goes through the existing query layer via dynamic
// import, mirroring the server-fn impls.

import { z } from "zod";

type ToolResult = { content: [{ type: "text"; text: string }]; isError?: boolean };

type Tool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  requiresAuth: boolean;
  validate: (args: unknown) => unknown;
  run: (args: never) => Promise<unknown>;
};

function ok(payload: unknown): ToolResult {
  return { content: [{ type: "text", text: JSON.stringify(payload, null, 2) }] };
}

function fail(message: string): ToolResult {
  return { content: [{ type: "text", text: message }], isError: true };
}

// Resolve tag names to ids, creating any that don't exist yet (matched
// case-insensitively by name so "greedy" and "Greedy" don't fork).
async function resolveTagNames(names: string[]): Promise<string[]> {
  const { getAllTags, createTag } = await import("@/db/queries");
  const { slugify } = await import("@/lib/slug");
  const existing = await getAllTags();
  const byName = new Map(existing.map((t) => [t.name.toLowerCase(), t.id]));
  const ids: string[] = [];
  for (const name of names) {
    const found = byName.get(name.toLowerCase());
    if (found) {
      ids.push(found);
    } else {
      const created = await createTag({ name, slug: slugify(name) });
      byName.set(name.toLowerCase(), created.id);
      ids.push(created.id);
    }
  }
  return ids;
}

const statusSchema = z.enum(["draft", "published"]);

const TOOLS: Tool[] = [
  // ── Read (public) ────────────────────────────────────────────────────
  {
    name: "get_site_info",
    description: "Site name, description, url and the author's social links.",
    inputSchema: { type: "object", properties: {} },
    requiresAuth: false,
    validate: (args) =>
      z
        .object({})
        .loose()
        .parse(args ?? {}),
    run: async () => {
      const { getSiteSettings } = await import("@/db/queries");
      const s = await getSiteSettings();
      return {
        siteName: s.site_name ?? "",
        description: s.site_description ?? "",
        url: s.site_url ?? "",
        author: s.author_name ?? "",
        github: s.author_github ?? "",
        twitter: s.author_twitter ?? "",
      };
    },
  },
  {
    name: "search_posts",
    description: "Search published blog posts by title, optionally filtered by tag slug.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Title substring to match" },
        tag: { type: "string", description: "Tag slug filter" },
        limit: { type: "number", description: "Max results (default 20)" },
      },
    },
    requiresAuth: false,
    validate: (args) =>
      z
        .object({
          query: z.string().optional(),
          tag: z.string().optional(),
          limit: z.number().int().min(1).max(100).optional(),
        })
        .parse(args ?? {}),
    run: async (args: { query?: string; tag?: string; limit?: number }) => {
      const { getPublishedPosts } = await import("@/db/queries");
      const { posts, total } = await getPublishedPosts({
        query: args.query,
        tag: args.tag,
        limit: args.limit ?? 20,
      });
      return {
        total,
        posts: posts.map((p) => ({
          slug: p.slug,
          title: p.title,
          date: p.date,
          excerpt: p.excerpt,
          tags: p.tags.map((t) => t.name),
        })),
      };
    },
  },
  {
    name: "get_post",
    description: "Fetch one published post (markdown content included) by slug.",
    inputSchema: {
      type: "object",
      properties: { slug: { type: "string" } },
      required: ["slug"],
    },
    requiresAuth: false,
    validate: (args) => z.object({ slug: z.string().min(1) }).parse(args),
    run: async (args: { slug: string }) => {
      const { getPostBySlug } = await import("@/db/queries");
      const post = await getPostBySlug(args.slug);
      if (!post) return fail(`No published post with slug "${args.slug}"`);
      return {
        slug: post.slug,
        title: post.title,
        date: post.date,
        excerpt: post.excerpt,
        tags: post.tags.map((t) => t.name),
        contentMd: post.contentMd,
      };
    },
  },
  {
    name: "list_tags",
    description: "All tags in use on published posts, with usage counts.",
    inputSchema: { type: "object", properties: {} },
    requiresAuth: false,
    validate: (args) =>
      z
        .object({})
        .loose()
        .parse(args ?? {}),
    run: async () => {
      const { getTagsWithCounts } = await import("@/db/queries");
      return getTagsWithCounts();
    },
  },
  {
    name: "list_interview_sections",
    description: "Interview note sections with their published note counts.",
    inputSchema: { type: "object", properties: {} },
    requiresAuth: false,
    validate: (args) =>
      z
        .object({})
        .loose()
        .parse(args ?? {}),
    run: async () => {
      const { getInterviewSections, getInterviewNoteCountsBySection } =
        await import("@/db/queries");
      const [sections, counts] = await Promise.all([
        getInterviewSections(),
        getInterviewNoteCountsBySection(),
      ]);
      return sections.map((s) => ({
        slug: s.slug,
        label: s.label,
        blurb: s.blurb,
        noteCount: counts.get(s.id) ?? 0,
      }));
    },
  },
  {
    name: "search_interview_notes",
    description: "Search published interview notes by title across all sections.",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string" } },
      required: ["query"],
    },
    requiresAuth: false,
    validate: (args) => z.object({ query: z.string().min(1) }).parse(args),
    run: async (args: { query: string }) => {
      const { searchPublishedInterviewNotes } = await import("@/db/queries");
      return searchPublishedInterviewNotes(args.query, 20);
    },
  },
  {
    name: "get_interview_note",
    description: "Fetch one published interview note (markdown included) by section and slug.",
    inputSchema: {
      type: "object",
      properties: { section: { type: "string" }, slug: { type: "string" } },
      required: ["section", "slug"],
    },
    requiresAuth: false,
    validate: (args) =>
      z.object({ section: z.string().min(1), slug: z.string().min(1) }).parse(args),
    run: async (args: { section: string; slug: string }) => {
      const { getInterviewNote } = await import("@/db/queries");
      const note = await getInterviewNote(args.section, args.slug);
      if (!note) return fail(`No published note "${args.slug}" in section "${args.section}"`);
      return {
        slug: note.slug,
        title: note.title,
        status: note.status,
        tags: note.tags.map((t) => t.name),
        contentMd: note.contentMd,
      };
    },
  },

  // ── Write (bearer token required) ────────────────────────────────────
  {
    name: "create_post",
    description:
      "Create a blog post. Defaults to draft; pass status 'published' to go live. " +
      "Tags are matched by name (created if missing).",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        slug: { type: "string", description: "Lowercase letters, numbers, hyphens" },
        contentMd: { type: "string", description: "Markdown body" },
        excerpt: { type: "string" },
        status: { type: "string", enum: ["draft", "published"] },
        tagNames: { type: "array", items: { type: "string" } },
      },
      required: ["title", "slug", "contentMd"],
    },
    requiresAuth: true,
    validate: (args) =>
      z
        .object({
          title: z.string().min(1),
          slug: z
            .string()
            .min(1)
            .regex(/^[a-z0-9-]+$/),
          contentMd: z.string().min(1),
          excerpt: z.string().optional(),
          status: statusSchema.optional(),
          tagNames: z.array(z.string().min(1)).optional(),
        })
        .parse(args),
    run: async (args: {
      title: string;
      slug: string;
      contentMd: string;
      excerpt?: string;
      status?: "draft" | "published";
      tagNames?: string[];
    }) => {
      const { createPost } = await import("@/db/queries");
      const tagIds = args.tagNames ? await resolveTagNames(args.tagNames) : undefined;
      const { id, slug } = await createPost({
        title: args.title,
        slug: args.slug,
        contentMd: args.contentMd,
        excerpt: args.excerpt,
        status: args.status,
        tagIds,
      });
      return { id, slug, url: `/posts/${slug}` };
    },
  },
  {
    name: "update_post",
    description: "Update an existing post (any status) by slug. Only provided fields change.",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "Slug of the post to update" },
        title: { type: "string" },
        contentMd: { type: "string" },
        excerpt: { type: "string" },
        status: { type: "string", enum: ["draft", "published"] },
        tagNames: { type: "array", items: { type: "string" } },
      },
      required: ["slug"],
    },
    requiresAuth: true,
    validate: (args) =>
      z
        .object({
          slug: z.string().min(1),
          title: z.string().min(1).optional(),
          contentMd: z.string().min(1).optional(),
          excerpt: z.string().optional(),
          status: statusSchema.optional(),
          tagNames: z.array(z.string().min(1)).optional(),
        })
        .parse(args),
    run: async (args: {
      slug: string;
      title?: string;
      contentMd?: string;
      excerpt?: string;
      status?: "draft" | "published";
      tagNames?: string[];
    }) => {
      const { getAllAdminPosts, updatePost } = await import("@/db/queries");
      const post = (await getAllAdminPosts()).find((p) => p.slug === args.slug);
      if (!post) return fail(`No post with slug "${args.slug}"`);
      const tagIds = args.tagNames ? await resolveTagNames(args.tagNames) : undefined;
      await updatePost(post.id, {
        title: args.title,
        contentMd: args.contentMd,
        excerpt: args.excerpt,
        status: args.status,
        tagIds,
      });
      return { slug: args.slug, url: `/posts/${args.slug}` };
    },
  },
  {
    name: "create_interview_note",
    description:
      "Create an interview note in a section (by section slug). Defaults to draft. " +
      "Tags are matched by name (created if missing).",
    inputSchema: {
      type: "object",
      properties: {
        section: { type: "string", description: "Section slug, e.g. 'coding'" },
        title: { type: "string" },
        slug: { type: "string" },
        contentMd: { type: "string" },
        status: { type: "string", enum: ["draft", "published"] },
        tagNames: { type: "array", items: { type: "string" } },
      },
      required: ["section", "title", "slug", "contentMd"],
    },
    requiresAuth: true,
    validate: (args) =>
      z
        .object({
          section: z.string().min(1),
          title: z.string().min(1),
          slug: z
            .string()
            .min(1)
            .regex(/^[a-z0-9-]+$/),
          contentMd: z.string().min(1),
          status: statusSchema.optional(),
          tagNames: z.array(z.string().min(1)).optional(),
        })
        .parse(args),
    run: async (args: {
      section: string;
      title: string;
      slug: string;
      contentMd: string;
      status?: "draft" | "published";
      tagNames?: string[];
    }) => {
      const { getInterviewSectionBySlug, createNote } = await import("@/db/queries");
      const section = await getInterviewSectionBySlug(args.section);
      if (!section) return fail(`No interview section "${args.section}"`);
      const tagIds = args.tagNames ? await resolveTagNames(args.tagNames) : undefined;
      const { id, slug } = await createNote({
        slug: args.slug,
        sectionId: section.id,
        title: args.title,
        contentMd: args.contentMd,
        status: args.status,
        tagIds,
      });
      return { id, slug, url: `/interview/${args.section}/${slug}` };
    },
  },
  {
    name: "update_interview_note",
    description:
      "Update an interview note (any status) by section + slug. Only provided fields change.",
    inputSchema: {
      type: "object",
      properties: {
        section: { type: "string" },
        slug: { type: "string" },
        title: { type: "string" },
        contentMd: { type: "string" },
        status: { type: "string", enum: ["draft", "published"] },
        tagNames: { type: "array", items: { type: "string" } },
      },
      required: ["section", "slug"],
    },
    requiresAuth: true,
    validate: (args) =>
      z
        .object({
          section: z.string().min(1),
          slug: z.string().min(1),
          title: z.string().min(1).optional(),
          contentMd: z.string().min(1).optional(),
          status: statusSchema.optional(),
          tagNames: z.array(z.string().min(1)).optional(),
        })
        .parse(args),
    run: async (args: {
      section: string;
      slug: string;
      title?: string;
      contentMd?: string;
      status?: "draft" | "published";
      tagNames?: string[];
    }) => {
      const { getAllAdminInterviewNotes, updateNote } = await import("@/db/queries");
      const note = (await getAllAdminInterviewNotes()).find(
        (n) => n.sectionSlug === args.section && n.slug === args.slug,
      );
      if (!note) return fail(`No note "${args.slug}" in section "${args.section}"`);
      const tagIds = args.tagNames ? await resolveTagNames(args.tagNames) : undefined;
      await updateNote(note.id, {
        title: args.title,
        contentMd: args.contentMd,
        status: args.status,
        tagIds,
      });
      return { slug: args.slug, url: `/interview/${args.section}/${args.slug}` };
    },
  },
];

export function getTools(authorized: boolean): Tool[] {
  return authorized ? TOOLS : TOOLS.filter((t) => !t.requiresAuth);
}

// Execute a tool call. Domain failures come back as isError results (the LLM
// should see them); only transport-level problems throw.
export async function runTool(
  name: string,
  args: unknown,
  authorized: boolean,
): Promise<ToolResult> {
  const tool = TOOLS.find((t) => t.name === name);
  if (!tool) return fail(`Unknown tool: ${name}`);
  if (tool.requiresAuth && !authorized) {
    return fail(`Tool "${name}" requires authorization (bearer token)`);
  }

  let parsed: unknown;
  try {
    parsed = tool.validate(args);
  } catch (err) {
    return fail(`Invalid arguments: ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const outcome = await tool.run(parsed as never);
    // Tools may return a ready-made failure result (e.g. not-found).
    if (
      typeof outcome === "object" &&
      outcome !== null &&
      "isError" in outcome &&
      (outcome as ToolResult).isError
    ) {
      return outcome as ToolResult;
    }
    return ok(outcome);
  } catch (err) {
    return fail(err instanceof Error ? err.message : String(err));
  }
}
