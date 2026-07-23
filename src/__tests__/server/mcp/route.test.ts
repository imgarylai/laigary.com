// @vitest-environment node
//
// The /mcp route glue: method gating and the dynamic-import POST wiring.
import { describe, it, expect, vi } from "vitest";
import { setupTestDb } from "../../db/helpers/test-db";
import { Route } from "@/routes/mcp";

setupTestDb();

vi.mock("cloudflare:workers", () => ({ env: {} }));

type Handler = (ctx: { request: Request }) => Response | Promise<Response>;

function handlers() {
  return (Route.options as unknown as { server: { handlers: Record<string, Handler> } }).server
    .handlers;
}

describe("/mcp route", () => {
  it("answers GET and DELETE with 405 Allow: POST", async () => {
    for (const method of ["GET", "DELETE"] as const) {
      const res = await handlers()[method]({
        request: new Request("http://test.local/mcp", { method }),
      });
      expect(res.status).toBe(405);
      expect(res.headers.get("Allow")).toBe("POST");
    }
  });

  it("routes POST bodies through the MCP handler", async () => {
    const res = await handlers().POST({
      request: new Request("http://test.local/mcp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "ping" }),
      }),
    });
    const body = (await res.json()) as { result: unknown };
    expect(res.status).toBe(200);
    expect(body.result).toEqual({});
  });
});
