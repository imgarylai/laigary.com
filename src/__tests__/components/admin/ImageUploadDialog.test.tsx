// @vitest-environment jsdom
//
// The editor's image dialog: pick a file, optionally crop it, upload, and drop
// the result into the document. Reached from both the toolbar and `/image`.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import type { Editor } from "@tiptap/react";
import { ImageUploadDialog } from "@/components/admin/editor/ImageUploadDialog";

const { uploadFile, getCroppedBlob, compressImage } = vi.hoisted(() => ({
  uploadFile: vi.fn(),
  getCroppedBlob: vi.fn(),
  compressImage: vi.fn(),
}));

vi.mock("@/lib/upload-client", () => ({ uploadFile, getCroppedBlob, compressImage }));
vi.mock("@/i18n/I18nProvider", () => ({
  useI18n: () => ({ t: (k: string) => k, locale: "en" }),
}));
// react-image-crop measures layout, which jsdom does not do, so the real
// cropper never fires onComplete on its own; the button stands in for dragging
// a crop out. The crop maths itself is covered in upload-client.test.ts.
vi.mock("react-image-crop", () => ({
  default: ({
    children,
    onChange,
    onComplete,
  }: {
    children?: React.ReactNode;
    onChange?: (c: unknown) => void;
    onComplete?: (c: unknown) => void;
  }) => (
    <div>
      {/* Dragging a crop out: onChange fires continuously, onComplete once on
          release. Two buttons so a test can drive either half. */}
      <button
        type="button"
        data-testid="drag-crop"
        onClick={() => onChange?.({ x: 0, y: 0, width: 80, height: 45, unit: "px" })}
      >
        drag
      </button>
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

/** Records what the dialog inserts into the document. */
function stubEditor() {
  const setImage = vi.fn(() => ({ run: vi.fn() }));
  const editor = {
    chain: () => ({ focus: () => ({ setImage }) }),
  } as unknown as Editor;
  return { editor, setImage };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("URL", { ...URL, createObjectURL: () => "blob:preview" });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function renderDialog() {
  const { editor, setImage } = stubEditor();
  const onOpenChange = vi.fn();
  render(<ImageUploadDialog editor={editor} open onOpenChange={onOpenChange} />);
  return { setImage, onOpenChange };
}

function pickFile() {
  const input = document.querySelector('input[type="file"]')!;
  fireEvent.change(input, {
    target: { files: [new File(["img"], "shot.png", { type: "image/png" })] },
  });
}

const uploadButton = () => screen.getByRole("button", { name: "editor.uploadImage" });

describe("ImageUploadDialog", () => {
  it("should refuse to upload before a file is chosen", () => {
    renderDialog();

    expect(uploadButton().hasAttribute("disabled")).toBe(true);
  });

  it("should preview the chosen file and enable uploading", () => {
    renderDialog();

    pickFile();

    expect(screen.getByAltText("Preview")).toBeTruthy();
    expect(uploadButton().hasAttribute("disabled")).toBe(false);
  });

  it("should upload the file as-is when no crop was requested", async () => {
    compressImage.mockImplementation(async (f: File) => f);
    uploadFile.mockResolvedValue("/uploads/pic.png");
    const { setImage, onOpenChange } = renderDialog();

    pickFile();
    fireEvent.click(uploadButton());

    await waitFor(() => expect(setImage).toHaveBeenCalledWith({ src: "/uploads/pic.png" }));
    // Cropping is opt-in, so an untouched image must not be run through it.
    expect(getCroppedBlob).not.toHaveBeenCalled();
    expect(compressImage).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("should offer aspect presets once cropping starts", () => {
    renderDialog();
    pickFile();

    fireEvent.click(screen.getByRole("button", { name: /editor.cropImage/ }));

    expect(screen.getByAltText("Crop")).toBeTruthy();
    expect(screen.getByRole("button", { name: "16:9" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "editor.cropFree" })).toBeTruthy();
  });

  it("should lock the crop to a chosen aspect ratio", () => {
    renderDialog();
    pickFile();
    fireEvent.click(screen.getByRole("button", { name: /editor.cropImage/ }));

    fireEvent.click(screen.getByRole("button", { name: "16:9" }));

    // The active preset is the one the crop is constrained to, so it has to be
    // distinguishable from the rest.
    expect(screen.getByRole("button", { name: "16:9" }).className).toContain("secondary");
    expect(screen.getByRole("button", { name: "4:3" }).className).not.toContain("secondary");
  });

  it("should follow the crop as it is dragged", () => {
    renderDialog();
    pickFile();
    fireEvent.click(screen.getByRole("button", { name: /editor.cropImage/ }));

    // Only onComplete gates the upload, but the rectangle has to track the drag
    // or the cropper would render a frozen frame under the pointer.
    fireEvent.click(screen.getByTestId("drag-crop"));

    expect(screen.getByAltText("Crop")).toBeTruthy();
  });

  it("should go back to the plain preview when cropping is cancelled", () => {
    renderDialog();
    pickFile();
    fireEvent.click(screen.getByRole("button", { name: /editor.cropImage/ }));

    fireEvent.click(screen.getByRole("button", { name: "editor.cancelCrop" }));

    expect(screen.getByAltText("Preview")).toBeTruthy();
    expect(screen.queryByAltText("Crop")).toBeNull();
  });

  it("should crop before compressing when a crop was drawn", async () => {
    getCroppedBlob.mockResolvedValue(new Blob(["x"], { type: "image/jpeg" }));
    compressImage.mockImplementation(async (f: File) => f);
    uploadFile.mockResolvedValue("/uploads/cropped.jpg");
    const { setImage } = renderDialog();

    pickFile();
    fireEvent.click(screen.getByRole("button", { name: /editor.cropImage/ }));
    fireEvent.load(screen.getByAltText("Crop"));
    fireEvent.click(screen.getByTestId("finish-crop"));
    fireEvent.click(uploadButton());

    await waitFor(() => expect(setImage).toHaveBeenCalledWith({ src: "/uploads/cropped.jpg" }));
    // Uploading the original here would silently discard the crop.
    expect(getCroppedBlob).toHaveBeenCalled();
    expect(compressImage).toHaveBeenCalled();
  });

  it("should keep the dialog open and show why when the upload fails", async () => {
    compressImage.mockImplementation(async (f: File) => f);
    uploadFile.mockRejectedValue(new Error("R2 said no"));
    const { setImage, onOpenChange } = renderDialog();

    pickFile();
    fireEvent.click(uploadButton());

    expect(await screen.findByText("R2 said no")).toBeTruthy();
    expect(setImage).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("should fall back to a generic message when the failure is not an Error", async () => {
    // fetch and third-party code can reject with a string; showing "undefined"
    // as the reason would be worse than saying nothing useful.
    compressImage.mockImplementation(async (f: File) => f);
    uploadFile.mockRejectedValue("nope");
    renderDialog();

    pickFile();
    fireEvent.click(uploadButton());

    expect(await screen.findByText("editor.uploadFailed")).toBeTruthy();
  });

  it("should close without inserting anything when cancelled", () => {
    const { setImage, onOpenChange } = renderDialog();
    pickFile();

    fireEvent.click(screen.getByRole("button", { name: "postForm.cancel" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(setImage).not.toHaveBeenCalled();
    expect(uploadFile).not.toHaveBeenCalled();
  });
});
