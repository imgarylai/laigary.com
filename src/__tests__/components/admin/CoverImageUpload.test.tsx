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
  default: ({
    children,
    onComplete,
  }: {
    children?: React.ReactNode;
    onComplete?: (c: unknown) => void;
  }) => (
    <div>
      {/* Stands in for dragging out a crop: jsdom has no layout, so the real
          cropper never fires onComplete on its own. */}
      <button
        type="button"
        data-testid="finish-crop"
        onClick={() => onComplete?.({ x: 0, y: 0, width: 160, height: 90, unit: "px" })}
      >
        crop
      </button>
      {children}
    </div>
  ),
  centerCrop: (c: unknown) => c,
  makeAspectCrop: (c: unknown) => c,
}));

beforeEach(() => {
  vi.clearAllMocks();
  // Spy the one static instead of replacing the class. `{ ...URL }` copies only
  // own enumerable properties — a class has none — so the replacement lost both
  // [[Construct]] (`new URL(...)` threw "URL is not a constructor" for every
  // test in the file) and `revokeObjectURL`.
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:preview");
});
afterEach(() => {
  cleanup();
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

  /** Walk the dialog to the point where Upload is live. */
  async function pickAndCrop() {
    fireEvent.click(screen.getByRole("button", { name: /postForm.(upload|change)Cover/ }));
    await screen.findByRole("dialog");
    const input = document.querySelector('input[type="file"]')!;
    fireEvent.change(input, {
      target: { files: [new File(["img"], "shot.png", { type: "image/png" })] },
    });
    fireEvent.load(await screen.findByAltText("Crop"));
    fireEvent.click(screen.getByTestId("finish-crop"));
  }

  it("should crop, compress and upload the chosen file, then adopt the URL", async () => {
    getCroppedBlob.mockResolvedValue(new Blob(["x"], { type: "image/jpeg" }));
    compressImage.mockImplementation(async (f: File) => f);
    uploadFile.mockResolvedValue("/uploads/new-cover.jpg");
    const { onChange } = renderCover();

    await pickAndCrop();
    fireEvent.click(screen.getByRole("button", { name: "editor.uploadImage" }));

    await waitFor(() => expect(onChange).toHaveBeenCalledWith("/uploads/new-cover.jpg"));
    // Cropped first, then compressed, then sent — uploading the original would
    // ignore both the frame and the size cap.
    expect(getCroppedBlob).toHaveBeenCalled();
    expect(compressImage).toHaveBeenCalled();
    expect(uploadFile).toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("should keep the dialog open and show why when the upload fails", async () => {
    getCroppedBlob.mockResolvedValue(new Blob(["x"], { type: "image/jpeg" }));
    compressImage.mockImplementation(async (f: File) => f);
    uploadFile.mockRejectedValue(new Error("R2 said no"));
    const { onChange } = renderCover();

    await pickAndCrop();
    fireEvent.click(screen.getByRole("button", { name: "editor.uploadImage" }));

    expect(await screen.findByText("R2 said no")).toBeTruthy();
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("should enable uploading once a crop exists", async () => {
    renderCover();

    await pickAndCrop();

    expect(
      screen.getByRole("button", { name: "editor.uploadImage" }).hasAttribute("disabled"),
    ).toBe(false);
  });
});
