// Extract level-2 ATX headings (`## …`) from markdown for a post/note table of
// contents. Fenced code blocks are skipped so a `## ` inside a snippet is not
// mistaken for a heading. Pure + dependency-free so it runs on server or client.
export function extractToc(markdown: string): string[] {
  const out: string[] = [];
  let inFence = false;
  for (const raw of markdown.split("\n")) {
    const line = raw.trimEnd();
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = /^##\s+(.+?)\s*#*\s*$/.exec(line);
    if (m) out.push(m[1]);
  }
  return out;
}
