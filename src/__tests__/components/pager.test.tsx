// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { TmPager, pageWindow } from "@/features/terminal/Pager";

vi.mock("@/i18n/I18nProvider", () => ({
  useI18n: () => ({ t: (key: string) => key, locale: "en" }),
}));

afterEach(cleanup);

describe("pageWindow", () => {
  it("should list every page when there are few pages", () => {
    expect(pageWindow(2, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("should window around the current page with gaps when there are many pages", () => {
    expect(pageWindow(10, 20)).toEqual([1, 2, null, 9, 10, 11, null, 19, 20]);
  });

  it("should not duplicate edges when current is near the start", () => {
    expect(pageWindow(1, 20)).toEqual([1, 2, null, 19, 20]);
  });
});

describe("TmPager", () => {
  const props = { current: 2, totalPages: 3, from: 21, to: 40, total: 55 };

  it("should render nothing when there is a single page", () => {
    const { container } = render(<TmPager {...props} totalPages={1} onPage={() => {}} />);
    expect(container.innerHTML).toBe("");
  });

  it("should report the clicked page when a number is pressed", () => {
    const onPage = vi.fn();
    render(<TmPager {...props} onPage={onPage} />);
    fireEvent.click(screen.getByText("3"));
    expect(onPage).toHaveBeenCalledWith(3);
  });

  it("should disable newer on the first page when rendering", () => {
    render(<TmPager {...props} current={1} onPage={() => {}} />);
    expect(screen.getByText("blog.archive.newer").closest("button")?.disabled).toBe(true);
  });

  it("should step back one page from newer", () => {
    // Relative, not absolute: newer/older move by one from wherever you are.
    // Hardcoding 1 / totalPages passes on a two-page list and nowhere else.
    const onPage = vi.fn();
    render(<TmPager {...props} current={2} onPage={onPage} />);

    fireEvent.click(screen.getByText("blog.archive.newer"));

    expect(onPage).toHaveBeenCalledWith(1);
  });

  it("should step forward one page from older", () => {
    const onPage = vi.fn();
    render(<TmPager {...props} current={2} totalPages={5} onPage={onPage} />);

    fireEvent.click(screen.getByText("blog.archive.older"));

    expect(onPage).toHaveBeenCalledWith(3);
  });

  it("should disable older on the last page", () => {
    render(<TmPager {...props} current={3} totalPages={3} onPage={() => {}} />);
    expect(screen.getByText("blog.archive.older").closest("button")?.disabled).toBe(true);
  });
});
