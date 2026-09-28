// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { I18nProvider, useI18n } from "@/i18n/I18nProvider";
afterEach(cleanup);
function Interface() {
  const { t, setLocale } = useI18n();
  return (
    <>
      <p>{t("public.writing")}</p>
      <button onClick={() => setLocale("zh-TW")}>Change admin language</button>
      <article lang="zh-Hant">中文文章內容</article>
    </>
  );
}
describe("public locale", () => {
  it("should keep English UI and Chinese content when the saved preference is Chinese", () => {
    render(
      <I18nProvider initialLocale="zh-TW" fixedLocale="en">
        <Interface />
      </I18nProvider>,
    );
    expect(screen.getByText("Writing")).toBeTruthy();
    expect(screen.getByText("中文文章內容")).toBeTruthy();
  });
  it("should restore the admin preference when navigating back from public pages", () => {
    const view = render(
      <I18nProvider initialLocale="en">
        <Interface />
      </I18nProvider>,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("文章")).toBeTruthy();
    view.rerender(
      <I18nProvider initialLocale="en" fixedLocale="en">
        <Interface />
      </I18nProvider>,
    );
    expect(screen.getByText("Writing")).toBeTruthy();
    view.rerender(
      <I18nProvider initialLocale="en">
        <Interface />
      </I18nProvider>,
    );
    expect(screen.getByText("文章")).toBeTruthy();
  });
});
