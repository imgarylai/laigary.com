import { useState } from "react";
import type { Editor } from "@tiptap/react";
import { YoutubeLogoIcon } from "@phosphor-icons/react";
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

export function YouTubeDialog({ editor }: { editor: Editor }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");

  function handleInsert() {
    if (url.trim()) {
      editor.chain().focus().setYoutubeVideo({ src: url.trim() }).run();
      setUrl("");
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            title={t("editor.embedYouTube")}
          />
        }
      >
        <YoutubeLogoIcon className="size-4" />
      </DialogTrigger>
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
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            {t("postForm.cancel")}
          </Button>
          <Button type="button" onClick={handleInsert} disabled={!url.trim()}>
            {t("editor.embed")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
