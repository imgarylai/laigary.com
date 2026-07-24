// Test-data factories: counter-based builders over the query layer's creators,
// so tests seed rows with one call and only spell out the fields they assert
// on. Query modules are loaded via dynamic import to respect the test files'
// drizzle mock ordering. Use together with `setupTestDb()`.

let n = 0;
const uniq = () => ++n;

export async function seedTag(over: Partial<{ name: string; slug: string }> = {}) {
  const { createTag } = await import("@/db/queries");
  const i = uniq();
  return createTag({ name: `Tag ${i}`, slug: `tag-${i}`, ...over });
}

export async function seedSection(
  over: Partial<{
    slug: string;
    label: string;
    blurb: string;
    icon: string;
    sortOrder: number;
  }> = {},
) {
  const { createSection } = await import("@/db/queries");
  const i = uniq();
  return createSection({
    slug: `section-${i}`,
    label: `Section ${i}`,
    blurb: "",
    icon: "",
    ...over,
  });
}

export async function seedNote(
  sectionId: string,
  over: Partial<{
    slug: string;
    title: string;
    contentMd: string;
    status: "draft" | "published";
    pinned: boolean;
    tagIds: string[];
  }> = {},
) {
  const { createNote } = await import("@/db/queries");
  const i = uniq();
  return createNote({
    slug: `note-${i}`,
    sectionId,
    title: `Note ${i}`,
    contentMd: `Body of note ${i}`,
    status: "published",
    ...over,
  });
}

export async function seedPost(
  over: Partial<{
    title: string;
    slug: string;
    contentMd: string;
    excerpt: string;
    coverImageUrl: string;
    status: "draft" | "published";
    tagIds: string[];
  }> = {},
) {
  const { createPost } = await import("@/db/queries");
  const i = uniq();
  return createPost({
    title: `Post ${i}`,
    slug: `post-${i}`,
    contentMd: `Body of post ${i}`,
    status: "published",
    ...over,
  });
}

export async function seedPage(
  over: Partial<{ slug: string; title: string; contentMd: string }> = {},
) {
  const { upsertPage } = await import("@/db/queries");
  const i = uniq();
  const { slug = `page-${i}`, title = `Page ${i}`, contentMd = `Body of page ${i}` } = over;
  return upsertPage(slug, { title, contentMd });
}

export async function seedUpload(
  over: Partial<{
    id: string;
    r2Key: string;
    originalName: string;
    contentType: string;
    sizeBytes: number;
  }> = {},
) {
  const { recordUpload } = await import("@/db/queries");
  const i = uniq();
  const input = {
    id: crypto.randomUUID(),
    r2Key: `uploads/file-${i}.png`,
    originalName: `file-${i}.png`,
    contentType: "image/png",
    sizeBytes: 1024,
    ...over,
  };
  await recordUpload(input);
  return input;
}
