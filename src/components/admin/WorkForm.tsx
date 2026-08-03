import { useForm, Controller } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { ArrowSquareOutIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useI18n } from "@/i18n/I18nProvider";
import { useSaveShortcut } from "@/hooks/use-save-shortcut";
import { useSlugAutofill } from "@/hooks/use-slug-autofill";
import { TagsCombobox, type TagOption } from "./TagsCombobox";
import { TiptapEditor } from "./TiptapEditor";
import { CoverImageUpload } from "./CoverImageUpload";
import { EditorShell } from "./EditorShell";
import { SaveState } from "./SaveState";
import { UnsavedChangesGuard } from "./UnsavedChangesGuard";
import { EDITOR_TITLE_CLASS } from "./form-fields";
import { createWorkFn, updateWorkFn } from "@/server/admin/works";

// Blank is "no link", which is not the same as an invalid URL — the union lets
// an untouched field through and still rejects a typo'd one.
const optionalUrl = z.union([z.literal(""), z.url("Must be a valid URL")]);
// A number input hands back a string, but the default value is a number.
// Accepting both and normalising in a transform keeps the FIELD type
// `string | number` — which is what <Input value> takes — while the parsed
// output the submit handler sees is always a number. `z.coerce.number()` would
// type the input side as `unknown` and no longer assign to an input element.
const yearField = z
  .union([z.string(), z.number()])
  .transform((v) => (typeof v === "string" ? Number(v) : v))
  .pipe(
    z
      .number("Year is required")
      .int("Year must be a whole number")
      .min(1970, "Year must be 1970 or later")
      .max(2100, "Year must be 2100 or earlier"),
  );

const workFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title must be 255 characters or less"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  summary: z.string(),
  contentMd: z.string(),
  coverImageUrl: z.string(),
  projectUrl: optionalUrl,
  repoUrl: optionalUrl,
  role: z.string(),
  year: yearField,
  // "" means "single year" and must survive the numeric normalisation above,
  // so the end year is its own union rather than `yearField.optional()`. The
  // empty literal comes first so a cleared field short-circuits there.
  endYear: z.union([z.literal(""), yearField]),
  status: z.enum(["draft", "published"]),
  pinned: z.boolean(),
  tagIds: z.array(z.string()),
});
type WorkFormValues = z.input<typeof workFormSchema>;
type WorkFormOutput = z.output<typeof workFormSchema>;

export type WorkInit = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  contentMd: string;
  coverImageUrl: string | null;
  projectUrl: string | null;
  repoUrl: string | null;
  role: string | null;
  year: number;
  endYear: number | null;
  status: "draft" | "published";
  pinned: boolean;
  tagIds: string[];
};

// Portfolio entry editor. Shaped after NoteForm rather than PostForm: the
// helpers in form-fields.tsx are typed against Control<PostFormValues>, and a
// work carries fields (project/repo links, role, year range) that type has no
// slot for — so this declares its own schema and Controllers, and reuses only
// the editor chrome both forms share.
export function WorkForm({
  work,
  availableTags,
  ogBrand,
}: {
  work?: WorkInit;
  availableTags: TagOption[];
  ogBrand: string;
}) {
  const navigate = useNavigate();
  const router = useRouter();
  const { t } = useI18n();
  const isEdit = !!work;

  const form = useForm<WorkFormValues, unknown, WorkFormOutput>({
    resolver: standardSchemaResolver(workFormSchema),
    defaultValues: work
      ? {
          title: work.title,
          slug: work.slug,
          summary: work.summary,
          contentMd: work.contentMd,
          coverImageUrl: work.coverImageUrl ?? "",
          projectUrl: work.projectUrl ?? "",
          repoUrl: work.repoUrl ?? "",
          role: work.role ?? "",
          year: work.year,
          endYear: work.endYear ?? "",
          status: work.status,
          pinned: work.pinned,
          tagIds: work.tagIds,
        }
      : {
          title: "",
          slug: "",
          summary: "",
          contentMd: "",
          coverImageUrl: "",
          projectUrl: "",
          repoUrl: "",
          role: "",
          // `year` is NOT NULL with no default, so an unset field would fail the
          // insert somewhere the form never showed an error.
          year: new Date().getFullYear(),
          endYear: "",
          status: "draft",
          pinned: false,
          tagIds: [],
        },
  });

  // Auto-fill the slug from the title until the author edits it by hand, and
  // only for new works (never rewrite an existing work's public URL).
  const slugAutofill = useSlugAutofill({
    enabled: !isEdit,
    getSlug: () => form.getValues("slug"),
    setSlug: (value) => form.setValue("slug", value),
  });

  const submit = form.handleSubmit(async (values) => {
    // "" collapses the range back to a single year, and null is what the query
    // layer reads as "clear it" — undefined would leave the stored value alone.
    const payload = { ...values, endYear: values.endYear === "" ? null : values.endYear };

    // Split the two paths so the create result's `data` narrows (update returns
    // a ref too, but a shared union would still need the discriminant).
    if (work) {
      const result = await updateWorkFn({ data: { id: work.id, ...payload } });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(t("workForm.workUpdated"));
      // Clears isDirty, which the save-state indicator and the navigation guard
      // both read. Without it the form stays dirty forever after the first
      // edit, so the guard would block the redirect this save is about to make.
      form.reset(values);
      router.invalidate();
    } else {
      const result = await createWorkFn({ data: payload });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(t("workForm.workCreated"));
      // The work has a saved slug now; the title is free to keep changing.
      slugAutofill.stop();
      form.reset(values);
      navigate({ to: "/admin/works/$workId/edit", params: { workId: result.data.id } });
    }
  });

  useSaveShortcut(() => {
    if (!form.formState.isSubmitting) submit();
  });

  // A published work has a live public page; link straight to it so the author
  // can preview without going back to the list. Drafts have no public page.
  const canPreview = isEdit && work?.status === "published" && !!work?.slug;

  const settings = (
    <>
      <Controller
        control={form.control}
        name="slug"
        render={({ field, fieldState }) => (
          <Field>
            <FieldLabel htmlFor="work-slug">{t("postForm.slug")}</FieldLabel>
            <Input id="work-slug" placeholder={t("postForm.slugPlaceholder")} {...field} />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />

      <Controller
        control={form.control}
        name="summary"
        render={({ field, fieldState }) => (
          <Field>
            <FieldLabel htmlFor="work-summary">{t("workForm.summary")}</FieldLabel>
            <Textarea id="work-summary" placeholder={t("workForm.summaryPlaceholder")} {...field} />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />

      <Controller
        control={form.control}
        name="year"
        render={({ field, fieldState }) => (
          <Field>
            <FieldLabel htmlFor="work-year">{t("workForm.year")}</FieldLabel>
            <Input id="work-year" type="number" inputMode="numeric" {...field} />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />

      <Controller
        control={form.control}
        name="endYear"
        render={({ field, fieldState }) => (
          <Field>
            <FieldLabel htmlFor="work-end-year">{t("workForm.endYear")}</FieldLabel>
            <Input
              id="work-end-year"
              type="number"
              inputMode="numeric"
              placeholder={t("workForm.endYearPlaceholder")}
              {...field}
            />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />

      <Controller
        control={form.control}
        name="role"
        render={({ field, fieldState }) => (
          <Field>
            <FieldLabel htmlFor="work-role">{t("workForm.role")}</FieldLabel>
            <Input id="work-role" placeholder={t("workForm.rolePlaceholder")} {...field} />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />

      <Controller
        control={form.control}
        name="projectUrl"
        render={({ field, fieldState }) => (
          <Field>
            <FieldLabel htmlFor="work-project-url">{t("workForm.projectUrl")}</FieldLabel>
            <Input id="work-project-url" placeholder="https://…" {...field} />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />

      <Controller
        control={form.control}
        name="repoUrl"
        render={({ field, fieldState }) => (
          <Field>
            <FieldLabel htmlFor="work-repo-url">{t("workForm.repoUrl")}</FieldLabel>
            <Input id="work-repo-url" placeholder="https://github.com/…" {...field} />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />

      <Controller
        control={form.control}
        name="status"
        render={({ field }) => (
          <Field>
            {/* Binary, so a switch — matching the post and note editors. Off is
                draft. */}
            <div className="flex items-center gap-3">
              <Switch
                id="work-status"
                checked={field.value === "published"}
                onCheckedChange={(checked) => field.onChange(checked ? "published" : "draft")}
              />
              <FieldLabel htmlFor="work-status">{t("postForm.published")}</FieldLabel>
            </div>
          </Field>
        )}
      />

      <Controller
        control={form.control}
        name="pinned"
        render={({ field }) => (
          <Field>
            <div className="flex items-center gap-3">
              <Switch
                id="work-pinned"
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked)}
              />
              <FieldLabel htmlFor="work-pinned">{t("postForm.pinned")}</FieldLabel>
            </div>
          </Field>
        )}
      />

      <Controller
        control={form.control}
        name="tagIds"
        render={({ field }) => (
          <Field>
            <FieldLabel>{t("workForm.stack")}</FieldLabel>
            <TagsCombobox options={availableTags} value={field.value} onChange={field.onChange} />
          </Field>
        )}
      />

      <Controller
        control={form.control}
        name="coverImageUrl"
        render={({ field }) => (
          <Field>
            <FieldLabel>{t("postForm.coverImage")}</FieldLabel>
            <CoverImageUpload
              value={field.value}
              onChange={field.onChange}
              title={form.watch("title")}
              ogBrand={ogBrand}
            />
          </Field>
        )}
      />
    </>
  );

  return (
    <form onSubmit={submit}>
      <UnsavedChangesGuard dirty={form.formState.isDirty} saving={form.formState.isSubmitting} />
      <EditorShell
        heading={isEdit ? t("admin.editWork") : t("admin.newWork")}
        settingsLabel={t("workForm.settings")}
        settings={settings}
        actions={
          <>
            <SaveState
              dirty={form.formState.isDirty}
              saving={form.formState.isSubmitting}
              saved={isEdit}
            />
            {canPreview && work && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                nativeButton={false}
                render={
                  <Link
                    to="/works/$slug"
                    params={{ slug: work.slug }}
                    target="_blank"
                    rel="noreferrer"
                  />
                }
              >
                <ArrowSquareOutIcon className="size-4" />
                {t("postForm.preview")}
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => navigate({ to: "/admin/works" })}
            >
              {t("postForm.cancel")}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={form.formState.isSubmitting}
              title={`${isEdit ? t("postForm.update") : t("postForm.create")} (⌘S)`}
            >
              {form.formState.isSubmitting
                ? t("postForm.saving")
                : isEdit
                  ? t("postForm.update")
                  : t("postForm.create")}
            </Button>
          </>
        }
      >
        {({ showPreview }) => (
          <>
            <Controller
              control={form.control}
              name="title"
              render={({ field, fieldState }) => (
                <Field>
                  <Input
                    id="work-title"
                    aria-label={t("postForm.title")}
                    placeholder={t("postForm.titlePlaceholder")}
                    className={EDITOR_TITLE_CLASS}
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      slugAutofill.fromTitle(e.target.value);
                    }}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="contentMd"
              render={({ field }) => (
                <Field>
                  <TiptapEditor
                    value={field.value}
                    onChange={field.onChange}
                    showPreview={showPreview}
                  />
                </Field>
              )}
            />
          </>
        )}
      </EditorShell>
    </form>
  );
}
