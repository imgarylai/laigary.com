import { createServerFn } from "@tanstack/react-start";
import { DEFAULT_SITE_NAME, pageChrome, pickSocial, renderMd, slugInput } from "./_shared";

// Blog main-site read server functions. Route loaders call these; same split
// as the admin mutations — the exported `*Impl` functions hold the logic and
// are unit-tested against the better-sqlite3 harness, the createServerFn
// wrappers are the thin validated RPC boundary.

// Per-navigation shell data: brand name + footer social links. The command
// palette used to receive the whole post index here (pre-loaded on every
// navigation); it now searches posts on demand via `searchPostsFn`, so the
// shell stays lightweight.
export async function blogShellImpl() {
  const { getSiteSettings } = await import("@/db/queries");
  const settings = await getSiteSettings();
  return { siteName: settings.site_name || DEFAULT_SITE_NAME, social: pickSocial(settings) };
}

export const blogShellFn = createServerFn({ method: "GET" }).handler(blogShellImpl);

// Home: whoami/intro from settings + headline counts and latest-post date.
export async function homeDataImpl() {
  const { getSiteSettings, getPublishedPosts, getTagsWithCounts } = await import("@/db/queries");
  const [settings, { posts, total }, tags] = await Promise.all([
    getSiteSettings(),
    getPublishedPosts({ limit: 1 }),
    getTagsWithCounts(),
  ]);
  const whoami = [settings.author_name, settings.author_role, settings.author_location]
    .filter(Boolean)
    .join(" · ");
  const social = pickSocial(settings);
  const socialUrls = [social.github, social.twitter, social.linkedin].filter(
    (u): u is string => u !== null,
  );

  return {
    siteName: settings.site_name || DEFAULT_SITE_NAME,
    whoami: settings.whoami || whoami,
    intro: settings.site_description || "",
    postCount: total,
    tagCount: tags.length,
    latestDate: posts[0]?.date ?? null,
    // Absolute profile URLs for the home page's JSON-LD Person.sameAs.
    socialUrls,
  };
}

export const homeDataFn = createServerFn({ method: "GET" }).handler(homeDataImpl);

// Archive: full published list (blog scale is small); the client paginates and
// applies the `?tag=` filter from typed search params.
export async function postsDataImpl() {
  const { getPublishedPosts } = await import("@/db/queries");
  const { posts } = await getPublishedPosts({ limit: 500 });
  return { posts, ...(await pageChrome("Posts")) };
}

export const postsDataFn = createServerFn({ method: "GET" }).handler(postsDataImpl);

export async function postDataImpl(data: { slug: string }) {
  const { getPostBySlug, getAdjacentPosts, getSiteSettings } = await import("@/db/queries");
  const { extractToc } = await import("@/lib/toc");
  const { giscusFromSettings } = await import("@/lib/giscus");
  const { plainTextSummary, META_SUMMARY_MAX } = await import("@/lib/summary");
  const post = await getPostBySlug(data.slug);
  if (!post) return null;
  const html = await renderMd(post.contentMd);
  return {
    post,
    html,
    toc: extractToc(post.contentMd),
    adjacent: await getAdjacentPosts(data.slug),
    giscus: giscusFromSettings(await getSiteSettings()),
    // Meta/OG description: the excerpt, or a plain-text cut of the body so no
    // post ships without one.
    description: post.excerpt || plainTextSummary(html, META_SUMMARY_MAX),
    ...(await pageChrome(post.title)),
  };
}

export const postDataFn = createServerFn({ method: "GET" })
  .validator(slugInput)
  .handler(({ data }) => postDataImpl(data));

export async function tagsDataImpl() {
  const { getTagsWithCounts } = await import("@/db/queries");
  return { tags: await getTagsWithCounts(), ...(await pageChrome("Tags")) };
}

export const tagsDataFn = createServerFn({ method: "GET" }).handler(tagsDataImpl);

// Unified topic page: every published post AND interview note carrying one tag
// (posts and notes share the tags table). Unknown slugs, and tags whose content
// is all drafts, come back null (→ 404) — matching what the sitemap advertises.
export async function tagDataImpl(data: { slug: string }) {
  const { getTagBySlug, getPublishedPosts, getPublishedNotesByTag } = await import("@/db/queries");
  const tag = await getTagBySlug(data.slug);
  if (!tag) return null;
  const [{ posts }, notes] = await Promise.all([
    getPublishedPosts({ tag: data.slug, limit: 500 }),
    getPublishedNotesByTag(data.slug),
  ]);
  if (posts.length === 0 && notes.length === 0) return null;
  return {
    tag: { name: tag.name, slug: tag.slug },
    posts,
    notes,
    ...(await pageChrome(`#${tag.name}`)),
  };
}

export const tagDataFn = createServerFn({ method: "GET" })
  .validator(slugInput)
  .handler(({ data }) => tagDataImpl(data));

export async function pageDataImpl(data: { slug: string }) {
  const { getPageBySlug } = await import("@/db/queries");
  const { plainTextSummary, META_SUMMARY_MAX } = await import("@/lib/summary");
  const page = await getPageBySlug(data.slug);
  if (!page) return null;
  const html = await renderMd(page.contentMd);
  return {
    page: { slug: page.slug, title: page.title },
    html,
    description: plainTextSummary(html, META_SUMMARY_MAX),
    ...(await pageChrome(page.title)),
  };
}

export const pageDataFn = createServerFn({ method: "GET" })
  .validator(slugInput)
  .handler(({ data }) => pageDataImpl(data));
