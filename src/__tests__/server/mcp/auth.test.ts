// @vitest-environment node
import { describe, it, expect } from "vitest";
import { checkAuthorization } from "@/server/mcp/auth";

describe("checkAuthorization", () => {
  it("accepts the exact bearer token", async () => {
    expect(await checkAuthorization("Bearer secret-token", "secret-token")).toBe(true);
  });

  it("rejects wrong tokens, malformed headers and missing headers", async () => {
    expect(await checkAuthorization("Bearer wrong", "secret-token")).toBe(false);
    expect(await checkAuthorization("secret-token", "secret-token")).toBe(false);
    expect(await checkAuthorization("Bearer ", "secret-token")).toBe(false);
    expect(await checkAuthorization(null, "secret-token")).toBe(false);
  });

  it("rejects everything when no token is configured (read-only mode)", async () => {
    expect(await checkAuthorization("Bearer anything", undefined)).toBe(false);
    expect(await checkAuthorization("Bearer ", "")).toBe(false);
  });
});
