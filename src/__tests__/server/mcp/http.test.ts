// @vitest-environment node
//
// HTTP layer for /mcp: body parsing, bearer wiring into the protocol, and
// the notification fast-path. The worker env is mocked per test.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { setupTestDb } from "../../db/helpers/test-db";

setupTestDb();

// Mock the worker env itself (like admin/uploads.test) so mcpEnv() runs for
// real against a populated binding.
vi.mock("cloudflare:workers", () => ({
  env: { MCP_ADMIN_TOKEN: "secret-token" },
}));

beforeEach(() => vi.clearAllMocks());

function post(body: string, headers: Record<string, string> = {}) {
  return new Request("http://test.local/mcp", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body,
  });
}

describe("handleMcpPost", () => {
  it("answers malformed JSON with a parse error", async () => {
    const { handleMcpPost } = await import("@/server/mcp/http");
    const res = await handleMcpPost(post("{nope"));
    const body = (await res.json()) as { error: { code: number } };
    expect(body.error.code).toBe(-32700);
  });

  it("acknowledges notifications with an empty 202", async () => {
    const { handleMcpPost } = await import("@/server/mcp/http");
    const res = await handleMcpPost(
      post(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" })),
    );
    expect(res.status).toBe(202);
    expect(await res.text()).toBe("");
  });

  it("exposes write tools only with the correct bearer token", async () => {
    const { handleMcpPost } = await import("@/server/mcp/http");
    const list = JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" });

    const anon = (await (await handleMcpPost(post(list))).json()) as {
      result: { tools: { name: string }[] };
    };
    expect(anon.result.tools.map((t) => t.name)).not.toContain("create_post");

    const authed = (await (
      await handleMcpPost(post(list, { authorization: "Bearer secret-token" }))
    ).json()) as { result: { tools: { name: string }[] } };
    expect(authed.result.tools.map((t) => t.name)).toContain("create_post");

    const wrong = (await (
      await handleMcpPost(post(list, { authorization: "Bearer wrong" }))
    ).json()) as { result: { tools: { name: string }[] } };
    expect(wrong.result.tools.map((t) => t.name)).not.toContain("create_post");
  });
});
