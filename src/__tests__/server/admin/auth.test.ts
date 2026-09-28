import { afterEach, describe, expect, it, vi } from "vitest";
import { requireAdmin, requireAdminImpl } from "@/server/admin/auth";

const { authorizeAdmin, getRequest, env } = vi.hoisted(() => ({
  authorizeAdmin: vi.fn(),
  getRequest: vi.fn(),
  env: { ACCESS_ISSUER: "https://test.cloudflareaccess.com", ACCESS_AUD: "admin-app" },
}));
vi.mock("@/server/admin/access", () => ({ authorizeAdmin }));
vi.mock("@tanstack/react-start/server", () => ({ getRequest }));
vi.mock("cloudflare:workers", () => ({ env }));
afterEach(() => vi.unstubAllEnvs());

describe("requireAdmin", () => {
  it("should verify the current request before continuing when running a production build", async () => {
    vi.stubEnv("DEV", false);
    const request = new Request("https://laigary.com/_serverFn/test");
    getRequest.mockReturnValue(request);
    const next = vi.fn().mockResolvedValue("continued");
    await requireAdmin.options.server!({ next } as never);
    expect(authorizeAdmin).toHaveBeenCalledWith(request, {
      issuer: env.ACCESS_ISSUER,
      audience: env.ACCESS_AUD,
    });
    expect(next).toHaveBeenCalledOnce();
    expect(authorizeAdmin.mock.invocationCallOrder[0]).toBeLessThan(
      next.mock.invocationCallOrder[0],
    );
  });

  it("should not run the handler when authorization rejects", async () => {
    vi.stubEnv("DEV", false);
    authorizeAdmin.mockRejectedValueOnce(new Response(null, { status: 401 }));
    const next = vi.fn();
    await expect(requireAdmin.options.server!({ next } as never)).rejects.toMatchObject({
      status: 401,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should bypass Access when running the local development build", async () => {
    vi.stubEnv("DEV", true);
    await requireAdminImpl();
    expect(authorizeAdmin).not.toHaveBeenCalled();
    expect(getRequest).not.toHaveBeenCalled();
  });
});
