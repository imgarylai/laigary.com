// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { TmPager, pageWindow } from "@/components/terminal/Pager";

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
});
