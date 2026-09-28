import { useState, type ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { ActionResult } from "@/server/admin/_shared";

/** Shared delete lifecycle; callers retain their RPC, copy and usage warnings. */
export function DeleteContentDialog({
  open,
  onOpenChange,
  onDelete,
  labels,
  trigger,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => Promise<ActionResult>;
  labels: {
    title: string;
    description: string;
    cancel: string;
    confirm: string;
    pending: string;
    success: string;
    failure: string;
  };
  trigger?: ReactNode;
  children?: ReactNode;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const result = await onDelete();
      if (!result.ok) {
        toast.error(labels.failure);
        return;
      }
    } catch {
      // RPC/network failures throw instead of returning an ActionResult.
      toast.error(labels.failure);
      return;
    } finally {
      setDeleting(false);
    }
    toast.success(labels.success);
    onOpenChange(false);
    // A successful write and a loader refresh are separate outcomes: a failed
    // refresh must not tell the author that the deletion itself failed.
    void router.invalidate();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && (
        <DialogTrigger render={<Button variant="destructive" size="sm" />}>{trigger}</DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{labels.title}</DialogTitle>
          <DialogDescription>{labels.description}</DialogDescription>
        </DialogHeader>
        {children}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {labels.cancel}
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? labels.pending : labels.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
