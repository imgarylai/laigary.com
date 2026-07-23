// MCP config from the worker env. Isolated in its own server-only module
// (like db/queries/_db.ts and admin/r2-env.ts) so the static
// `cloudflare:workers` import never reaches the client bundle.
import { env } from "cloudflare:workers";

export function mcpEnv() {
  return env as unknown as {
    // Optional: when unset, the write tools are disabled entirely.
    MCP_ADMIN_TOKEN?: string;
  };
}
