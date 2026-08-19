// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { useSlugAutofill } from "@/hooks/use-slug-autofill";

afterEach(cleanup);

// A stand-in for the slug form field: the hook only ever reads and writes it
// through the two callbacks, so a plain box is enough.
function field(initial = "") {
  const box = { value: initial };
  return {
    box,
    getSlug: () => box.value,
    setSlug: (v: string) => {
      box.value = v;
    },
  };
}

describe("useSlugAutofill", () => {
  it("should keep the slug in step with a title typed one character at a time", () => {
    const { box, getSlug, setSlug } = field();
    const { result } = renderHook(() => useSlugAutofill({ enabled: true, getSlug, setSlug }));

    // The regression: the slug used to freeze after two keystrokes.
    for (const title of ["t", "te", "ten", "ten ", "ten y", "ten ye", "ten yea"]) {
      act(() => result.current.fromTitle(title));
    }

    expect(box.value).toBe("ten-yea");
  });

  it("should keep transliterating as a Chinese title grows", () => {
    const { box, getSlug, setSlug } = field();
    const { result } = renderHook(() => useSlugAutofill({ enabled: true, getSlug, setSlug }));

    // An IME commits one character at a time, which is how the bug surfaced:
    // the slug stopped at "shih", the Wade-Giles for the very first character.
    for (const title of ["十", "十年", "十年部", "十年部落", "十年部落格"]) {
      act(() => result.current.fromTitle(title));
    }

    expect(box.value).toBe("shih-nien-pu-lo-ko");
  });

  it("should stand down once the author edits the slug by hand", () => {
    const { box, getSlug, setSlug } = field();
    const { result } = renderHook(() => useSlugAutofill({ enabled: true, getSlug, setSlug }));

    act(() => result.current.fromTitle("ten years"));
    expect(box.value).toBe("ten-years");

    box.value = "hand-picked";
    act(() => result.current.fromTitle("ten years of blogging"));

    expect(box.value).toBe("hand-picked");
  });

  it("should stay stood down even if the title later matches the abandoned slug", () => {
    const { box, getSlug, setSlug } = field();
    const { result } = renderHook(() => useSlugAutofill({ enabled: true, getSlug, setSlug }));

    act(() => result.current.fromTitle("ten"));
    box.value = "hand-picked";
    act(() => result.current.fromTitle("ten years"));
    // Typing on does not sneak the autofill back in.
    act(() => result.current.fromTitle("ten years more"));

    expect(box.value).toBe("hand-picked");
  });

  it("should leave a slug that was filled in before the title alone", () => {
    const { box, getSlug, setSlug } = field("written-first");
    const { result } = renderHook(() => useSlugAutofill({ enabled: true, getSlug, setSlug }));

    act(() => result.current.fromTitle("A title typed afterwards"));

    expect(box.value).toBe("written-first");
  });

  it("should do nothing when disabled, which is how edit mode locks the slug", () => {
    const { box, getSlug, setSlug } = field("published-url");
    const { result } = renderHook(() => useSlugAutofill({ enabled: false, getSlug, setSlug }));

    act(() => result.current.fromTitle("A retitled post"));

    expect(box.value).toBe("published-url");
  });

  it("should stop for good once the record has been saved", () => {
    const { box, getSlug, setSlug } = field();
    const { result } = renderHook(() => useSlugAutofill({ enabled: true, getSlug, setSlug }));

    act(() => result.current.fromTitle("ten years"));
    act(() => result.current.stop());
    act(() => result.current.fromTitle("ten years of blogging"));

    expect(box.value).toBe("ten-years");
  });

  it("should start over after reset, for a form reused for the next record", () => {
    const { box, getSlug, setSlug } = field();
    const { result } = renderHook(() => useSlugAutofill({ enabled: true, getSlug, setSlug }));

    act(() => result.current.fromTitle("first tag"));
    act(() => result.current.stop());

    // What a dialog does between records: blank the field, then the hook.
    box.value = "";
    act(() => result.current.reset());
    act(() => result.current.fromTitle("second tag"));

    expect(box.value).toBe("second-tag");
  });

  it("should read the current callbacks even when handed a stale render's props", () => {
    // The title input can hold on to `fromTitle` across renders the form never
    // re-rendered for. The handler still has to see this render's `enabled`.
    const { box, getSlug, setSlug } = field();
    const { result, rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) => useSlugAutofill({ enabled, getSlug, setSlug }),
      { initialProps: { enabled: true } },
    );

    const stale = result.current.fromTitle;
    rerender({ enabled: false });
    act(() => stale("a new title"));

    expect(box.value).toBe("");
  });
});
