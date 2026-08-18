import { useState, type ReactNode } from "react";
import { CheckIcon, CopyIcon } from "@phosphor-icons/react";
import { AsciiRule, PromptLine, TmButton, TmMeta, TmPage } from "@/features/terminal";
import { useI18n } from "@/i18n/I18nProvider";
import { FS_BLOG } from "@/lib/fsmap";
import { npmUrl, repoUrl, type Lab } from "@/lib/labs";

const EXT_LINK = "text-tm-muted no-underline hover:text-tm-accent";

// Shared chrome for a /labs demo page: prompt line, links, then whatever the
// page passes as children (intro → playground → LabCode, in that order). The
// consistency the section promises lives here and in the terminal primitives —
// each playground below it is free-form, because four demos of four unrelated
// packages have nothing real to share beyond this frame.
export function LabPage({ lab, children }: { lab: Lab; children: ReactNode }) {
  const { t } = useI18n();
  return (
    <TmPage narrow>
      <PromptLine>{FS_BLOG.lab.prompt({ slug: lab.slug })}</PromptLine>
      <TmMeta>
        <a href={npmUrl(lab.pkg)} target="_blank" rel="noreferrer" className={EXT_LINK}>
          {t("blog.labs.npmLabel")}
        </a>
        <a href={repoUrl(lab.pkg)} target="_blank" rel="noreferrer" className={EXT_LINK}>
          {t("blog.labs.sourceLabel")}
        </a>
        {lab.docs ? (
          <a href={lab.docs} target="_blank" rel="noreferrer" className={EXT_LINK}>
            {t("blog.labs.docsLabel")}
          </a>
        ) : null}
      </TmMeta>
      <AsciiRule className="mt-3 mb-4" />
      {children}
    </TmPage>
  );
}

// Intro paragraph(s) above the playground.
export function LabIntro({ children }: { children: ReactNode }) {
  return <div className="mb-6 space-y-3 text-sm leading-relaxed text-tm-muted">{children}</div>;
}

// A labelled block inside a playground (the input row, the output, an option
// group). `label` is rendered as a comment so the whole playground reads as one
// annotated snippet rather than a form.
export function LabField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="text-xs text-tm-dim select-none">{`// ${label}`}</div>
      {children}
    </div>
  );
}

// A horizontal run of TmButtons acting as a radio group / toggle set.
export function LabOptions({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-1.5">{children}</div>;
}

// The call the playground above is actually making, with a copy button.
//
// The point of passing `code` in rather than hardcoding a snippet: every page
// builds this string from the same state it feeds to the package, so the
// snippet cannot drift from what the demo does. If the package's API changes,
// the playground stops typechecking and the snippet is fixed with it.
export function LabCode({ code }: { code: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  return (
    <div className="mt-8">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs text-tm-dim select-none">{"// the call above"}</span>
        <TmButton
          onClick={() => {
            void navigator.clipboard.writeText(code).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            });
          }}
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
          {copied ? t("blog.labs.copied") : t("blog.labs.copy")}
        </TmButton>
      </div>
      <div className="tm-code">
        <pre>
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}
