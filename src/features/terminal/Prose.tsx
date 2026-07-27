import { memo, useMemo } from "react";
import { cn } from "@/lib/utils";

// Rendered-markdown body. Wraps the terminal `.tm-prose` retheme around HTML
// produced by the shared markdown pipeline (server-rendered string, injected via
// dangerouslySetInnerHTML). The `.tm-prose` rules must stay as CSS — they style
// the pipeline's <h2>/<p>/<ul>/<a> output, which are not React elements — but the
// container is componentised here so routes stop hand-writing the same
// className + dangerouslySetInnerHTML boilerplate.
//
// The memo and the useMemo both exist to stop React rewriting innerHTML when the
// HTML has not actually changed. React compares `dangerouslySetInnerHTML` by
// object identity, so a fresh `{ __html }` literal each render means an
// unconditional `innerHTML =` — tearing down and rebuilding the entire subtree.
// In the editor's live preview that fired on every keystroke and rebuilt ~500
// nodes each time, which cost more in layout than the markdown pipeline itself
// (#175). useMemo keeps the object stable when the component does re-render (a
// changed className, say); memo skips the render altogether when nothing moved.
export const Prose = memo(function Prose({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  const markup = useMemo(() => ({ __html: html }), [html]);
  return <div className={cn("tm-prose", className)} dangerouslySetInnerHTML={markup} />;
});
