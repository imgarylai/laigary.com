// Internal helpers shared by the public read modules (blog.ts / interview.ts).
// Queries and the markdown renderer are loaded via dynamic import inside each
// helper so none of that server code reaches the client bundle.

import { z } from "zod";
import { socialUrl } from "@/lib/social";

// Default brand name when site_name is unset. Exported for testing.
export const DEFAULT_SITE_NAME = "Unconstrained";

// Exported for testing.
export const slugInput = (data: unknown) => z.object({ slug: z.string().min(1) }).parse(data);

export async function renderMd(md: string): Promise<string> {
  const { renderMarkdown } = await import("@/lib/markdown");
  return renderMarkdown(md);
}

// Head chrome for a content page: the browser-tab title (honoring the
// `title_template` setting — see lib/site-title) plus the site name for
// og:site_name. Fetches settings itself so detail server fns can build both
// in one place. Exported for testing.
export async function pageChrome(title: string): Promise<{ pageTitle: string; siteName: string }> {
  const { getSiteSettings } = await import("@/db/queries");
  const { formatPageTitle } = await import("@/lib/site-title");
  const settings = await getSiteSettings();
  const siteName = settings.site_name || DEFAULT_SITE_NAME;
  return { pageTitle: formatPageTitle(settings.title_template ?? "", title, siteName), siteName };
}

// Footer social links resolved to absolute hrefs via lib/social (settings
// store bare handles; unset ones come through as null and drop out in the
// footer). Exported for testing.
export function pickSocial(settings: Record<string, string>) {
  return {
    github: socialUrl("author_github", settings.author_github ?? ""),
    twitter: socialUrl("author_twitter", settings.author_twitter ?? ""),
    linkedin: socialUrl("author_linkedin", settings.author_linkedin ?? ""),
    email: settings.author_email ? `mailto:${settings.author_email}` : null,
  };
}
