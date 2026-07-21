import { lazy, Suspense, useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Tiptap (with all its extensions and KaTeX) is heavy enough that bundling it
 * into Worker SSR pushes us past Cloudflare's 3 MiB free-plan limit. TanStack
 * Start has no `next/dynamic` equivalent, so we keep the editor entirely
 * client-side by lazy-importing the impl and only rendering it once mounted:
 * the server (and first client paint) shows the placeholder, and the heavy
 * chunk loads in the browser after hydration.
 */
const TiptapEditorImpl = lazy(() => import("./TiptapEditorImpl"));

const fallback = <Skeleton className="min-h-[500px] w-full rounded-md border" />;

export function TiptapEditor(props: { value: string; onChange: (value: string) => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return fallback;

  return (
    <Suspense fallback={fallback}>
      <TiptapEditorImpl {...props} />
    </Suspense>
  );
}
