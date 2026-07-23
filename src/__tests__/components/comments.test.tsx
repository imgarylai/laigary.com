// @vitest-environment jsdom
//
// The giscus mount contract: configured → the client script lands in the
// container with the repo/category wiring; unconfigured → nothing renders.
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { Comments } from "@/components/Comments";

vi.mock("@/i18n/I18nProvider", () => ({
  useI18n: () => ({ t: (key: string) => key, locale: "zh-TW" }),
}));

vi.mock("@/components/ThemeProvider", () => ({
  useTheme: () => ({ resolvedTheme: "dark" }),
}));

afterEach(cleanup);

const config = {
  repo: "imgarylai/laigary.com",
  repoId: "R_x",
  category: "Comments",
  categoryId: "DIC_x",
};

describe("Comments", () => {
  it("should inject the giscus client script when configured", () => {
    const { container } = render(<Comments config={config} />);
    const script = container.querySelector("script");
    expect(script?.src).toBe("https://giscus.app/client.js");
    expect(script?.getAttribute("data-repo")).toBe("imgarylai/laigary.com");
    expect(script?.getAttribute("data-repo-id")).toBe("R_x");
    expect(script?.getAttribute("data-category-id")).toBe("DIC_x");
    expect(script?.getAttribute("data-mapping")).toBe("pathname");
    expect(script?.getAttribute("data-theme")).toBe("dark");
    expect(script?.getAttribute("data-lang")).toBe("zh-TW");
  });

  it("should render nothing when unconfigured", () => {
    const { container } = render(<Comments config={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("should empty the container when unmounted", () => {
    const { container, unmount } = render(<Comments config={config} />);
    expect(container.querySelector("script")).toBeTruthy();
    unmount();
    expect(container.querySelector("script")).toBeNull();
  });
});
