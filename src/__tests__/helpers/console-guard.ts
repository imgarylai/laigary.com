// Fails any test that writes to console.error / console.warn.
//
// Vitest 4 only prints a test's console output when that test FAILS, so a
// passing suite is not evidence of a quiet one: this repo was emitting 46
// warnings a run — an empty `href` on every route render, Base UI asking for
// `nativeButton={false}` on four link-rendered buttons — and `pnpm test` showed
// none of them. Warnings that nothing surfaces are warnings nobody fixes, and
// React puts real defects in this channel (bad DOM nesting, `act()` gaps, state
// updates after unmount). Promoting them to failures is what keeps the count at
// zero rather than at "whatever it drifted to".
//
// No product code calls console.* — the only writers are React, jsdom and the
// component libraries — so there is nothing legitimate to filter out by default.
// A test that MEANS to provoke a warning declares it with `allowConsole`.
import { afterEach, beforeEach } from "vitest";

let captured: string[] = [];
let allowed: RegExp[] = [];

/**
 * Permit console output matching `pattern` for the remainder of the current
 * test. Use it when the warning IS the behaviour under test; anywhere else,
 * fix the warning instead of allowing it.
 */
export function allowConsole(pattern: RegExp): void {
  allowed.push(pattern);
}

/** Resolve React's `%s` placeholders so the failure quotes the real message. */
function format(args: unknown[]): string {
  const [first, ...rest] = args;
  if (typeof first !== "string") return args.map(String).join(" ");
  let i = 0;
  const filled = first.replace(/%[sdifoOc]/g, () => (i < rest.length ? String(rest[i++]) : "%s"));
  return [filled, ...rest.slice(i).map(String)].join(" ").trim();
}

export function installConsoleGuard(): void {
  for (const level of ["error", "warn"] as const) {
    const original = console[level].bind(console);
    // Plain assignment, not `vi.spyOn`: `restoreMocks` is on globally and would
    // strip a spy after the first test, leaving the rest of the file unguarded.
    console[level] = (...args: unknown[]) => {
      captured.push(`console.${level}: ${format(args)}`);
      original(...args);
    };
  }

  beforeEach(() => {
    captured = [];
    allowed = [];
  });

  afterEach(() => {
    // Read and clear before throwing, so one noisy test cannot fail the next.
    const unexpected = captured.filter((line) => !allowed.some((p) => p.test(line)));
    captured = [];
    allowed = [];
    if (unexpected.length > 0) {
      throw new Error(
        `Unexpected console output (${unexpected.length}). Fix the cause, or call ` +
          `allowConsole(/…/) if the warning is what the test asserts:\n` +
          unexpected.map((line) => `  • ${line}`).join("\n"),
      );
    }
  });
}
