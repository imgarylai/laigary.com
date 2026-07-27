import { useForm, Controller } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/I18nProvider";
import { useSaveShortcut } from "@/hooks/use-save-shortcut";
import { slugify } from "@/lib/slug";
import { TiptapEditor } from "./TiptapEditor";
import { EditorShell } from "./EditorShell";
import { SaveState } from "./SaveState";
import { UnsavedChangesGuard } from "./UnsavedChangesGuard";
import { EDITOR_TITLE_CLASS } from "./form-fields";
import { upsertPageFn } from "@/server/admin/pages";

const pageFormSchema = z.object({
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  title: z.string().min(1, "Title is required"),
  contentMd: z.string(),
});
type PageFormValues = z.infer<typeof pageFormSchema>;

// Pages are upserted by slug, so an existing page's slug is locked (changing it
// would create a new page rather than rename this one).
export function PageForm({ page }: { page?: { slug: string; title: string; contentMd: string } }) {
  const navigate = useNavigate();
  const router = useRouter();
  const { t } = useI18n();
  const isEdit = !!page;

  const form = useForm<PageFormValues>({
    resolver: standardSchemaResolver(pageFormSchema),
    defaultValues: page ?? { slug: "", title: "", contentMd: "" },
  });

  function handleTitleChange(title: string) {
    if (!isEdit && !form.formState.dirtyFields.slug) {
      form.setValue("slug", slugify(title));
    }
  }

  const submit = form.handleSubmit(async (values) => {
    const result = await upsertPageFn({ data: values });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(isEdit ? t("admin.pageUpdated") : t("admin.pageCreated"));
    // Clears isDirty, which the save-state indicator and the navigation guard
    // both read. Without it the form stays dirty forever after the first
    // edit, so the guard would block the redirect this save is about to make.
    form.reset(values);
    if (isEdit) {
      router.invalidate();
    } else {
      navigate({ to: "/admin/pages/$slug/edit", params: { slug: values.slug } });
    }
  });

  useSaveShortcut(() => {
    if (!form.formState.isSubmitting) submit();
  });

  return (
    <form onSubmit={submit}>
      <UnsavedChangesGuard dirty={form.formState.isDirty} saving={form.formState.isSubmitting} />
      <EditorShell
        heading={isEdit ? t("admin.editPage") : t("admin.newPage")}
        settingsLabel={t("pageForm.settings")}
        settings={
          <Controller
            control={form.control}
            name="slug"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor="page-slug">{t("pageForm.slug")}</FieldLabel>
                <Input
                  id="page-slug"
                  placeholder={t("pageForm.slugPlaceholder")}
                  readOnly={isEdit}
                  disabled={isEdit}
                  {...field}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        }
        actions={
          <>
            <SaveState
              dirty={form.formState.isDirty}
              saving={form.formState.isSubmitting}
              saved={isEdit}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => navigate({ to: "/admin/pages" })}
            >
              {t("pageForm.cancel")}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={form.formState.isSubmitting}
              title={`${isEdit ? t("pageForm.update") : t("pageForm.create")} (⌘S)`}
            >
              {form.formState.isSubmitting
                ? t("pageForm.saving")
                : isEdit
                  ? t("pageForm.update")
                  : t("pageForm.create")}
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
                    id="page-title"
                    aria-label={t("pageForm.title")}
                    placeholder={t("pageForm.titlePlaceholder")}
                    className={EDITOR_TITLE_CLASS}
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
