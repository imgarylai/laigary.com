// Shared result contract for admin mutation server functions.
//
// The query layer throws typed "expected" errors (slug conflicts, not-found)
// that should surface to the user as a failed result; anything else is a real
// bug and must propagate (becomes a 500 at the RPC boundary). Mirrors the
// discriminated-union return shape the laigary.com-next Server Actions used.

export type ActionResult<T = undefined> =
  | (T extends undefined ? { ok: true } : { ok: true; data: T })
  | { ok: false; error: string };

export type ActionFailure = { ok: false; error: string };

// The query-layer error names that map to a user-facing failure rather than a
// 500. Matched by `name` rather than `instanceof` so this module stays free of
// any `@/db/queries` import — importing the error classes would pull the query
// layer (and its `cloudflare:workers` D1 binding) into the client bundle, since
// the admin forms import the mutation server functions that use toFailure.
const EXPECTED_ERROR_NAMES = new Set([
  "PostConflictError",
  "PostNotFoundError",
  "TagConflictError",
  "TagNotFoundError",
  "SectionConflictError",
  "SectionNotFoundError",
  "NoteConflictError",
  "NoteNotFoundError",
  "UploadConflictError",
]);

/**
 * Turn a caught error into `{ ok: false }` when it is an expected query error,
 * otherwise re-throw so unexpected failures are not silently swallowed.
 */
export function toFailure(err: unknown): ActionFailure {
  if (err instanceof Error && EXPECTED_ERROR_NAMES.has(err.name)) {
    return { ok: false, error: err.message };
  }
  throw err;
}
