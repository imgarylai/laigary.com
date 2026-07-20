// Shared result contract for admin mutation server functions.
//
// The query layer throws typed "expected" errors (slug conflicts, not-found)
// that should surface to the user as a failed result; anything else is a real
// bug and must propagate (becomes a 500 at the RPC boundary). Mirrors the
// discriminated-union return shape the laigary.com-next Server Actions used.

import {
  PostConflictError,
  PostNotFoundError,
  TagConflictError,
  TagNotFoundError,
  SectionConflictError,
  SectionNotFoundError,
  NoteConflictError,
  NoteNotFoundError,
} from "@/db/queries";

export type ActionResult<T = undefined> =
  | (T extends undefined ? { ok: true } : { ok: true; data: T })
  | { ok: false; error: string };

export type ActionFailure = { ok: false; error: string };

// The query-layer errors that map to a user-facing failure rather than a 500.
const EXPECTED_ERRORS = [
  PostConflictError,
  PostNotFoundError,
  TagConflictError,
  TagNotFoundError,
  SectionConflictError,
  SectionNotFoundError,
  NoteConflictError,
  NoteNotFoundError,
] as const;

/**
 * Turn a caught error into `{ ok: false }` when it is an expected query error,
 * otherwise re-throw so unexpected failures are not silently swallowed.
 */
export function toFailure(err: unknown): ActionFailure {
  if (EXPECTED_ERRORS.some((ErrorClass) => err instanceof ErrorClass)) {
    return { ok: false, error: (err as Error).message };
  }
  throw err;
}
