// Bearer-token check for the MCP write tools. The token lives in the worker
// env (wrangler secret / alchemy.secret). Comparison is over SHA-256 digests
// so string length/content never short-circuits the comparison.

export async function checkAuthorization(
  header: string | null,
  expectedToken: string | undefined,
): Promise<boolean> {
  if (!expectedToken || !header?.startsWith("Bearer ")) return false;
  const presented = header.slice("Bearer ".length).trim();
  if (!presented) return false;

  const enc = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(presented)),
    crypto.subtle.digest("SHA-256", enc.encode(expectedToken)),
  ]);
  const va = new Uint8Array(a);
  const vb = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < va.length; i++) diff |= va[i] ^ vb[i];
  return diff === 0;
}
