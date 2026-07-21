import { useState } from "react";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/I18nProvider";
import { slugify } from "@/lib/slug";
import { createTagFn, updateTagFn } from "@/server/admin/tags";

const schema = z.object({
  name: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens"),
});
type FormValues = z.infer<typeof schema>;

// Create a tag, or rename an existing one. A tag's slug is immutable (part of
// the public URL), so in edit mode the slug field is shown read-only and only
// the name is sent.
export function TagFormDialog({ tag }: { tag?: { id: string; name: string; slug: string } }) {
  const { t } = useI18n();
  const router = useRouter();
  const isEdit = !!tag;
  const [open, setOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: standardSchemaResolver(schema),
    defaultValues: { name: tag?.name ?? "", slug: tag?.slug ?? "" },
  });

  function reset() {
    form.reset({ name: tag?.name ?? "", slug: tag?.slug ?? "" });
  }

  const onSubmit = form.handleSubmit(async (values) => {
    const result = isEdit
      ? await updateTagFn({ data: { id: tag.id, name: values.name } })
      : await createTagFn({ data: values });

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(isEdit ? t("admin.tagUpdated") : t("admin.tagCreated"));
    setOpen(false);
    reset();
    router.invalidate();
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger
        render={
          isEdit ? <Button type="button" variant="outline" size="sm" /> : <Button type="button" />
        }
      >
        {isEdit ? t("tagList.edit") : t("tagList.newTag")}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? t("tagForm.editTitle") : t("tagForm.createTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field>
            <FieldLabel htmlFor="tag-name">{t("tagForm.name")}</FieldLabel>
            <Input
              id="tag-name"
              placeholder={t("tagForm.namePlaceholder")}
              {...form.register("name", {
                onChange: (e) => {
                  // Auto-fill slug from name for new tags until edited by hand.
                  if (!isEdit && !form.formState.dirtyFields.slug) {
                    form.setValue("slug", slugify(e.target.value));
                  }
                },
              })}
            />
            <FieldError errors={[form.formState.errors.name]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="tag-slug">{t("tagForm.slug")}</FieldLabel>
            <Input
              id="tag-slug"
              placeholder={t("tagForm.slugPlaceholder")}
              readOnly={isEdit}
              disabled={isEdit}
              {...form.register("slug")}
            />
            <FieldError errors={[form.formState.errors.slug]} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t("tagForm.cancel")}
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting
                ? t("tagForm.saving")
                : isEdit
                  ? t("tagForm.update")
                  : t("tagForm.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
