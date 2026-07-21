import { useCallback, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { ImageIcon, SpinnerIcon, CropIcon } from "@phosphor-icons/react";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/I18nProvider";
import { uploadFile, getCroppedBlob, compressImage } from "@/lib/upload-client";

export function ImageUploadDialog({ editor }: { editor: Editor }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [cropping, setCropping] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<number | undefined>(undefined);
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
    setCropping(false);
    setCrop(undefined);
    setCompletedCrop(undefined);
    if (selected) {
      const url = URL.createObjectURL(selected);
      setPreview(url);
    } else {
      setPreview(null);
    }
  }

  function reset() {
    setFile(null);
    setPreview(null);
    setError(null);
    setUploading(false);
    setCropping(false);
    setAspectRatio(undefined);
    setCrop(undefined);
    setCompletedCrop(undefined);
    if (inputRef.current) inputRef.current.value = "";
  }

  const onImageLoad = useCallback(() => {
    // Reset crop when new image loads
    setCrop(undefined);
    setCompletedCrop(undefined);
  }, []);

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      let fileToUpload: File;

      if (cropping && completedCrop && imgRef.current) {
        const blob = await getCroppedBlob(imgRef.current, completedCrop);
        const croppedFile = new File([blob], file.name, { type: "image/jpeg" });
        fileToUpload = await compressImage(croppedFile);
      } else {
        fileToUpload = await compressImage(file);
      }

      const url = await uploadFile(fileToUpload);
      editor.chain().focus().setImage({ src: url }).run();
      reset();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("editor.uploadFailed"));
      setUploading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            title={t("editor.uploadImage")}
          />
        }
      >
        <ImageIcon className="size-4" />
      </DialogTrigger>
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
                  onChange={setCrop}
                  onComplete={setCompletedCrop}
                  aspect={aspectRatio}
                >
                  <img
                    ref={imgRef}
                    src={preview}
                    alt="Crop"
                    onLoad={onImageLoad}
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
                  {(
                    [
                      { label: t("editor.cropFree"), value: undefined },
                      { label: "1:1", value: 1 },
                      { label: "16:9", value: 16 / 9 },
                      { label: "4:3", value: 4 / 3 },
                    ] as const
                  ).map((preset) => (
                    <Button
                      key={preset.label}
                      type="button"
                      variant={aspectRatio === preset.value ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => {
                        setAspectRatio(preset.value);
                        setCrop(undefined);
                        setCompletedCrop(undefined);
                      }}
                      disabled={uploading}
                    >
                      {preset.label}
                    </Button>
                  ))}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCropping(false);
                      setAspectRatio(undefined);
                      setCrop(undefined);
                      setCompletedCrop(undefined);
                    }}
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
                  onClick={() => setCropping(true)}
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
            onClick={() => setOpen(false)}
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
