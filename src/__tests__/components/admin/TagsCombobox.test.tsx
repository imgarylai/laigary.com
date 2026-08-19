// @vitest-environment happy-dom
//
// The whole interactive surface of the tag editor. Selecting was reachable via
// the post/note form tests; unselecting was not, so `toggle` could have been a
// one-way append and nothing would have noticed.

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { TagsCombobox } from "@/components/admin/TagsCombobox";

vi.mock("@/i18n/I18nProvider", () => ({
  useI18n: () => ({
    t: (k: string, vars?: Record<string, string>) =>
      vars ? `${k}:${Object.values(vars).join(",")}` : k,
    locale: "en",
  }),
}));

// cmdk measures its list with a ResizeObserver jsdom does not implement, and
// without one the popup never renders.
vi.stubGlobal(
  "ResizeObserver",
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);

const options = [
  { id: "t1", name: "Go", slug: "go" },
  { id: "t2", name: "Rust", slug: "rust" },
];

function openList() {
  fireEvent.click(screen.getByRole("button", { expanded: false }));
}

afterEach(cleanup);

describe("TagsCombobox", () => {
  it("adds a tag that is not selected yet", () => {
    const onChange = vi.fn();
    render(<TagsCombobox options={options} value={[]} onChange={onChange} />);
    openList();

    fireEvent.click(screen.getByText("Go"));

    expect(onChange).toHaveBeenCalledWith(["t1"]);
  });

  it("removes a tag that is already selected when picked again", () => {
    // Toggle-off. A `toggle` that only ever appends passes every add test.
    const onChange = vi.fn();
    render(<TagsCombobox options={options} value={["t1", "t2"]} onChange={onChange} />);
    openList();

    fireEvent.click(screen.getByRole("option", { name: /Go/ }));

    expect(onChange).toHaveBeenCalledWith(["t2"]);
  });

  it("removes a tag from its badge without touching the others", () => {
    const onChange = vi.fn();
    render(<TagsCombobox options={options} value={["t1", "t2"]} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "tagsCombobox.removeTag:Go" }));

    expect(onChange).toHaveBeenCalledWith(["t2"]);
  });

  it("shows a badge per selected tag and none when the selection is empty", () => {
    const { unmount } = render(
      <TagsCombobox options={options} value={["t2"]} onChange={vi.fn()} />,
    );

    expect(screen.getByRole("button", { name: "tagsCombobox.removeTag:Rust" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "tagsCombobox.removeTag:Go" })).toBeNull();

    unmount();
    render(<TagsCombobox options={options} value={[]} onChange={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /removeTag/ })).toBeNull();
  });

  it("summarises the count on the trigger rather than listing names", () => {
    render(<TagsCombobox options={options} value={["t1", "t2"]} onChange={vi.fn()} />);

    expect(screen.getByText("tagsCombobox.selectedCount:2")).toBeTruthy();
  });

  it("falls back to the placeholder with nothing selected", () => {
    render(<TagsCombobox options={options} value={[]} onChange={vi.fn()} />);

    expect(screen.getByText("tagsCombobox.placeholder")).toBeTruthy();
  });
});
