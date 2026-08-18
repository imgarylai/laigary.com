// @vitest-environment jsdom
//
// The /labs section. Each demo page is a thin wrapper around a published npm
// package, so these tests assert the wiring rather than the package's own
// logic: that the playground reaches the package, that its options are actually
// bound to the call, and — the point of the section — that the snippet under
// each playground reports the same call the playground just made. That last
// assertion is what stops a page from showing code it does not run.
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, screen, fireEvent, waitFor } from "@testing-library/react";
import { installShellStubs, renderRoute, warmRouteTree } from "../helpers/router";
import { LABS } from "@/lib/labs";

// Same five mocks every route-component test installs — see helpers/router.
vi.mock("@/lib/og/render", () => ({ renderOgPng: vi.fn() }));
vi.mock("@tanstack/react-devtools", () => ({ TanStackDevtools: () => null }));
vi.mock("@tanstack/react-router-devtools", () => ({ TanStackRouterDevtoolsPanel: () => null }));
vi.mock("@/i18n/I18nProvider", () => ({
  I18nProvider: ({ children }: { children: React.ReactNode }) => children,
  useI18n: () => ({ t: (k: string) => k, locale: "en" }),
}));
vi.mock("@/server/locale", () => ({ resolveLocaleFn: async () => "en" }));
vi.mock("@/server/posts", () => ({ searchPostsFn: async () => ({ posts: [], total: 0 }) }));

vi.mock("@/server/public", () => ({
  blogShellFn: async () => ({
    siteName: "Unconstrained",
    social: { github: null, twitter: null, linkedin: null, email: null },
  }),
  labsChromeFn: async ({ data }: { data: { title: string } }) => ({
    pageTitle: `${data.title} | Unconstrained`,
    siteName: "Unconstrained",
  }),
}));

installShellStubs();

beforeAll(warmRouteTree, 60_000);
beforeEach(() => vi.clearAllMocks());
afterEach(() => cleanup());

// The snippet block renders as one <code> string, so assertions on it match a
// substring of that whole node rather than a standalone element.
function snippet(): string {
  const el = document.querySelector(".tm-code code");
  if (!el) throw new Error("no snippet block on the page");
  return el.textContent ?? "";
}

describe("/labs", () => {
  it("lists every registered lab with its tagline and kind", async () => {
    await renderRoute("/labs");

    for (const lab of LABS) {
      expect(await screen.findByText(`./${lab.slug}`)).toBeTruthy();
      expect(screen.getByText(lab.tagline)).toBeTruthy();
    }
  });

  it("opens a lab when its row is clicked", async () => {
    const { router } = await renderRoute("/labs");

    fireEvent.click(await screen.findByText("./use-wg"));

    await waitFor(() => expect(router.state.location.pathname).toBe("/labs/use-wg"));
  });
});

describe("/labs/use-tw-zipcode", () => {
  it("resets the district and the zipcode when the city changes", async () => {
    await renderRoute("/labs/use-tw-zipcode");

    // The hook seeds itself with the first city, so the page has a zipcode
    // before anyone touches it.
    expect(await screen.findByText("100")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("縣市"), { target: { value: "高雄市" } });

    // 新興區 is 高雄市's first district; the zipcode follows the pair, which is
    // the entire behaviour the package exists for.
    await waitFor(() => expect(snippet()).toContain('"高雄市"'));
    expect(snippet()).toContain('"新興區"');
    expect(screen.queryByText("100")).toBeNull();
  });
});

describe("/labs/taiwan-validator", () => {
  it("reports every check a value satisfies, without asking which to run", async () => {
    await renderRoute("/labs/taiwan-validator");

    expect(await screen.findByText("✓ 身分證字號")).toBeTruthy();
    // parseNationalId's extras, not just a boolean.
    expect(screen.getByText("男 · 臺北市")).toBeTruthy();
  });

  it("reads the gender out of the id rather than reporting one for everyone", async () => {
    await renderRoute("/labs/taiwan-validator");
    await screen.findByText("男 · 臺北市");

    fireEvent.change(screen.getByLabelText("輸入要驗證的號碼"), {
      target: { value: "A200000003" },
    });

    expect(await screen.findByText("女 · 臺北市")).toBeTruthy();
  });

  it("switches to the matching validator in the snippet when the value changes", async () => {
    await renderRoute("/labs/taiwan-validator");
    await screen.findByText("✓ 身分證字號");

    fireEvent.click(screen.getByText("22099131"));

    await waitFor(() => expect(screen.getByText("✓ 統一編號")).toBeTruthy());
    expect(snippet()).toContain("validateBusinessNumber");
    expect(snippet()).not.toContain("parseNationalId");
  });

  it("runs every check, not just the ones the samples happen to hit", async () => {
    await renderRoute("/labs/taiwan-validator");
    await screen.findByText("✓ 身分證字號");

    const input = screen.getByLabelText("輸入要驗證的號碼");
    const cases: [string, string][] = [
      ["A800000014", "✓ 居留證號碼"],
      ["AB12345678", "✓ 統一發票號碼"],
      ["0912345678", "✓ 手機號碼"],
      ["0223456789", "✓ 市話號碼"],
      ["AAA-0001", "✓ 車牌號碼"],
      ["/ABC+123", "✓ 手機條碼"],
      ["000012345678", "✓ 健保卡號"],
      ["AA12345678901234", "✓ 自然人憑證"],
      ["123456789", "✓ 護照號碼"],
      // 100 is a valid postal code and a valid donation code at once — the
      // reason the page lists matches instead of picking one.
      ["100", "✓ 郵遞區號"],
    ];
    for (const [value, label] of cases) {
      fireEvent.change(input, { target: { value } });
      expect(await screen.findByText(label)).toBeTruthy();
    }
    expect(screen.getByText("✓ 愛心碼")).toBeTruthy();
  });

  it("reports the detected plate type rather than a bare boolean", async () => {
    await renderRoute("/labs/taiwan-validator");
    await screen.findByText("✓ 身分證字號");

    fireEvent.change(screen.getByLabelText("輸入要驗證的號碼"), {
      target: { value: "EAA-0001" },
    });

    expect(await screen.findByText("electric-car")).toBeTruthy();
    expect(snippet()).toContain("detectType: true");
  });

  it("says nothing matched rather than listing thirteen failures", async () => {
    await renderRoute("/labs/taiwan-validator");
    await screen.findByText("✓ 身分證字號");

    fireEvent.change(screen.getByLabelText("輸入要驗證的號碼"), {
      target: { value: "not-a-number-at-all" },
    });

    expect(await screen.findByText("// 沒有任何一種格式通過。")).toBeTruthy();
  });
});

describe("/labs/use-country-list-zh", () => {
  it("filters the Chinese list from an English query", async () => {
    await renderRoute("/labs/use-country-list-zh");
    await screen.findByText("United States");

    fireEvent.change(screen.getByLabelText("搜尋國家"), { target: { value: "united" } });

    // The headline feature: an English substring reaching two Chinese names.
    await waitFor(() => expect(screen.getByText("United Kingdom")).toBeTruthy());
    expect(screen.getByText("United States")).toBeTruthy();
    // Brazil rather than Japan: the intro copy mentions Japan inside a <code>
    // sample, so a bare text query would match the prose and never the list.
    expect(screen.queryByText("Brazil")).toBeNull();
  });

  it("re-sorts the list and drops the flags when the options change", async () => {
    await renderRoute("/labs/use-country-list-zh");
    await screen.findByText("United States");

    fireEvent.click(screen.getByRole("button", { name: "英文字母" }));
    await waitFor(() => expect(snippet()).toContain('sortBy: "en"'));

    fireEvent.click(screen.getByRole("button", { name: "showFlag" }));
    await waitFor(() => expect(snippet()).toContain("showFlag: false"));

    // topList off means nothing is pinned, so the star disappears with it.
    fireEvent.click(screen.getByRole("button", { name: "topList" }));
    await waitFor(() => expect(snippet()).toContain("topList: []"));
    expect(screen.queryByText("★")).toBeNull();
  });

  it("reports the picked country", async () => {
    await renderRoute("/labs/use-country-list-zh");
    await screen.findByText("United States");

    fireEvent.click(screen.getByText("United States").closest("button")!);

    expect(await screen.findByText(/已選擇/)).toBeTruthy();
  });

  it("caps how many rows it paints and says so", async () => {
    await renderRoute("/labs/use-country-list-zh");
    await screen.findByText("United States");

    // 244 countries, 40 painted — the notice is what keeps the cap honest
    // rather than looking like the list simply ends there.
    expect(screen.getByText(/244 個結果（顯示前 40 個/)).toBeTruthy();
    expect(snippet()).toContain("244 個結果");
  });
});

describe("the shared page frame", () => {
  it("copies the snippet and acknowledges it", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });

    await renderRoute("/labs/use-wg");
    await screen.findByText("t'ai²-wan¹");

    fireEvent.click(screen.getByRole("button", { name: /blog\.labs\.copy/ }));

    await waitFor(() => expect(writeText).toHaveBeenCalledOnce());
    expect(writeText.mock.calls[0][0]).toContain("toWadeGiles");
    expect(await screen.findByText("blog.labs.copied")).toBeTruthy();
  });
});

describe("/labs/use-wg", () => {
  it("romanises the input and reports the same call in the snippet", async () => {
    await renderRoute("/labs/use-wg");

    expect(await screen.findByText("t'ai²-wan¹")).toBeTruthy();
    expect(snippet()).toContain('toneFormat: "superscript"');
    expect(snippet()).toContain(`// → "t'ai²-wan¹"`);
  });

  it("switches to ASCII output when urlSafe is on", async () => {
    await renderRoute("/labs/use-wg");
    await screen.findByText("t'ai²-wan¹");

    fireEvent.click(screen.getByRole("button", { name: "urlSafe" }));

    expect(await screen.findByText("tai-wan")).toBeTruthy();
    expect(snippet()).toContain("urlSafe: true");
    // Tone format cannot show through ASCII output, so its buttons go inert
    // rather than looking like they stopped working.
    expect(screen.getByRole("button", { name: "數字 tai2" })).toHaveProperty("disabled", true);
  });

  it("carries the remaining options into the call", async () => {
    await renderRoute("/labs/use-wg");
    await screen.findByText("t'ai²-wan¹");

    fireEvent.click(screen.getByRole("button", { name: "capitalize" }));
    await waitFor(() => expect(snippet()).toContain("capitalize: true"));

    fireEvent.click(screen.getByRole("button", { name: "數字 tai2" }));
    await waitFor(() => expect(snippet()).toContain('toneFormat: "number"'));

    fireEvent.click(screen.getByRole("button", { name: "polyphoneMode: all" }));
    await waitFor(() => expect(snippet()).toContain('polyphoneMode: "all"'));
  });

  it("lists the alternative readings of a polyphone", async () => {
    await renderRoute("/labs/use-wg");
    await screen.findByText("t'ai²-wan¹");

    fireEvent.click(screen.getByRole("button", { name: "銀行" }));
    // In `auto` the package commits to one reading per context and reports no
    // alternatives; `all` is what surfaces them.
    expect(await screen.findByText("yin²-hsing²")).toBeTruthy();
    expect(screen.queryByText(/hang/)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "polyphoneMode: all" }));

    // 行 also reads hang and heng; the segment row shows those in place of the
    // tone, which is the whole reason the option exists.
    expect(await screen.findByText("hsing / hang / heng")).toBeTruthy();
  });

  it("shows a placeholder instead of an empty output box", async () => {
    await renderRoute("/labs/use-wg");
    await screen.findByText("t'ai²-wan¹");

    fireEvent.change(screen.getByLabelText("要轉換的中文字"), { target: { value: "" } });

    expect(await screen.findByText("—")).toBeTruthy();
  });

  it("marks a whitespace segment rather than rendering a blank row", async () => {
    await renderRoute("/labs/use-wg");
    await screen.findByText("t'ai²-wan¹");

    fireEvent.change(screen.getByLabelText("要轉換的中文字"), { target: { value: "台 灣" } });

    expect(await screen.findByText("␣")).toBeTruthy();
  });

  it("breaks the result down per character", async () => {
    await renderRoute("/labs/use-wg");
    await screen.findByText("t'ai²-wan¹");

    expect(screen.getByText("tai2")).toBeTruthy();
    expect(screen.getByText("聲調 2")).toBeTruthy();
  });
});
