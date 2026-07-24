import { useForm, Controller } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { ArrowSquareOutIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useI18n } from "@/i18n/I18nProvider";
import { useSaveShortcut } from "@/hooks/use-save-shortcut";
import { slugify } from "@/lib/slug";
import { TagsCombobox, type TagOption } from "./TagsCombobox";
import { TiptapEditor } from "./TiptapEditor";
import { createNoteFn, updateNoteFn } from "@/server/admin/interview";

const noteFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  sectionId: z.string().min(1, "Section is required"),
  contentMd: z.string(),
  status: z.enum(["draft", "published"]),
  pinned: z.boolean(),
  tagIds: z.array(z.string()),
});
type NoteFormValues = z.infer<typeof noteFormSchema>;

type NoteInit = {
  id: string;
  slug: string;
  sectionId: string;
  title: string;
  contentMd: string;
  status: "draft" | "published";
  pinned: boolean;
  tagIds: string[];
};

// Interview note editor — posts-like, but scoped to a section (the section is
// fixed after creation, matching the update query which can't move a note).
export function NoteForm({
  note,
  sections,
  tags,
}: {
  note?: NoteInit;
  sections: { id: string; label: string; slug: string }[];
  tags: TagOption[];
}) {
  const navigate = useNavigate();
  const router = useRouter();
  const { t } = useI18n();
  const isEdit = !!note;

  const form = useForm<NoteFormValues>({
    resolver: standardSchemaResolver(noteFormSchema),
    defaultValues: note ?? {
      title: "",
      slug: "",
      sectionId: sections[0]?.id ?? "",
      contentMd: "",
      status: "draft",
      pinned: false,
      tagIds: [],
    },
  });

  function handleTitleChange(title: string) {
    if (!isEdit && !form.formState.dirtyFields.slug) {
      form.setValue("slug", slugify(title));
    }
  }

  const submit = form.handleSubmit(async (values) => {
    // Split the two paths so the create result's `data` narrows (update returns
    // no data, so a shared union would drop `.data`).
    if (note) {
      const result = await updateNoteFn({
        data: {
          id: note.id,
          slug: values.slug,
          title: values.title,
          contentMd: values.contentMd,
          status: values.status,
          pinned: values.pinned,
          tagIds: values.tagIds,
        },
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(t("admin.noteUpdated"));
      router.invalidate();
    } else {
      const result = await createNoteFn({ data: values });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(t("admin.noteCreated"));
      navigate({ to: "/admin/interview/notes/$noteId/edit", params: { noteId: result.data.id } });
    }
  });

  useSaveShortcut(() => {
    if (!form.formState.isSubmitting) submit();
  });

  const section = sections.find((s) => s.id === note?.sectionId);
  const sectionLabel = section?.label ?? "";
  // A published note has a live public page; link straight to it so the author
  // can preview without going back to the list. Drafts have no public page.
  const canPreview = isEdit && note?.status === "published" && !!section && !!note?.slug;

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <Controller
          control={form.control}
          name="title"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel htmlFor="note-title">{t("noteForm.title")}</FieldLabel>
              <Input
                id="note-title"
                {...field}
                onChange={(e) => {
                  field.onChange(e);
                  handleTitleChange(e.target.value);
                }}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="slug"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel htmlFor="note-slug">{t("noteForm.slug")}</FieldLabel>
              <Input id="note-slug" {...field} />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="note-section">{t("noteForm.section")}</FieldLabel>
          {isEdit ? (
            // Section is fixed after creation.
            <Input id="note-section" value={sectionLabel} readOnly disabled />
          ) : (
            <Controller
              control={form.control}
              name="sectionId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={(v) => field.onChange(v)}>
                  <SelectTrigger id="note-section">
                    <SelectValue placeholder={t("noteForm.sectionPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          )}
        </Field>
        <Controller
          control={form.control}
          name="status"
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor="note-status">{t("noteForm.status")}</FieldLabel>
              <Select value={field.value} onValueChange={(v) => field.onChange(v)}>
                <SelectTrigger id="note-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">{t("postForm.draft")}</SelectItem>
                  <SelectItem value="published">{t("postForm.published")}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          )}
        />
      </div>

      <Controller
        control={form.control}
        name="pinned"
        render={({ field }) => (
          <Field>
            <div className="flex items-center gap-3">
              <Switch
                id="note-pinned"
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked)}
              />
              <FieldLabel htmlFor="note-pinned">{t("noteForm.pinned")}</FieldLabel>
            </div>
          </Field>
        )}
      />

      <Controller
        control={form.control}
        name="tagIds"
        render={({ field }) => (
          <Field>
            <FieldLabel>{t("noteForm.tags")}</FieldLabel>
            <TagsCombobox options={tags} value={field.value} onChange={field.onChange} />
          </Field>
        )}
      />

      <Controller
        control={form.control}
        name="contentMd"
        render={({ field }) => (
          <Field>
            <TiptapEditor value={field.value} onChange={field.onChange} />
          </Field>
        )}
      />

      <div className="flex gap-3">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting
            ? t("noteForm.saving")
            : isEdit
              ? t("noteForm.update")
              : t("noteForm.create")}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate({ to: "/admin/interview/notes" })}
        >
          {t("noteForm.cancel")}
        </Button>
        {canPreview && section && note && (
          <Button
            type="button"
            variant="outline"
            className="ml-auto"
            render={
              <Link
                to="/interview/$section/$slug"
                params={{ section: section.slug, slug: note.slug }}
                target="_blank"
                rel="noreferrer"
              />
            }
          >
            <ArrowSquareOutIcon className="size-4" />
            {t("noteForm.preview")}
          </Button>
        )}
      </div>
    </form>
  );
}
