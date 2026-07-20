// Internal DB plumbing shared across the queries/ modules. Not re-exported
// from index.ts — callers should use the typed query functions.

import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import { sql, type AnyColumn, type SQL } from "drizzle-orm";
import type { D1Database } from "@cloudflare/workers-types";

// TanStack Start exposes Cloudflare bindings via `cloudflare:workers`.
// The DB binding is provisioned in #9 (Alchemy IaC); until it's declared there
// the cast supplies the type. In tests, `drizzle-orm/d1` is mocked so the real
// binding is never touched.
export async function getDb() {
  return drizzle((env as unknown as { DB: D1Database }).DB);
}

export type Db = Awaited<ReturnType<typeof getDb>>;

// D1 caps bound parameters per query at 100. Chunk IN-clause inputs at 50 —
// half the limit, leaves comfortable headroom for any non-IN parameters in
// the same query and is an easier number to reason about than squeezing 90.
export const D1_PARAM_CHUNK = 50;

export function chunk<T>(arr: T[], size = D1_PARAM_CHUNK): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/** `${col} IN (?, ?, ...)` as a Drizzle SQL fragment. Caller chunks if needed. */
export function inClause(col: AnyColumn, ids: readonly unknown[]): SQL {
  return sql`${col} IN (${sql.join(
    ids.map((id) => sql`${id}`),
    sql`, `,
  )})`;
}
