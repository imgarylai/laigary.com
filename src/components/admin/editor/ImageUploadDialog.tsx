import { useReducer, useRef } from "react";
import type { Editor } from "@tiptap/react";
import { SpinnerIcon, CropIcon } from "@phosphor-icons/react";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/I18nProvider";
import { uploadFile, getCroppedBlob, compressImage } from "@/lib/upload-client";

// The dialog juggles file selection, an optional crop step, and the async
// upload — a handful of interdependent flags that are clearer as one state
// object driven by a reducer than as a pile of useState calls that have to be
// reset in lockstep.
type UploadState = {
  file: File | null;
  preview: string | null;
  cropping: boolean;
  aspectRatio: number | undefined;
  crop: Crop | undefined;
  completedCrop: PixelCrop | undefined;
  uploading: boolean;
  error: string | null;
};

const initialState: UploadState = {
  file: null,
  preview: null,
  cropping: false,
  aspectRatio: undefined,
  crop: undefined,
  completedCrop: undefined,
  uploading: false,
  error: null,
};

type UploadAction =
  | { type: "reset" }
  | { type: "selectFile"; file: File | null; preview: string | null }
  | { type: "resetCrop" }
  | { type: "startCrop" }
  | { type: "cancelCrop" }
  | { type: "setAspect"; aspectRatio: number | undefined }
  | { type: "setCrop"; crop: Crop }
  | { type: "setCompletedCrop"; completedCrop: PixelCrop }
  | { type: "uploadStart" }
  | { type: "uploadError"; error: string };

function reducer(state: UploadState, action: UploadAction): UploadState {
  switch (action.type) {
    case "reset":
      // Fully reset when the dialog closes (or after a successful upload).
      return initialState;
    case "selectFile":
      return {
        ...state,
        file: action.file,
        preview: action.preview,
        error: null,
        cropping: false,
        crop: undefined,
        completedCrop: undefined,
      };
    case "resetCrop":
      return { ...state, crop: undefined, completedCrop: undefined };
    case "startCrop":
      return { ...state, cropping: true };
    case "cancelCrop":
      return {
        ...state,
        cropping: false,
        aspectRatio: undefined,
        crop: undefined,
        completedCrop: undefined,
      };
    case "setAspect":
      return {
        ...state,
        aspectRatio: action.aspectRatio,
        crop: undefined,
        completedCrop: undefined,
      };
    case "setCrop":
      return { ...state, crop: action.crop };
    case "setCompletedCrop":
      return { ...state, completedCrop: action.completedCrop };
    case "uploadStart":
      return { ...state, uploading: true, error: null };
    case "uploadError":
      return { ...state, uploading: false, error: action.error };
    default:
      return state;
  }
}

const ASPECT_PRESETS = [
  { label: "free", value: undefined },
  { label: "1:1", value: 1 },
  { label: "16:9", value: 16 / 9 },
  { label: "4:3", value: 4 / 3 },
] as const;

// Controlled, and rendered once by TiptapEditorImpl rather than owning a
// trigger of its own — the toolbar button and the `/image` slash command are
// two doors onto the same dialog. Mirrors how LinkDialog already works.
export function ImageUploadDialog({
  editor,
  open,
  onOpenChange,
}: {
  editor: Editor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useI18n();
  const [state, dispatch] = useReducer(reducer, initialState);
  const inputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    dispatch({
      type: "selectFile",
      file: selected,
      preview: selected ? URL.createObjectURL(selected) : null,
    });
  }

  async function handleUpload() {
    if (!state.file) return;
    dispatch({ type: "uploadStart" });
    try {
      let fileToUpload: File;
      if (state.cropping && state.completedCrop && imgRef.current) {
        const blob = await getCroppedBlob(imgRef.current, state.completedCrop);
        const croppedFile = new File([blob], state.file.name, { type: "image/jpeg" });
        fileToUpload = await compressImage(croppedFile);
      } else {
        fileToUpload = await compressImage(state.file);
      }
      const url = await uploadFile(fileToUpload);
      editor.chain().focus().setImage({ src: url }).run();
      if (inputRef.current) inputRef.current.value = "";
      dispatch({ type: "reset" });
      onOpenChange(false);
    } catch (err) {
      dispatch({
        type: "uploadError",
        error: err instanceof Error ? err.message : t("editor.uploadFailed"),
      });
    }
  }

  const { file, preview, cropping, aspectRatio, crop, uploading, error } = state;

  function handleOpenChange(next: boolean) {
    if (!next) {
      if (inputRef.current) inputRef.current.value = "";
      dispatch({ type: "reset" });
    }
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("editor.uploadImage")}</DialogTitle>
        </DialogHeader>
        <Input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
        />
        {preview && (
          <div className="flex flex-col gap-2">
            <div className="flex max-h-80 justify-center overflow-auto rounded-md border p-2">
              {cropping ? (
                <ReactCrop
                  crop={crop}
                  onChange={(c) => dispatch({ type: "setCrop", crop: c })}
                  onComplete={(c) => dispatch({ type: "setCompletedCrop", completedCrop: c })}
                  aspect={aspectRatio}
                >
                  <img
                    ref={imgRef}
                    src={preview}
                    alt="Crop"
                    onLoad={() => dispatch({ type: "resetCrop" })}
                    className="max-w-full"
                  />
                </ReactCrop>
              ) : (
                <img src={preview} alt="Preview" className="max-h-64 object-contain" />
              )}
            </div>
            <div className="flex items-center gap-1">
              {cropping ? (
                <>
                  {ASPECT_PRESETS.map((preset) => (
                    <Button
                      key={preset.label}
                      type="button"
                      variant={aspectRatio === preset.value ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => dispatch({ type: "setAspect", aspectRatio: preset.value })}
                      disabled={uploading}
                    >
                      {preset.label === "free" ? t("editor.cropFree") : preset.label}
                    </Button>
                  ))}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => dispatch({ type: "cancelCrop" })}
                    disabled={uploading}
                  >
                    {t("editor.cancelCrop")}
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => dispatch({ type: "startCrop" })}
                  disabled={uploading}
                >
                  <CropIcon className="mr-1.5 size-4" />
                  {t("editor.cropImage")}
                </Button>
              )}
            </div>
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={uploading}
          >
            {t("postForm.cancel")}
          </Button>
          <Button type="button" onClick={handleUpload} disabled={!file || uploading}>
            {uploading ? (
              <>
                <SpinnerIcon className="mr-1.5 animate-spin" />
                {t("editor.uploading")}
              </>
            ) : (
              t("editor.uploadImage")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
