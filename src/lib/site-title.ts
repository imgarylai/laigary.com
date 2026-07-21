// Page-title formatting from the `title_template` site setting. The template
// uses `%s` as the page-title placeholder (same convention as the old site,
// e.g. `%s | Unconstrained`); a template without `%s` — or an empty one —
// falls back to `%s | <siteName>`.

export function formatPageTitle(template: string, pageTitle: string, siteName: string): string {
  const tpl = template.includes("%s") ? template : `%s | ${siteName}`;
  return tpl.replace("%s", pageTitle);
}
