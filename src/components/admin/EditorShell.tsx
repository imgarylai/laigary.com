import { type ReactNode, useEffect, useState } from "react";
import { GearSixIcon, EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useI18n } from "@/i18n/I18nProvider";

/**
 * Frame shared by the post and note editors.
 *
 * Everything that is not the article — slug, excerpt, status, tags, cover —
 * moves into a side sheet, so writing starts at the top of the page instead of
 * roughly 900px down past a stack of form fields. The action bar sticks to the
 * top so Save stays reachable without scrolling past a long document, and the
 * preview stops being permanent: closed, the writing column gets a comfortable
 * measure; opened, it takes the full width it needs.
 *
 * Preview state lives here rather than inside the editor because the bar owns
 * the toggle and the column width depends on it. Children get it back through a
 * render prop, which keeps it out of the form's props.
 */
export function EditorShell({
  heading,
  settingsLabel,
  settings,
  actions,
  children,
}: {
  /** What is being edited — the bar's only text, since the page has no h1. */
  heading: string;
  settingsLabel: string;
  settings: ReactNode;
  /** Save / cancel / view-live, composed by the form. */
  actions: ReactNode;
  children: (state: { showPreview: boolean }) => ReactNode;
}) {
  const { t } = useI18n();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // ⌘⇧P / Ctrl+Shift+P toggles the preview. Bound on window rather than the
  // editor so it works with focus anywhere on the page — including in the
  // settings sheet.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        setShowPreview((prev) => !prev);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      {/* -mx-6/-mt-6 cancels the admin layout's padding so the bar spans the
          full content width and sits flush against the header above it. */}
      <div className="sticky top-0 z-20 -mx-6 -mt-6 mb-8 flex flex-wrap items-center gap-2 border-b bg-background px-6 py-2.5">
        <span className="text-sm font-medium">{heading}</span>

        <div className="ml-auto flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview((prev) => !prev)}
            title={`${t("postForm.showPreview")} (⌘⇧P)`}
          >
            {showPreview ? <EyeSlashIcon className="size-4" /> : <EyeIcon className="size-4" />}
            {showPreview ? t("postForm.hidePreview") : t("postForm.showPreview")}
          </Button>

          <Button type="button" variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
            <GearSixIcon className="size-4" />
            {settingsLabel}
          </Button>

          {actions}
        </div>
      </div>

      {/* Full width while the preview is up, a readable measure otherwise. Code
          blocks are what need the width, and they are why 46rem rather than the
          65ch a prose-only editor would use. */}
      <div className={showPreview ? "w-full" : "mx-auto w-full max-w-[46rem]"}>
        {children({ showPreview })}
      </div>

      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{settingsLabel}</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-6 px-4 pb-8">{settings}</div>
        </SheetContent>
      </Sheet>
    </>
  );
}
