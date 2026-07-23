// @vitest-environment node
//
// MCP endpoint: the stateless JSON-RPC protocol layer plus the tool registry,
// run against the real better-sqlite3 harness. Write tools are hidden from
// unauthenticated tools/list and refused at call time.
import { describe, it, expect } from "vitest";
import { setupTestDb } from "../../db/helpers/test-db";
import { seedNote, seedPost, seedSection, seedTag } from "../../factories";

setupTestDb();

async function rpc(method: string, params?: unknown, authorized = false) {
  const { handleMcpMessage } = await import("@/server/mcp/protocol");
  return handleMcpMessage({ jsonrpc: "2.0", id: 1, method, params }, authorized);
}

type RpcBody = {
  result?: { tools?: { name: string }[]; protocolVersion?: string } & Record<string, unknown>;
  error?: { code: number; message: string };
};

async function callTool(name: string, args: unknown, authorized = false) {
  const res = await rpc("tools/call", { name, arguments: args }, authorized);
  const body = res.body as {
    result: { content: [{ type: string; text: string }]; isError?: boolean };
  };
  return body.result;
}

function parseText(result: { content: [{ type: string; text: string }] }) {
  return JSON.parse(result.content[0].text);
}

describe("protocol layer", () => {
  it("answers initialize with a supported protocol version", async () => {
    const res = await rpc("initialize", { protocolVersion: "2025-03-26" });
    expect((res.body as RpcBody).result?.protocolVersion).toBe("2025-03-26");

    const unknown = await rpc("initialize", { protocolVersion: "1999-01-01" });
    expect((unknown.body as RpcBody).result?.protocolVersion).toBe("2025-06-18");
  });

  it("acknowledges notifications with 202 and no body", async () => {
    const { handleMcpMessage } = await import("@/server/mcp/protocol");
    const res = await handleMcpMessage(
      { jsonrpc: "2.0", method: "notifications/initialized" },
      false,
    );
    expect(res.status).toBe(202);
    expect(res.body).toBeUndefined();
  });

  it("rejects unknown methods and malformed messages", async () => {
    expect(((await rpc("nope/nope")).body as RpcBody).error?.code).toBe(-32601);
    const { handleMcpMessage } = await import("@/server/mcp/protocol");
    expect(((await handleMcpMessage([], false)).body as RpcBody).error?.code).toBe(-32600);
    expect(((await handleMcpMessage({ id: 1 }, false)).body as RpcBody).error?.code).toBe(-32600);
  });

  it("hides write tools from unauthenticated tools/list", async () => {
    const anon = ((await rpc("tools/list")).body as RpcBody).result!.tools!.map((t) => t.name);
    expect(anon).toContain("search_posts");
    expect(anon).not.toContain("create_post");

    const authed = ((await rpc("tools/list", {}, true)).body as RpcBody).result!.tools!.map(
      (t) => t.name,
    );
    expect(authed).toContain("create_post");
    expect(authed).toContain("update_interview_note");
  });
});

describe("read tools", () => {
  it("search_posts returns published posts with tag names", async () => {
    const tag = await seedTag({ name: "Life", slug: "life" });
    await seedPost({ title: "Gas prices", slug: "gas", tagIds: [tag.id] });
    await seedPost({ title: "WIP", slug: "wip", status: "draft" });

    const result = parseText(await callTool("search_posts", { query: "Gas" }));
    expect(result.total).toBe(1);
    expect(result.posts[0]).toMatchObject({ slug: "gas", tags: ["Life"] });
  });

  it("get_post returns the markdown and flags missing slugs as errors", async () => {
    await seedPost({ title: "Hello", slug: "hello", contentMd: "# Hi" });
    const found = parseText(await callTool("get_post", { slug: "hello" }));
    expect(found.contentMd).toBe("# Hi");

    const missing = await callTool("get_post", { slug: "nope" });
    expect(missing.isError).toBe(true);
  });

  it("get_interview_note fetches published notes", async () => {
    const section = await seedSection({ slug: "coding" });
    await seedNote(section.id, { slug: "gas", title: "Gas Station" });
    const note = parseText(
      await callTool("get_interview_note", { section: "coding", slug: "gas" }),
    );
    expect(note.title).toBe("Gas Station");
  });

  it("rejects invalid arguments as a tool error, not a crash", async () => {
    const result = await callTool("get_post", {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Invalid arguments");
  });
});

describe("write tools", () => {
  it("refuses write calls without authorization", async () => {
    const result = await callTool("create_post", { title: "X", slug: "x", contentMd: "b" }, false);
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("requires authorization");
  });

  it("create_post creates the post and resolves tag names, creating missing ones", async () => {
    await seedTag({ name: "Life", slug: "life" });
    const created = parseText(
      await callTool(
        "create_post",
        {
          title: "Hello",
          slug: "hello",
          contentMd: "body",
          status: "published",
          tagNames: ["Life", "New Tag"],
        },
        true,
      ),
    );
    expect(created.url).toBe("/posts/hello");

    const { getPostBySlug, getAllTags } = await import("@/db/queries");
    const post = await getPostBySlug("hello");
    expect(post?.tags.map((t) => t.name).sort()).toEqual(["Life", "New Tag"]);
    // "Life" was reused, not duplicated.
    expect((await getAllTags()).filter((t) => t.name === "Life")).toHaveLength(1);
  });

  it("update_post updates by slug and errors on unknown slugs", async () => {
    await seedPost({ title: "Old", slug: "hello" });
    parseText(await callTool("update_post", { slug: "hello", title: "New" }, true));
    const { getPostBySlug } = await import("@/db/queries");
    expect((await getPostBySlug("hello"))?.title).toBe("New");

    const missing = await callTool("update_post", { slug: "nope", title: "X" }, true);
    expect(missing.isError).toBe(true);
  });

  it("create_interview_note resolves the section by slug", async () => {
    await seedSection({ slug: "coding" });
    const created = parseText(
      await callTool(
        "create_interview_note",
        { section: "coding", title: "Gas", slug: "gas", contentMd: "b", status: "published" },
        true,
      ),
    );
    expect(created.url).toBe("/interview/coding/gas");

    const badSection = await callTool(
      "create_interview_note",
      { section: "nope", title: "X", slug: "x", contentMd: "b" },
      true,
    );
    expect(badSection.isError).toBe(true);
  });

  it("update_interview_note updates by section + slug", async () => {
    const section = await seedSection({ slug: "coding" });
    await seedNote(section.id, { slug: "gas", title: "Old" });
    parseText(
      await callTool(
        "update_interview_note",
        { section: "coding", slug: "gas", title: "New" },
        true,
      ),
    );
    const { getInterviewNote } = await import("@/db/queries");
    expect((await getInterviewNote("coding", "gas"))?.title).toBe("New");
  });

  it("surfaces domain conflicts as tool errors", async () => {
    await seedPost({ slug: "taken" });
    const result = await callTool(
      "create_post",
      { title: "X", slug: "taken", contentMd: "b" },
      true,
    );
    expect(result.isError).toBe(true);
  });
});

describe("remaining protocol + read tools", () => {
  it("answers ping and rejects tools/call without a name", async () => {
    expect(((await rpc("ping")).body as RpcBody).result).toEqual({});
    const noName = await rpc("tools/call", { arguments: {} });
    expect((noName.body as RpcBody).error?.code).toBe(-32602);
  });

  it("runTool rejects unknown tool names", async () => {
    const result = await callTool("no_such_tool", {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Unknown tool");
  });

  it("get_site_info returns the settings subset", async () => {
    const { updateSiteSettings } = await import("@/db/queries");
    await updateSiteSettings({ site_name: "Unconstrained", author_github: "imgarylai" });
    const info = parseText(await callTool("get_site_info", {}));
    expect(info.siteName).toBe("Unconstrained");
    expect(info.github).toBe("imgarylai");
  });

  it("list_tags returns usage counts", async () => {
    const tag = await seedTag({ name: "Life", slug: "life" });
    await seedPost({ tagIds: [tag.id] });
    const tags = parseText(await callTool("list_tags", {}));
    expect(tags).toEqual([{ name: "Life", slug: "life", count: 1 }]);
  });

  it("list_interview_sections returns note counts", async () => {
    const section = await seedSection({ slug: "coding", label: "Coding" });
    await seedNote(section.id);
    const sections = parseText(await callTool("list_interview_sections", {}));
    expect(sections).toEqual([expect.objectContaining({ slug: "coding", noteCount: 1 })]);
  });

  it("search_interview_notes matches published titles", async () => {
    const section = await seedSection({ slug: "coding" });
    await seedNote(section.id, { title: "Gas Station", slug: "gas" });
    const hits = parseText(await callTool("search_interview_notes", { query: "Gas" }));
    expect(hits.map((h: { slug: string }) => h.slug)).toEqual(["gas"]);
  });

  it("search_posts honours the tag filter and limit", async () => {
    const tag = await seedTag({ name: "Life", slug: "life" });
    await seedPost({ slug: "tagged", tagIds: [tag.id] });
    await seedPost({ slug: "untagged" });
    const result = parseText(await callTool("search_posts", { tag: "life", limit: 5 }));
    expect(result.posts.map((p: { slug: string }) => p.slug)).toEqual(["tagged"]);
  });
});
