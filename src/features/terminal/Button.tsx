import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cn } from "@/lib/utils";

// Terminal-native button. Replaces the shadcn <Button variant="outline"> +
// `.tm-btn` override that the frontend used to borrow — a flat, square,
// bordered control in the `tm-*` palette. Built directly on the Base UI button
// primitive so the frontend no longer reaches into `@/components/ui`.
export function TmButton({
  size = "sm",
  className,
  ...props
}: ButtonPrimitive.Props & { size?: "sm" | "icon" }) {
  return (
    <ButtonPrimitive
      data-slot="tm-button"
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-1 border border-tm-border bg-transparent text-xs whitespace-nowrap text-tm-muted transition-colors outline-none select-none",
        "hover:bg-tm-subtle hover:text-tm-fg",
        "focus-visible:border-tm-accent focus-visible:text-tm-fg",
        "disabled:pointer-events-none disabled:opacity-50",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0",
        size === "sm" ? "h-7 px-2.5" : "size-8",
        className,
      )}
      {...props}
    />
  );
}
