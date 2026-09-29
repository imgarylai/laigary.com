import { useState } from "react";
import { CheckIcon, LinkIcon, XLogoIcon } from "@phosphor-icons/react";
import { useI18n } from "@/i18n/I18nProvider";

export function ArticleShare({ title, url }: { title: string; url: string }) {
  const { t } = useI18n();
  const [status, setStatus] = useState<"idle" | "copying" | "copied" | "error">("idle");
  const intent = new URL("https://x.com/intent/tweet");
  intent.searchParams.set("text", title);
  intent.searchParams.set("url", url);

  async function copyLink() {
    setStatus("copying");
    try {
      await navigator.clipboard.writeText(url);
      setStatus("copied");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="public-article-share" aria-label={t("public.shareArticle")}>
      <div className="public-share-row">
        <p className="public-share-label">{t("public.shareArticle")}</p>
        <div className="public-share-actions">
          <a
            className="public-share-button"
            href={intent.toString()}
            target="_blank"
            rel="noopener noreferrer"
          >
            <XLogoIcon size={17} aria-hidden="true" />
            {t("public.shareOnX")}
            <span className="sr-only"> {t("public.opensNewTab")}</span>
          </a>
          <button
            className="public-share-button"
            type="button"
            onClick={copyLink}
            disabled={status === "copying"}
          >
            {status === "copied" ? (
              <CheckIcon size={17} aria-hidden="true" />
            ) : (
              <LinkIcon size={17} aria-hidden="true" />
            )}
            {t(status === "copied" ? "public.linkCopied" : "public.copyLink")}
          </button>
        </div>
      </div>
      <p className="public-share-status" role="status">
        {status === "copied"
          ? t("public.copySuccess")
          : status === "error"
            ? t("public.copyManually")
            : ""}
      </p>
      {status === "error" && (
        <input
          className="public-share-url"
          aria-label={t("public.articleLink")}
          readOnly
          value={url}
          onFocus={(event) => event.currentTarget.select()}
          onClick={(event) => event.currentTarget.select()}
        />
      )}
    </section>
  );
}
