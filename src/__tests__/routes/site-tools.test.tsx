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
    await renderRoute(PATH);
    await screen.findByText("WANG, HSIAO-MING");

    fireEvent.click(screen.getByRole("button", { name: "2 字" }));

    expect(await screen.findByText("WANG-HSIAO, MING")).toBeTruthy();
  });

  it("drops an override when the name changes, rather than carrying it over", async () => {
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
