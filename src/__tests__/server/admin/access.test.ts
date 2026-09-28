import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { exportJWK, generateKeyPair, SignJWT, type JWTPayload } from "jose";

const config = { issuer: "https://test.cloudflareaccess.com", audience: "admin-app" };
let pair: Awaited<ReturnType<typeof generateKeyPair>>;
let jwks: { keys: object[] };
let authorizeAdmin: typeof import("@/server/admin/access").authorizeAdmin;

beforeAll(async () => {
  pair = await generateKeyPair("RS256", { extractable: true });
  jwks = { keys: [{ ...(await exportJWK(pair.publicKey)), kid: "test-key", alg: "RS256" }] };
});
beforeEach(async () => {
  vi.resetModules();
  ({ authorizeAdmin } = await import("@/server/admin/access"));
  vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json(jwks));
});

function token(overrides: JWTPayload = {}, key = pair.privateKey) {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({
    iss: config.issuer,
    aud: config.audience,
    sub: "owner",
    iat: now,
    exp: now + 3600,
    ...overrides,
  })
    .setProtectedHeader({ alg: "RS256", kid: "test-key" })
    .sign(key);
}
function request(jwt: string, cookie = false) {
  return new Request("https://laigary.com/_serverFn/test", {
    headers: cookie
      ? { cookie: `locale=en; CF_Authorization=${jwt}` }
      : { "cf-access-jwt-assertion": jwt },
  });
}

describe("authorizeAdmin", () => {
  it("should allow SSR and reuse verification keys when Access supplies a valid assertion", async () => {
    const req = request(await token());
    await authorizeAdmin(req, config);
    await authorizeAdmin(req, config);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toBe(`${config.issuer}/cdn-cgi/access/certs`);
  });

  it("should allow RPC when the browser supplies a valid Access cookie", async () => {
    await expect(authorizeAdmin(request(await token(), true), config)).resolves.toBeUndefined();
  });

  it.each(["https://laigary.com", "https://test.workers.dev", "http://localhost:3000"])(
    "should reject anonymous callers when the request uses %s",
    async (origin) => {
      await expect(authorizeAdmin(new Request(origin), config)).rejects.toMatchObject({
        status: 401,
      });
      expect(fetch).not.toHaveBeenCalled();
    },
  );

  it.each([
    ["expired", { exp: 1 }],
    ["wrong audience", { aud: "other-app" }],
    ["wrong issuer", { iss: "https://attacker.example" }],
    ["not yet valid", { nbf: 4_000_000_000 }],
    ["missing expiration", { exp: undefined }],
    ["missing subject", { sub: undefined }],
  ] satisfies [string, JWTPayload][])(
    "should reject a signed token when it is %s",
    async (_name, claims) => {
      await expect(authorizeAdmin(request(await token(claims)), config)).rejects.toMatchObject({
        status: 401,
      });
    },
  );

  it("should reject a forgery when its signature uses another key", async () => {
    const attacker = await generateKeyPair("RS256");
    await expect(
      authorizeAdmin(request(await token({}, attacker.privateKey)), config),
    ).rejects.toMatchObject({ status: 401 });
  });

  it("should reject an invalid assertion when a valid cookie is also present", async () => {
    const req = request(await token(), true);
    req.headers.set("cf-access-jwt-assertion", "forged");
    await expect(authorizeAdmin(req, config)).rejects.toMatchObject({ status: 401 });
  });

  it.each([{ issuer: config.issuer }, { audience: config.audience }, {}])(
    "should fail closed when verification configuration is incomplete: %j",
    async (incomplete) => {
      await expect(authorizeAdmin(request(await token()), incomplete)).rejects.toMatchObject({
        status: 503,
      });
      expect(fetch).not.toHaveBeenCalled();
    },
  );

  it("should fail closed when the key endpoint is unavailable", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("Network unavailable"));
    await expect(authorizeAdmin(request(await token()), config)).rejects.toMatchObject({
      status: 401,
    });
  });
});
