// @vitest-environment jsdom
//
// The cover image control in the post settings sheet: what it shows with and
// without a cover, and the upload dialog's own states.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { CoverImageUpload } from "@/components/admin/CoverImageUpload";

const { uploadFile, getCroppedBlob, compressImage } = vi.hoisted(() => ({
  uploadFile: vi.fn(),
  getCroppedBlob: vi.fn(),
  compressImage: vi.fn(),
}));

vi.mock("@/lib/upload-client", () => ({ uploadFile, getCroppedBlob, compressImage }));
vi.mock("@/i18n/I18nProvider", () => ({
  useI18n: () => ({ t: (k: string) => k, locale: "en" }),
}));
// react-image-crop measures layout, which jsdom does not do; the crop maths
// itself is covered in upload-client.test.ts.
vi.mock("react-image-crop", () => ({
  default: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  centerCrop: (c: unknown) => c,
  makeAspectCrop: (c: unknown) => c,
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("URL", { ...URL, createObjectURL: () => "blob:preview" });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function renderCover(value = "") {
  const onChange = vi.fn();
  render(
    <CoverImageUpload value={value} onChange={onChange} title="A post" ogBrand="Unconstrained" />,
  );
  return { onChange };
}

describe("CoverImageUpload", () => {
  it("should preview the generated OG card when no cover has been set", () => {
    // Without a cover the post still gets an OG image, so show what it will be
    // rather than an empty box.
    renderCover();

    expect(screen.getByText("A post")).toBeTruthy();
    expect(screen.getByText("Unconstrained")).toBeTruthy();
  });

  it("should show the cover itself once one is set", () => {
    renderCover("/uploads/cover.png");

    expect(screen.getByAltText("Cover")).toHaveProperty(
      "src",
      expect.stringContaining("cover.png"),
    );
    expect(screen.queryByText("Unconstrained")).toBeNull();
  });

  it("should clear the cover when it is removed", () => {
    const { onChange } = renderCover("/uploads/cover.png");

    fireEvent.click(screen.getByRole("button", { name: "postForm.removeCover" }));

    expect(onChange).toHaveBeenCalledWith("");
  });

  it("should open the upload dialog from the card", async () => {
    renderCover();

    fireEvent.click(screen.getByRole("button", { name: "postForm.uploadCover" }));

    expect(await screen.findByRole("dialog")).toBeTruthy();
  });

  it("should refuse to upload until a crop has been chosen", async () => {
    renderCover();
    fireEvent.click(screen.getByRole("button", { name: "postForm.uploadCover" }));
    await screen.findByRole("dialog");

    // Uploading an uncropped image would ignore the 16:9 frame the card shows.
    expect(
      screen.getByRole("button", { name: "editor.uploadImage" }).hasAttribute("disabled"),
    ).toBe(true);
  });

  it("should close the dialog without touching the cover when cancelled", async () => {
    const { onChange } = renderCover();
    fireEvent.click(screen.getByRole("button", { name: "postForm.uploadCover" }));
    await screen.findByRole("dialog");

    fireEvent.click(screen.getByRole("button", { name: "postForm.cancel" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(onChange).not.toHaveBeenCalled();
    expect(uploadFile).not.toHaveBeenCalled();
  });

  it("should label the card as a change once a cover exists", () => {
    renderCover("/uploads/cover.png");

    expect(screen.getByRole("button", { name: "postForm.changeCover" })).toBeTruthy();
  });
});
