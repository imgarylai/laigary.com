import { createRemoteJWKSet, jwtVerify } from "jose";
import { readCookie } from "@/lib/http-cache";

type AccessConfig = { issuer?: string; audience?: string };
let keySet: { issuer: string; keys: ReturnType<typeof createRemoteJWKSet> } | undefined;

/** Validate the existing Access session, including RPCs outside /admin. */
export async function authorizeAdmin(request: Request, { issuer, audience }: AccessConfig) {
  // Access injects the assertion on /admin SSR. On /_serverFn, the browser
  // instead sends its signed Access application cookie; both are verified.
  const token =
    request.headers.get("cf-access-jwt-assertion") ??
    readCookie(request.headers.get("cookie"), "CF_Authorization");
  if (!token) throw new Response("Unauthorized", { status: 401 });
  if (!issuer || !audience) throw new Response("Access is not configured", { status: 503 });

  try {
    if (keySet?.issuer !== issuer) {
      keySet = {
        issuer,
        // jose caches keys and handles rotation. Never choose an issuer or
        // key URL from the untrusted JWT or incoming request.
        keys: createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`)),
      };
    }
    await jwtVerify(token, keySet.keys, {
      issuer,
      audience,
      algorithms: ["RS256"],
      requiredClaims: ["exp", "iat", "sub"],
    });
  } catch {
    // Invalid tokens and unavailable verification keys both fail closed.
    throw new Response("Unauthorized", { status: 401 });
  }
}
