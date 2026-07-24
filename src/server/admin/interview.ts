import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { toFailure, type ActionResult } from "./_shared";

// Queries are loaded via dynamic import inside each Impl (never a static
// top-level import) so these client-imported server functions don't pull the
// D1/`cloudflare:workers` query modules into the client bundle.

const slug = z
  .string()
  .min(1)
  .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens");

// --- Sections ---

export const sectionCreateSchema = z.object({
  slug,
  label: z.string().min(1),
  blurb: z.string(),
  icon: z.string(),
  sortOrder: z.number().int().optional(),
});
export type SectionCreateInput = z.infer<typeof sectionCreateSchema>;

export const sectionUpdateSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).optional(),
  blurb: z.string().optional(),
  icon: z.string().optional(),
  sortOrder: z.number().int().optional(),
});
export type SectionUpdateInput = z.infer<typeof sectionUpdateSchema>;

// --- Notes ---

export const noteCreateSchema = z.object({
  slug,
  sectionId: z.string().min(1),
  title: z.string().min(1).max(255),
  contentMd: z.string().optional(),
  status: z.enum(["draft", "published"]).optional(),
  pinned: z.boolean().optional(),
  tagIds: z.array(z.string()).optional(),
});
export type NoteCreateInput = z.infer<typeof noteCreateSchema>;

// sectionId is intentionally not updatable (matches the query type).
export const noteUpdateSchema = z.object({
  id: z.string().min(1),
  slug: slug.optional(),
  title: z.string().min(1).max(255).optional(),
  contentMd: z.string().optional(),
  status: z.enum(["draft", "published"]).optional(),
  pinned: z.boolean().optional(),
  tagIds: z.array(z.string()).optional(),
});
export type NoteUpdateInput = z.infer<typeof noteUpdateSchema>;

export const idSchema = z.object({ id: z.string().min(1) });

type Ref = { id: string; slug: string };

export async function createSectionImpl(input: SectionCreateInput): Promise<ActionResult<Ref>> {
  try {
    const { createSection } = await import("@/db/queries");
    return { ok: true, data: await createSection(input) };
  } catch (err) {
    return toFailure(err);
  }
}

export async function updateSectionImpl(input: SectionUpdateInput): Promise<ActionResult> {
  const { id, ...rest } = input;
  try {
    const { updateSection } = await import("@/db/queries");
    await updateSection(id, rest);
    return { ok: true };
  } catch (err) {
    return toFailure(err);
  }
}

export async function deleteSectionImpl(input: { id: string }): Promise<ActionResult> {
  try {
    const { deleteSection } = await import("@/db/queries");
    await deleteSection(input.id);
    return { ok: true };
  } catch (err) {
    return toFailure(err);
  }
}

export async function createNoteImpl(input: NoteCreateInput): Promise<ActionResult<Ref>> {
  try {
    const { createNote } = await import("@/db/queries");
    return { ok: true, data: await createNote(input) };
  } catch (err) {
    return toFailure(err);
  }
}

export async function updateNoteImpl(input: NoteUpdateInput): Promise<ActionResult> {
  const { id, ...rest } = input;
  try {
    const { updateNote } = await import("@/db/queries");
    await updateNote(id, rest);
    return { ok: true };
  } catch (err) {
    return toFailure(err);
  }
}

export async function deleteNoteImpl(input: { id: string }): Promise<ActionResult> {
  try {
    const { deleteNote } = await import("@/db/queries");
    await deleteNote(input.id);
    return { ok: true };
  } catch (err) {
    return toFailure(err);
  }
}

export const createSectionFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => sectionCreateSchema.parse(data))
  .handler(({ data }) => createSectionImpl(data));

export const updateSectionFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => sectionUpdateSchema.parse(data))
  .handler(({ data }) => updateSectionImpl(data));

export const deleteSectionFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => idSchema.parse(data))
  .handler(({ data }) => deleteSectionImpl(data));

export const createNoteFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => noteCreateSchema.parse(data))
  .handler(({ data }) => createNoteImpl(data));

export const updateNoteFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => noteUpdateSchema.parse(data))
  .handler(({ data }) => updateNoteImpl(data));

export const deleteNoteFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => idSchema.parse(data))
  .handler(({ data }) => deleteNoteImpl(data));
