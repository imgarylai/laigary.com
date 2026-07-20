import { useCallback, useRef, useState } from "react";
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
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    setError(null);
    setCrop(undefined);
    setCompletedCrop(undefined);
    setPreview(selected ? URL.createObjectURL(selected) : null);
  }

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height));
  }, []);

  function reset() {
    setFile(null);
    setPreview(null);
    setError(null);
    setUploading(false);
    setCrop(undefined);
    setCompletedCrop(undefined);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleUpload() {
    if (!file || !completedCrop || !imgRef.current) return;
    setUploading(true);
    setError(null);
    try {
      const blob = await getCroppedBlob(imgRef.current, completedCrop);
      const croppedFile = new File([blob], file.name, { type: "image/jpeg" });
      const compressed = await compressImage(croppedFile);
      const url = await uploadFile(compressed);
      onChange(url);
      reset();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("editor.uploadFailed"));
      setUploading(false);
    }
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Button
          type="button"
          variant="outline"
          className="flex aspect-video h-auto flex-col items-center justify-center gap-1 border-dashed"
          onClick={() => setOpen(true)}
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

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) reset();
        }}
      >
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
                onChange={setCrop}
                onComplete={setCompletedCrop}
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
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={uploading}
            >
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
