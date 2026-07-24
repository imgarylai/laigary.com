import { cn } from "@/lib/utils";

// Rendered-markdown body. Wraps the terminal `.tm-prose` retheme around HTML
// produced by the shared markdown pipeline (server-rendered string, injected via
// dangerouslySetInnerHTML). The `.tm-prose` rules must stay as CSS — they style
// the pipeline's <h2>/<p>/<ul>/<a> output, which are not React elements — but the
// container is componentised here so routes stop hand-writing the same
// className + dangerouslySetInnerHTML boilerplate.
export function Prose({ html, className }: { html: string; className?: string }) {
  return <div className={cn("tm-prose", className)} dangerouslySetInnerHTML={{ __html: html }} />;
}
