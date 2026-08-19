// @vitest-environment jsdom
//
// /tools/wade-giles-name. The conversion itself is covered in
// lib/name-romanization.test.ts; what this asserts is the page's own
// judgement — the surname split it offers, the caveat it raises, and the fact
// that both romanizations are on screen at once, which is the reason the page
// exists rather than a one-column converter.
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, screen, fireEvent, waitFor } from "@testing-library/react";
import { installShellStubs, renderRoute, warmRouteTree } from "../helpers/router";

vi.mock("@/lib/og/render", () => ({ renderOgPng: vi.fn() }));
vi.mock("@tanstack/react-devtools", () => ({ TanStackDevtools: () => null }));
vi.mock("@tanstack/react-router-devtools", () => ({ TanStackRouterDevtoolsPanel: () => null }));
vi.mock("@/i18n/I18nProvider", () => ({
  I18nProvider: ({ children }: { children: React.ReactNode }) => children,
  useI18n: () => ({ t: (k: string) => k, locale: "zh-TW" }),
}));
vi.mock("@/server/locale", () => ({ resolveLocaleFn: async () => "zh-TW" }));
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

const PATH = "/tools/wade-giles-name";

describe("/tools/wade-giles-name", () => {
  it("shows both romanizations side by side, not just Wade-Giles", async () => {
    await renderRoute(PATH);

    expect(await screen.findByText("WANG, HSIAO-MING")).toBeTruthy();
    // Both names also appear in the prose below, so these are getAllByText;
    // the load-bearing assertion is the differing surnames underneath.
    expect(screen.getAllByText("威妥瑪拼音").length).toBeGreaterThan(0);
    expect(screen.getAllByText("漢語拼音").length).toBeGreaterThan(0);
    // The comparison only earns its place when the two disagree; WANG/WANG
    // would not show that, so the surname columns are checked on a name where
    // they differ.
    fireEvent.change(screen.getByLabelText("中文姓名"), { target: { value: "許志安" } });
    await waitFor(() => expect(screen.getByText("HSU")).toBeTruthy());
    expect(screen.getByText("XU")).toBeTruthy();
  });

  it("leads with the passport line, since that is what gets copied onto the form", async () => {
    await renderRoute(PATH);
    await screen.findByText("WANG, HSIAO-MING");

    fireEvent.change(screen.getByLabelText("中文姓名"), { target: { value: "蔡英文" } });

    // No apostrophe: ts'ai on paper is TSAI on a passport.
    expect(await screen.findByText("TSAI, YING-WEN")).toBeTruthy();
  });

  it("detects a compound surname and marks which split is automatic", async () => {
    await renderRoute(PATH);
    await screen.findByText("WANG, HSIAO-MING");

    fireEvent.change(screen.getByLabelText("中文姓名"), { target: { value: "歐陽娜娜" } });

    expect(await screen.findByText("OU-YANG, NA-NA")).toBeTruthy();
    expect(screen.getByRole("button", { name: "2 字（自動）" })).toBeTruthy();
  });

  it("lets the reader override a split the lookup got wrong", async () => {
    const { router } = await renderRoute(PATH);
    await screen.findByText("WANG, HSIAO-MING");

    fireEvent.click(screen.getByRole("button", { name: "2 字" }));

    expect(await screen.findByText("WANG-HSIAO, MING")).toBeTruthy();
    expect(router.state.location.search).toMatchObject({ s: 2 });
  });

  it("reads the name out of the URL, so a refresh or a shared link keeps it", async () => {
    await renderRoute(`${PATH}?name=${encodeURIComponent("許志安")}`);

    expect(await screen.findByText("HSU, CHIH-AN")).toBeTruthy();
  });

  it("writes the name into the URL as it is typed, replacing rather than stacking", async () => {
    const { router } = await renderRoute(PATH);
    await screen.findByText("WANG, HSIAO-MING");
    const before = router.history.length;

    fireEvent.change(screen.getByLabelText("中文姓名"), { target: { value: "蔡英文" } });

    await waitFor(() => expect(router.state.location.search).toMatchObject({ name: "蔡英文" }));
    // Typing a name is one edit; each keystroke must not become a back step.
    expect(router.history.length).toBe(before);
  });

  it("lets a Bopomofo IME finish a character before touching the URL", async () => {
    const { router } = await renderRoute(PATH);
    await screen.findByText("WANG, HSIAO-MING");
    const input = screen.getByLabelText("中文姓名") as HTMLInputElement;

    // What a 注音 IME actually does: several `change` events carrying
    // half-built text, then one `compositionend` with the character. Writing
    // any of the intermediate ones back into `value` ends the composition, so
    // ㄨ committed as ㄨ instead of becoming 王.
    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: "ㄨ" } });
    fireEvent.change(input, { target: { value: "ㄨㄤ" } });
    fireEvent.change(input, { target: { value: "ㄨㄤˊ" } });

    // The field shows what the IME put there, untouched...
    expect(input.value).toBe("ㄨㄤˊ");
    // ...and nothing half-built reaches the URL.
    expect(router.state.location.search).not.toHaveProperty("name");

    fireEvent.compositionEnd(input, { target: { value: "王" } });

    await waitFor(() => expect(router.state.location.search).toMatchObject({ name: "王" }));
    expect(input.value).toBe("王");
    // A lone character is all surname, so WANG lands in three places at once.
    expect(await screen.findAllByText("WANG")).toHaveLength(3);
  });

  it("still commits immediately when nothing is composing", async () => {
    const { router } = await renderRoute(PATH);
    await screen.findByText("WANG, HSIAO-MING");

    // Pasting, or typing with a Latin keyboard, fires no composition events.
    fireEvent.change(screen.getByLabelText("中文姓名"), { target: { value: "蔡英文" } });

    await waitFor(() => expect(router.state.location.search).toMatchObject({ name: "蔡英文" }));
  });

  it("restores a chosen reading from the URL", async () => {
    await renderRoute(`${PATH}?name=${encodeURIComponent("樂大維")}&py=yue4-da4-wei2`);

    expect(await screen.findByText("YUEH, TA-WEI")).toBeTruthy();
  });

  it("offers the readings of a polyphone in Bopomofo and rebuilds on a click", async () => {
    const { router } = await renderRoute(`${PATH}?name=${encodeURIComponent("樂大維")}`);
    expect(await screen.findByText("LE, TA-WEI")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /ㄩㄝˋ/ }));

    expect(await screen.findByText("YUEH, TA-WEI")).toBeTruthy();
    expect(router.state.location.search).toMatchObject({ py: "yue4-da4-wei2" });
  });

  it("asks about a character only when its readings spell differently", async () => {
    await renderRoute(PATH);
    await screen.findByText("WANG, HSIAO-MING");

    // 王 is wáng or wàng and WANG either way — nothing to choose, so the whole
    // section stays off the page.
    expect(screen.queryByText(/破音字/)).toBeNull();
  });

  it("drops a chosen reading when the name changes", async () => {
    const { router } = await renderRoute(
      `${PATH}?name=${encodeURIComponent("樂大維")}&py=yue4-da4-wei2`,
    );
    await screen.findByText("YUEH, TA-WEI");

    fireEvent.change(screen.getByLabelText("中文姓名"), { target: { value: "陳美玲" } });

    expect(await screen.findByText("CHEN, MEI-LING")).toBeTruthy();
    expect(router.state.location.search).not.toMatchObject({ py: "yue4-da4-wei2" });
  });

  it("drops a split override when the name changes, rather than carrying it over", async () => {
    await renderRoute(PATH);
    await screen.findByText("WANG, HSIAO-MING");
    fireEvent.click(screen.getByRole("button", { name: "2 字" }));
    await screen.findByText("WANG-HSIAO, MING");

    fireEvent.change(screen.getByLabelText("中文姓名"), { target: { value: "陳美玲" } });

    // A 2-character surname chosen for 王小明 would silently mangle the next
    // name entered.
    expect(await screen.findByText("CHEN, MEI-LING")).toBeTruthy();
  });

  it("raises the ü caveat only for a name that has one", async () => {
    await renderRoute(PATH);
    await screen.findByText("WANG, HSIAO-MING");
    expect(screen.queryByText(/含有 ü 的音/)).toBeNull();

    fireEvent.change(screen.getByLabelText("中文姓名"), { target: { value: "呂秀蓮" } });

    expect(await screen.findByText(/含有 ü 的音/)).toBeTruthy();
    expect(screen.getByText("LU, HSIU-LIEN")).toBeTruthy();
    expect(screen.getByText("LYU")).toBeTruthy();
  });

  it("hides the output and the split control when the field is empty", async () => {
    await renderRoute(PATH);
    await screen.findByText("WANG, HSIAO-MING");

    fireEvent.change(screen.getByLabelText("中文姓名"), { target: { value: "" } });

    await waitFor(() => expect(screen.queryByText("WANG, HSIAO-MING")).toBeNull());
    expect(screen.queryByRole("button", { name: /字/ })).toBeNull();
  });

  it("says it is not the official system", async () => {
    await renderRoute(PATH);

    expect(await screen.findByText(/這是參考工具，不是官方系統/)).toBeTruthy();
  });
});
