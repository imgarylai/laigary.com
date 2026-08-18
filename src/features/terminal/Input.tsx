import type { ComponentProps } from "react";
import { CaretDownIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

// Text entry for the /labs playgrounds. Styling is lifted from the ⌘K palette's
// input (CommandMenu.tsx) so the two feel like the same control: a bordered
// box, a `$` sigil, and a bare transparent field. The sigil is the terminal
// tell — it reads as a shell prompt rather than a web form.
export function TmInput({
  className,
  sigil = "$",
  ...props
}: ComponentProps<"input"> & { sigil?: string | null }) {
  return (
    <div className="flex h-9 items-center gap-2 border border-tm-border px-3 focus-within:border-tm-accent">
      {sigil ? <span className="shrink-0 text-sm text-tm-muted select-none">{sigil}</span> : null}
      <input
        className={cn(
          "w-full bg-transparent text-sm text-tm-fg outline-none placeholder:text-tm-muted disabled:opacity-50",
          className,
        )}
        {...props}
      />
    </div>
  );
}

// ponytail: a native <select>, not a headless combobox. The only place that
// needs it is the use-tw-zipcode demo, whose whole pitch is "build a dropdown"
// — swapping in a filter list would demo our UI instead of the package. Native
// also gets mobile pickers and keyboard/a11y for free. Reach for cmdk only if a
// list ever grows past a few dozen options.
export function TmSelect({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <div className="relative flex h-9 items-center border border-tm-border focus-within:border-tm-accent">
      <select
        className={cn(
          "w-full appearance-none bg-transparent px-3 pr-8 text-sm text-tm-fg outline-none disabled:opacity-50",
          // The popup list is painted by the OS, not by us: without an explicit
          // background the options inherit the page's dark surface in some
          // browsers and render unreadable.
          "[&>option]:bg-tm-bg [&>option]:text-tm-fg",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <CaretDownIcon
        aria-hidden
        className="pointer-events-none absolute right-2.5 size-3.5 text-tm-muted"
      />
    </div>
  );
}
