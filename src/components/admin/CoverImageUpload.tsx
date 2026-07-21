import { useReducer, useRef } from "react";
import { ImageIcon, SpinnerIcon, TrashIcon } from "@phosphor-icons/react";
import ReactCrop, { centerCrop, makeAspectCrop, type Crop, type PixelCrop } from "react-image-crop";
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

const ASPECT_RATIO = 16 / 9;

function centerAspectCrop(mediaWidth: number, mediaHeight: number) {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 90 }, ASPECT_RATIO, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight,
  );
}

// The dialog's file / preview / crop / upload flags all reset together, so a
// reducer keeps those transitions in one place instead of a stack of useState
// setters that must be cleared in lockstep (mirrors ImageUploadDialog).
type CoverState = {
  open: boolean;
  file: File | null;
  preview: string | null;
  crop: Crop | undefined;
  completedCrop: PixelCrop | undefined;
  uploading: boolean;
  error: string | null;
};

const initialState: CoverState = {
  open: false,
  file: null,
  preview: null,
  crop: undefined,
  completedCrop: undefined,
  uploading: false,
  error: null,
};

type CoverAction =
  | { type: "open" }
  | { type: "close" }
  | { type: "selectFile"; file: File | null; preview: string | null }
  | { type: "setCrop"; crop: Crop }
  | { type: "setCompletedCrop"; completedCrop: PixelCrop }
  | { type: "uploadStart" }
  | { type: "uploadError"; error: string };

function reducer(state: CoverState, action: CoverAction): CoverState {
  switch (action.type) {
    case "open":
      return { ...state, open: true };
    case "close":
      // Full reset on close or after a successful upload.
      return initialState;
    case "selectFile":
      return {
        ...state,
        file: action.file,
        preview: action.preview,
        error: null,
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

// `brand` is the OG image's footer line — passed in from site_settings (via the
// form loader) so the preview stays in sync with the real SEO metadata instead
// of hardcoding the site name / url here.
function OGFallback({ title, brand }: { title: string; brand: string }) {
  return (
    <div className="flex aspect-video w-full flex-col justify-between bg-[#0a0a0a] p-6 text-white">
      <div
        className="leading-tight font-bold"
        style={{ fontSize: title.length > 40 ? "1rem" : "1.25rem" }}
      >
        {title || "Untitled"}
      </div>
      <div className="text-xs text-zinc-500">{brand}</div>
    </div>
  );
}

export function CoverImageUpload({
  value,
  onChange,
  title,
  ogBrand,
}: {
  value: string;
  onChange: (url: string) => void;
  title: string;
  // OG preview footer line, e.g. `${siteName} | ${siteHost}` from site_settings.
  ogBrand: string;
}) {
  const { t } = useI18n();
  const [state, dispatch] = useReducer(reducer, initialState);
  const inputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const { open, file, preview, crop, completedCrop, uploading, error } = state;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    dispatch({
      type: "selectFile",
      file: selected,
      preview: selected ? URL.createObjectURL(selected) : null,
    });
  }

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    dispatch({ type: "setCrop", crop: centerAspectCrop(width, height) });
  }

  function close() {
    if (inputRef.current) inputRef.current.value = "";
    dispatch({ type: "close" });
  }

  async function handleUpload() {
    if (!file || !completedCrop || !imgRef.current) return;
    dispatch({ type: "uploadStart" });
    try {
      const blob = await getCroppedBlob(imgRef.current, completedCrop);
      const croppedFile = new File([blob], file.name, { type: "image/jpeg" });
      const compressed = await compressImage(croppedFile);
      const url = await uploadFile(compressed);
      onChange(url);
      close();
    } catch (err) {
      dispatch({
        type: "uploadError",
        error: err instanceof Error ? err.message : t("editor.uploadFailed"),
      });
    }
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Button
          type="button"
          variant="outline"
          className="flex aspect-video h-auto flex-col items-center justify-center gap-1 border-dashed"
          onClick={() => dispatch({ type: "open" })}
        >
          <ImageIcon className="size-6 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {value ? t("postForm.changeCover") : t("postForm.uploadCover")}
          </span>
        </Button>

        <div className="relative overflow-hidden rounded-none border">
          {value ? (
            <>
              <img src={value} alt="Cover" className="aspect-video w-full object-cover" />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 size-7"
                onClick={() => onChange("")}
              >
                <TrashIcon className="size-3.5" />
              </Button>
            </>
          ) : (
            <OGFallback title={title} brand={ogBrand} />
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={(v) => (v ? dispatch({ type: "open" }) : close())}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("postForm.coverImage")}</DialogTitle>
          </DialogHeader>
          <Input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
          />
          {preview && (
            <div className="max-h-80 overflow-auto rounded-none border p-2">
              <ReactCrop
                crop={crop}
                onChange={(c) => dispatch({ type: "setCrop", crop: c })}
                onComplete={(c) => dispatch({ type: "setCompletedCrop", completedCrop: c })}
                aspect={ASPECT_RATIO}
              >
                <img
                  ref={imgRef}
                  src={preview}
                  alt="Crop"
                  onLoad={onImageLoad}
                  className="max-w-full"
                />
              </ReactCrop>
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={close} disabled={uploading}>
              {t("postForm.cancel")}
            </Button>
            <Button type="button" onClick={handleUpload} disabled={!completedCrop || uploading}>
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
    </>
  );
}
