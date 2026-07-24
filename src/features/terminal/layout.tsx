import { forwardRef, type AnchorHTMLAttributes, type ReactNode } from "react";
import { createLink } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

// Shared terminal layout components. Layout/spacing/sizing are Tailwind
// utilities; terminal colours come from the `tm-*` utilities registered in
// @theme. These wrap the patterns that repeat across pages so the utility
// strings live in one place.

// Page container. `narrow` is the reading width (posts / pages / notes).
export function TmPage({ narrow = false, children }: { narrow?: boolean; children: ReactNode }) {
  return (
    <div
      className={cn(
        "mx-auto px-8 pt-8 pb-20 max-sm:px-4 max-sm:pt-5 max-sm:pb-16",
        narrow ? "max-w-2xl" : "max-w-3xl",
      )}
    >
      {children}
    </div>
  );
}

// The stats line ("N posts · M tags · updated …"). Children are the spans and
// `·` separators.
export function TmMeta({ children }: { children: ReactNode }) {
  return (
    <div className="my-1 flex flex-wrap items-baseline gap-4 text-sm text-tm-muted">{children}</div>
  );
}

// Empty-state line ("// no posts match.").
export function TmEmpty({ children }: { children: ReactNode }) {
  return <div className="py-6 text-sm text-tm-muted">{children}</div>;
}

// Directory-listing row (home + interview home). A three-column link; caller
// supplies the label / description / meta spans.
const TmDirLinkBase = forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement>>(
  ({ className, ...props }, ref) => (
    <a
      ref={ref}
      className={cn(
        "grid grid-cols-[150px_1fr_auto] items-baseline gap-x-3.5 gap-y-0 border-b border-dashed border-tm-border px-2 py-3.5 text-tm-fg no-underline hover:bg-tm-subtle max-sm:grid-cols-[1fr_auto] max-sm:gap-y-1",
        className,
      )}
      {...props}
    />
  ),
);
TmDirLinkBase.displayName = "TmDirLinkBase";
export const TmDirLink = createLink(TmDirLinkBase);

// The three cells inside a TmDirLink (label · description · meta).
export function TmDirCells({
  label,
  desc,
  meta,
}: {
  label: ReactNode;
  desc: ReactNode;
  meta: ReactNode;
}) {
  return (
    <>
      <span className="text-base text-tm-accent">{label}</span>
      <span className="text-sm text-tm-fg max-sm:col-span-full">{desc}</span>
      <span className="whitespace-nowrap text-xs text-tm-muted">{meta}</span>
    </>
  );
}

// Compact row (archive posts + interview notes): date · title · reading time.
const TmRowLinkBase = forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement>>(
  ({ className, ...props }, ref) => (
    <a
      ref={ref}
      className={cn(
        "grid grid-cols-[60px_1fr_48px] items-baseline gap-3 border-b border-dashed border-tm-border px-2 py-2 text-sm text-tm-fg no-underline hover:bg-tm-subtle max-sm:grid-cols-[52px_1fr] max-sm:gap-x-2.5 max-sm:gap-y-0.5",
        className,
      )}
      {...props}
    />
  ),
);
TmRowLinkBase.displayName = "TmRowLinkBase";
export const TmRowLink = createLink(TmRowLinkBase);

// The three cells inside a TmRowLink (date · title · reading time). The reading
// time collapses on mobile with the row's third column.
export function TmRowCells({
  date,
  title,
  read,
}: {
  date: ReactNode;
  title: ReactNode;
  read: ReactNode;
}) {
  return (
    <>
      <span className="text-tm-muted">{date}</span>
      <span>{title}</span>
      <span className="text-right text-xs text-tm-dim max-sm:hidden">{read}</span>
    </>
  );
}
