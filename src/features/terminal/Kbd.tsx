import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

// Terminal-native <kbd>. Replaces the borrowed shadcn `Kbd` — a small flat
// key cap in the `tm-*` palette. Frontend-owned so the module stays free of
// `@/components/ui`.
export function Kbd({ className, ...props }: ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="tm-kbd"
      className={cn(
        "pointer-events-none inline-flex h-5 min-w-5 items-center justify-center gap-1 border border-tm-border px-1 font-sans text-[11px] font-medium text-tm-muted select-none",
        className,
      )}
      {...props}
    />
  );
}
