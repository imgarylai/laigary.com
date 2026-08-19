// @vitest-environment happy-dom
//
// The code block card's language picker (#198). It was a plain Select — open it
// and scan. Typing `py` should get you Python, the way the tags combobox
// already works, because the fence input rule deliberately stopped capturing
// the language in #172, which makes this the main way one gets set.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup, within } from "@testing-library/react";
import {
  AUTO,
  CodeLanguagePicker,
  labelFor,
  languageOptions,
} from "@/components/admin/editor/CodeLanguagePicker";

vi.mock("@/i18n/I18nProvider", () => ({
  useI18n: () => ({ t: (k: string) => k, locale: "en" }),
}));

// cmdk observes its list element for size changes; jsdom has no ResizeObserver,
// and without it the popup never renders.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal("ResizeObserver", ResizeObserverStub);

const LABELS = { auto: "Auto-detect", plain: "Plain text" };

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

function renderPicker(value = AUTO) {
  const onChange = vi.fn();
  render(<CodeLanguagePicker value={value} onChange={onChange} />);
  return { onChange };
}

const open = () => fireEvent.click(screen.getByRole("button", { name: "editor.codeLanguage" }));
const search = () => screen.getByPlaceholderText("editor.codeLanguageSearch");

describe("labelFor", () => {
  // It is total on purpose: every value has a label, so the picker needs no
  // "not found" fallback anywhere downstream.
  it("should name an untagged fence", () => {
    expect(labelFor(AUTO, LABELS)).toBe("Auto-detect");
  });

  it("should name the no-highlighting opt-out", () => {
    expect(labelFor("text", LABELS)).toBe("Plain text");
  });

  it("should name a grammar the list carries", () => {
    expect(labelFor("javascript", LABELS)).toBe("JavaScript");
  });

  it("should fall back to the fence tag for a language it does not carry", () => {
    expect(labelFor("rust", LABELS)).toBe("rust");
  });
});

describe("languageOptions", () => {
  it("should offer auto-detect ahead of the grammars", () => {
    // An untagged fence is the common case, and it is not the same as `text`.
    expect(languageOptions(AUTO, LABELS)[0]).toEqual({ value: AUTO, label: "Auto-detect" });
  });

  it("should keep plain text as its own option", () => {
    // `text` asks for no highlighting; auto asks for detection. Collapsing them
    // would lose the opt-out.
    const values = languageOptions(AUTO, LABELS).map((o) => o.value);

    expect(values).toContain("text");
    expect(values).toContain(AUTO);
  });

  it("should surface a language the list does not carry", () => {
    // A hand-typed ```rust fence predates this list; rewriting it to something
    // else would silently change the author's content.
    const options = languageOptions("rust", LABELS);

    expect(options.find((o) => o.value === "rust")).toEqual({ value: "rust", label: "rust" });
  });

  it("should not duplicate a language it already carries", () => {
    const values = languageOptions("python", LABELS).map((o) => o.value);

    expect(values.filter((v) => v === "python")).toHaveLength(1);
  });
});

describe("CodeLanguagePicker", () => {
  it("should show the current language on the trigger", () => {
    renderPicker("python");

    expect(screen.getByRole("button", { name: "editor.codeLanguage" }).textContent).toContain(
      "Python",
    );
  });

  it("should name an untagged fence as auto-detect", () => {
    renderPicker(AUTO);

    expect(screen.getByRole("button", { name: "editor.codeLanguage" }).textContent).toContain(
      "editor.codeLanguageAuto",
    );
  });

  it("should narrow to Python when `py` is typed", async () => {
    // The headline of the request.
    renderPicker();
    open();
    await screen.findByPlaceholderText("editor.codeLanguageSearch");

    fireEvent.change(search(), { target: { value: "py" } });

    await waitFor(() => expect(screen.getByText("Python")).toBeTruthy());
    expect(screen.queryByText("Go")).toBeNull();
  });

  it("should match on the name the author reads, not only the fence name", async () => {
    // `plain` is the one query in this list that the labels answer and the
    // fence names do not — ```text is what gets written, "Plain text" is what
    // gets shown.
    renderPicker();
    open();
    await screen.findByPlaceholderText("editor.codeLanguageSearch");

    fireEvent.change(search(), { target: { value: "plain" } });

    await waitFor(() => expect(screen.getByText("editor.codeLanguagePlain")).toBeTruthy());
    expect(screen.queryByText("Python")).toBeNull();
  });

  it("should commit the picked language", async () => {
    const { onChange } = renderPicker();
    open();
    await screen.findByPlaceholderText("editor.codeLanguageSearch");
    fireEvent.change(search(), { target: { value: "py" } });
    await waitFor(() => expect(screen.getByText("Python")).toBeTruthy());

    fireEvent.click(screen.getByText("Python"));

    expect(onChange).toHaveBeenCalledWith("python");
  });

  it("should report auto as auto, not as a language", async () => {
    // The card turns this back into `language = null`; handing it "auto" as a
    // grammar name would tag the fence ```auto.
    const { onChange } = renderPicker("python");
    open();
    await screen.findByPlaceholderText("editor.codeLanguageSearch");

    fireEvent.click(screen.getByText("editor.codeLanguageAuto"));

    expect(onChange).toHaveBeenCalledWith(AUTO);
  });

  it("should open on the language the block already has", async () => {
    // Otherwise the first row is highlighted, and opening the picker on a
    // Python block and pressing Enter straight away would reset it to
    // auto-detect — with picking by keyboard being the point of the control.
    const { onChange } = renderPicker("python");
    open();
    await screen.findByPlaceholderText("editor.codeLanguageSearch");

    fireEvent.keyDown(search(), { key: "Enter" });

    expect(onChange).toHaveBeenCalledWith("python");
  });

  it("should open on a language the list does not carry", async () => {
    // The trigger's label and the option's identity are computed by two
    // different paths here — labelFor's fallback and the option languageOptions
    // pushes. If they drift, Enter lands on auto-detect and rewrites a fence
    // the picker was only ever meant to display.
    const { onChange } = renderPicker("rust");
    open();
    await screen.findByPlaceholderText("editor.codeLanguageSearch");

    fireEvent.keyDown(search(), { key: "Enter" });

    expect(onChange).toHaveBeenCalledWith("rust");
  });

  it("should say so when nothing matches", async () => {
    renderPicker();
    open();
    await screen.findByPlaceholderText("editor.codeLanguageSearch");

    fireEvent.change(search(), { target: { value: "cobol" } });

    await waitFor(() => expect(screen.getByText("editor.codeLanguageNoResults")).toBeTruthy());
  });

  it("should mark which language is currently set", async () => {
    renderPicker("go");
    open();

    // Scoped to the popup: the trigger reads "Go" too, so an unscoped query
    // matches twice.
    const popup = await screen.findByRole("dialog");
    const item = within(popup).getByText("Go").closest("[data-slot='command-item']");

    expect(item?.querySelector(".opacity-100")).toBeTruthy();
  });
});
