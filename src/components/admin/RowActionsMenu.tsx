import type { ReactNode } from "react";
import { DotsThreeIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * The `⋯` menu at the end of a list row.
 *
 * Every row used to carry a filled red Delete button, which made the most
 * destructive and least frequent action the loudest element on the page — once
 * per row (#180). Behind a menu it is still one click from reach, and the
 * confirmation dialog is still the real safety net.
 *
 * `stopPropagation` because the row itself navigates to the editor: without it,
 * opening this menu would also open the post.
 */
export function RowActionsMenu({ label, children }: { label: string; children: ReactNode }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={label}
            title={label}
            onClick={(event) => event.stopPropagation()}
          />
        }
      >
        <DotsThreeIcon className="size-4" weight="bold" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
