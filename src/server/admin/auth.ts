import { createMiddleware } from "@tanstack/react-start";

// Runs for both direct RPC calls and calls made by an SSR loader. Public RPCs
// and the separately authenticated MCP endpoint do not use this middleware.
export async function requireAdminImpl(): Promise<void> {
  // Only the development BUILD bypasses auth; a forged localhost Host cannot.
  if (import.meta.env.DEV) return;
  const [{ getRequest }, { env }, { authorizeAdmin }] = await Promise.all([
    import("@tanstack/react-start/server"),
    import("cloudflare:workers"),
    import("./access"),
  ]);
  await authorizeAdmin(getRequest(), {
    issuer: env.ACCESS_ISSUER,
    audience: env.ACCESS_AUD,
  });
}

export const requireAdmin = createMiddleware({ type: "function" }).server(async ({ next }) => {
  await requireAdminImpl();
  return next();
});
