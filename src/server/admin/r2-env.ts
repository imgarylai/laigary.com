// R2 config lives on the worker env. This import is isolated in its own
// server-only module (like db/queries/_db.ts) so that when the upload server
// functions are tree-shaken out of the client bundle, this module — and its
// static `cloudflare:workers` import — is dropped whole. Keeping the import in
// uploads.ts alongside the client-reachable *Fn exports would pin it into the
// client build and break `vite build` (cloudflare:workers can't resolve there).
import { env } from "cloudflare:workers";

export function r2Env() {
  return env as unknown as {
    R2_S3_ENDPOINT: string;
    R2_BUCKET_NAME: string;
    R2_PUBLIC_URL: string;
    R2_ACCESS_KEY_ID: string;
    R2_SECRET_ACCESS_KEY: string;
  };
}
