// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { I18nProvider } from "@/i18n/I18nProvider";
import { T } from "@/i18n/T";

afterEach(cleanup);

describe("<T> + I18nProvider", () => {
  it("renders a translated string (default locale en)", () => {
    render(
      <I18nProvider>
        <T k="common.back" />
      </I18nProvider>,
    );
    expect(screen.getByText("Back")).toBeTruthy();
  });

  it("interpolates params", () => {
    render(
      <I18nProvider>
        <T k="admin.deleteTagTitle" params={{ name: "X" }} />
      </I18nProvider>,
    );
    expect(screen.getByText('Delete tag "X"?')).toBeTruthy();
  });
});
