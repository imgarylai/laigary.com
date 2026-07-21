// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { SettingsForm } from "@/components/admin/SettingsForm";

const { updateSettingsFn, invalidate, toast } = vi.hoisted(() => ({
  updateSettingsFn: vi.fn(),
  invalidate: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/server/admin/settings", () => ({ updateSettingsFn }));
vi.mock("@tanstack/react-router", () => ({ useRouter: () => ({ invalidate }) }));
vi.mock("sonner", () => ({ toast }));
vi.mock("@/i18n/I18nProvider", () => ({ useI18n: () => ({ t: (k: string) => k, locale: "en" }) }));

beforeEach(() => vi.clearAllMocks());
afterEach(() => cleanup());

describe("SettingsForm", () => {
  it("submits the full settings map (with edits) and invalidates on success", async () => {
    updateSettingsFn.mockResolvedValue({ ok: true });
    render(<SettingsForm settings={{ site_name: "Old", author_name: "Gary" }} />);

    fireEvent.change(screen.getByLabelText("admin.siteName"), { target: { value: "New Name" } });
    fireEvent.click(screen.getByRole("button", { name: "admin.save" }));

    await waitFor(() => expect(updateSettingsFn).toHaveBeenCalledTimes(1));
    const sent = updateSettingsFn.mock.calls[0][0].data;
    expect(sent.site_name).toBe("New Name");
    expect(sent.author_name).toBe("Gary");
    expect(toast.success).toHaveBeenCalled();
    expect(invalidate).toHaveBeenCalled();
  });

  it("shows an error toast on failure", async () => {
    updateSettingsFn.mockResolvedValue({ ok: false, error: "boom" });
    render(<SettingsForm settings={{}} />);

    fireEvent.click(screen.getByRole("button", { name: "admin.save" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(invalidate).not.toHaveBeenCalled();
  });
});
