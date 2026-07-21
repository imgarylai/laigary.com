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
    <form onSubmit={submit} className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <Controller
          control={form.control}
          name="title"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel htmlFor="page-title">{t("pageForm.title")}</FieldLabel>
              <Input
                id="page-title"
                placeholder={t("pageForm.titlePlaceholder")}
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
      </div>

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
            ? t("pageForm.saving")
            : isEdit
              ? t("pageForm.update")
              : t("pageForm.create")}
        </Button>
        <Button type="button" variant="outline" onClick={() => navigate({ to: "/admin/pages" })}>
          {t("pageForm.cancel")}
        </Button>
      </div>
    </form>
  );
}
