import type { ComponentProps, ReactNode } from "react";
import { Command as CommandPrimitive } from "cmdk";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

// Terminal command-palette primitives. A purpose-built ⌘K menu on cmdk + the
// Base UI dialog primitive, styled directly in the `tm-*` palette. Replaces the
// borrowed shadcn `command` (which pulled in shadcn's dialog + input-group and
// then had to be re-skinned through a `.tm-cmd` override). The public shape —
// CommandDialog / Input / List / Group / Item — is what CommandPalette consumes.

export function CommandDialog({
  open,
  onOpenChange,
  title,
  description,
  shouldFilter,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  // Forwarded to cmdk's root. Pass `false` when the caller drives the visible
  // rows itself (the frontend filters pages locally and fetches content).
  shouldFilter?: boolean;
  children: ReactNode;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="public-overlay fixed inset-0 z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Popup className="public-overlay fixed top-[18vh] left-1/2 z-50 w-full max-w-[calc(100%-2rem)] -translate-x-1/2 overflow-hidden border border-site-rule bg-site-surface outline-none duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 sm:max-w-lg">
          <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            {description}
          </DialogPrimitive.Description>
          {/* CommandPrimitive is the cmdk root that provides the store consumed
              by Input/List/Item — without it they crash on mount. */}
          <CommandPrimitive
            shouldFilter={shouldFilter}
            className="flex size-full flex-col overflow-hidden bg-site-surface text-site-ink"
          >
            {children}
          </CommandPrimitive>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export function CommandInput({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div
      data-slot="command-input-wrapper"
      className="flex h-14 items-center gap-2 border-b border-site-rule px-3"
    >
      <MagnifyingGlassIcon className="size-4 shrink-0 text-site-muted" />
      <CommandPrimitive.Input
        className={cn(
          "w-full bg-transparent text-sm text-site-ink outline-none placeholder:text-site-muted disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    </div>
  );
}

export function CommandList({ className, ...props }: ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      className={cn("max-h-[55dvh] overflow-x-hidden overflow-y-auto p-1 outline-none", className)}
      {...props}
    />
  );
}

export function CommandGroup({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      className={cn(
        "overflow-hidden [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-site-muted",
        className,
      )}
      {...props}
    />
  );
}

export function CommandItem({ className, ...props }: ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      className={cn(
        "flex cursor-default items-center gap-2 border-l-2 border-l-transparent px-3 py-3 text-sm text-site-ink outline-none select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-[selected=true]:border-l-site-accent data-[selected=true]:bg-site-selection data-[selected=true]:text-site-ink [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}
