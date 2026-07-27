import { memo, useState } from "react";
import type { Editor } from "@tiptap/react";
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

// Controlled, and rendered once by TiptapEditorImpl rather than owning a
// trigger of its own — the toolbar button and the `/youtube` slash command are
// two doors onto the same dialog. Mirrors how LinkDialog already works.
// Memoised: `editor` is stable and `onOpenChange` is a useState setter, so the
// only prop that ever changes is `open`. Without this the dialog's entire
// element tree — every child of DialogContent, built eagerly whether or not it
// is mounted — was reconstructed on each keystroke, because the document used
// to flow through React state (#175).
export const YouTubeDialog = memo(function YouTubeDialog({
  editor,
  open,
  onOpenChange,
}: {
  editor: Editor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useI18n();
  const [url, setUrl] = useState("");

  function handleInsert() {
    if (url.trim()) {
      editor.chain().focus().setYoutubeVideo({ src: url.trim() }).run();
      setUrl("");
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("editor.embedYouTube")}</DialogTitle>
        </DialogHeader>
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={t("editor.youtubeUrlPlaceholder")}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleInsert();
          }}
        />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("postForm.cancel")}
          </Button>
          <Button type="button" onClick={handleInsert} disabled={!url.trim()}>
            {t("editor.embed")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
