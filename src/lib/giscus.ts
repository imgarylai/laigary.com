// giscus (GitHub Discussions comments) configuration. Stored as four
// site_settings keys so enabling/disabling comments is a settings change, not
// a deploy; the IDs come from https://giscus.app once Discussions are enabled
// on the target repository.

export type GiscusConfig = {
  repo: string;
  repoId: string;
  category: string;
  categoryId: string;
};

// All four keys must be present for the widget to render; a partial config
// resolves to null and the post page simply omits comments.
export function giscusFromSettings(settings: Record<string, string>): GiscusConfig | null {
  const repo = settings.giscus_repo ?? "";
  const repoId = settings.giscus_repo_id ?? "";
  const category = settings.giscus_category ?? "";
  const categoryId = settings.giscus_category_id ?? "";
  if (!repo || !repoId || !category || !categoryId) return null;
  return { repo, repoId, category, categoryId };
}
