import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useI18n } from "@/i18n/I18nProvider";

export type PaletteRow = {
  kind: "page" | "content";
  label: string;
  sub?: string;
  // Text cmdk filters against (title / slug / tags), on top of the label.
  haystack: string;
  onSelect: () => void;
};

// ⌘K command palette, built on shadcn's CommandDialog (cmdk) — filtering and
// keyboard navigation come from the library. Rows are grouped into pages and
// content (posts / notes); terminal styling is applied via `.tm-cmd` overrides.
export function CommandPalette({
  open,
  onOpenChange,
  rows,
  placeholder,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rows: PaletteRow[];
  placeholder: string;
}) {
  const { t } = useI18n();
  const pages = rows.filter((r) => r.kind === "page");
  const content = rows.filter((r) => r.kind === "content");

  const renderItem = (row: PaletteRow, i: number) => (
    <CommandItem
      key={`${row.kind}-${i}`}
      value={`${row.label} ${row.haystack}`}
      onSelect={() => {
        row.onSelect();
        onOpenChange(false);
      }}
    >
      <span className={row.kind === "content" ? "tm-cmd-label--content" : "tm-cmd-label"}>
        {row.label}
      </span>
      {row.sub && <span className="tm-cmd-sub">{row.sub}</span>}
    </CommandItem>
  );

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      className="tm-cmd"
      title="Command palette"
      description={placeholder}
    >
      <CommandInput placeholder={placeholder} />
      <CommandList>
        <CommandEmpty>{t("blog.search.noMatches")}</CommandEmpty>
        {pages.length > 0 && (
          <CommandGroup heading={t("blog.search.pages")}>{pages.map(renderItem)}</CommandGroup>
        )}
        {content.length > 0 && (
          <CommandGroup heading={t("blog.search.content")}>{content.map(renderItem)}</CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
