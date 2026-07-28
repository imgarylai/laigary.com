// Per-file test setup: the console guard, plus the jsdom shims ProseMirror
// needs.
import { installConsoleGuard } from "./helpers/console-guard";

// Turns every console.error / console.warn into a test failure. Vitest 4 hides
// console output from passing tests, so without this the suite can be loud and
// green at the same time — see the file for what that was hiding.
installConsoleGuard();

// jsdom shims needed by ProseMirror, applied to every test file.
//
// jsdom implements no layout, so `Range.getClientRects` / `getBoundingClientRect`
// are missing entirely. ProseMirror calls them from `coordsAtPos` whenever a
// transaction asks to scroll the selection into view — and Tiptap's `focus()`
// command defers exactly that into a `requestAnimationFrame`. The throw
// therefore lands *after* the test that caused it has finished, where Vitest
// reports it as an unhandled error and fails the run even though every test
// passed. It also surfaces only under some timings, which is how it reached CI
// green-locally / red-there.
//
// Returning empty geometry is the honest answer for a layout-free DOM: the call
// succeeds and ProseMirror scrolls nowhere, which is what we want in tests.
if (typeof Range !== "undefined") {
  Range.prototype.getClientRects ??= () => {
    const list: DOMRect[] & { item: (i: number) => DOMRect | null } = Object.assign([], {
      item: () => null,
    });
    return list as unknown as DOMRectList;
  };
  Range.prototype.getBoundingClientRect ??= () => new DOMRect();
}

// Same class of gap, same answer: jsdom implements no scrolling either, so
// `scrollIntoView` is absent rather than a no-op. The `/` menu keeps its
// highlighted item in view that way now the list scrolls (#196), and any
// component that scrolls a focused element into view will hit this. Shimming it
// here beats guarding every call site against a browser API that always exists
// in the browser.
if (typeof Element !== "undefined") {
  Element.prototype.scrollIntoView ??= () => {};
}
