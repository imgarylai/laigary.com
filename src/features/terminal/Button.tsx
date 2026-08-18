import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cn } from "@/lib/utils";

// Terminal-native button: a flat, square, bordered control in the `tm-*`
// palette, built directly on the Base UI button primitive. The frontend's only
// button — it owns its look outright instead of skinning a shadcn <Button>.
// `active` marks a pressed/selected state — used by the /labs playgrounds to
// build option groups (tone format, sort order) out of plain buttons instead of
// pulling in radio/switch controls the frontend does not otherwise have.
export function TmButton({
  size = "sm",
  active,
  className,
  ...props
}: ButtonPrimitive.Props & { size?: "sm" | "icon"; active?: boolean }) {
  return (
    <ButtonPrimitive
      data-slot="tm-button"
      data-active={active || undefined}
      aria-pressed={active}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-1 border border-tm-border bg-transparent text-sm whitespace-nowrap text-tm-muted transition-colors outline-none select-none",
        "hover:bg-tm-subtle hover:text-tm-fg",
        "focus-visible:border-tm-accent focus-visible:text-tm-fg",
        "data-active:border-tm-accent data-active:bg-tm-subtle data-active:text-tm-fg",
        "disabled:pointer-events-none disabled:opacity-50",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0",
        size === "sm" ? "h-7 px-2.5" : "size-8",
        className,
      )}
      {...props}
    />
  );
}
