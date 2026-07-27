import { Button } from "@/components/ui/button";

export function ToolbarButton({
  onClick,
  isActive,
  disabled,
  children,
  title,
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <Button
      type="button"
      variant={isActive ? "secondary" : "ghost"}
      size="icon"
      className="size-7"
      // These are toggles, so say so: until now "bold is on" was conveyed by
      // background colour alone, which a screen reader cannot report. Buttons
      // that never toggle (the `/` hint) pass no isActive and stay plain.
      aria-pressed={isActive}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {children}
    </Button>
  );
}
