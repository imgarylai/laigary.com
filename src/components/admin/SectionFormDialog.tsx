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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/I18nProvider";
import { slugify } from "@/lib/slug";
import { createSectionFn, updateSectionFn } from "@/server/admin/interview";

const schema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens"),
  label: z.string().min(1),
  blurb: z.string(),
  icon: z.string(),
  sortOrder: z.number().int(),
});
type FormValues = z.infer<typeof schema>;

type Section = {
  id: string;
  slug: string;
  label: string;
  blurb: string;
  icon: string;
  sortOrder: number;
};

// Create an interview section, or edit an existing one. A section's slug is
// immutable (public URL), so it's read-only in edit mode.
export function SectionFormDialog({ section }: { section?: Section }) {
  const { t } = useI18n();
  const router = useRouter();
  const isEdit = !!section;
  const [open, setOpen] = useState(false);

  const defaults: FormValues = {
    slug: section?.slug ?? "",
    label: section?.label ?? "",
    blurb: section?.blurb ?? "",
    icon: section?.icon ?? "",
    sortOrder: section?.sortOrder ?? 0,
  };

  const form = useForm<FormValues>({
    resolver: standardSchemaResolver(schema),
    defaultValues: defaults,
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const result = isEdit
      ? await updateSectionFn({
          data: {
            id: section.id,
            label: values.label,
            blurb: values.blurb,
            icon: values.icon,
            sortOrder: values.sortOrder,
          },
        })
      : await createSectionFn({ data: values });

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(isEdit ? t("admin.sectionUpdated") : t("admin.sectionCreated"));
    setOpen(false);
    form.reset(defaults);
    router.invalidate();
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) form.reset(defaults);
      }}
    >
      <DialogTrigger
        render={
          isEdit ? <Button type="button" variant="outline" size="sm" /> : <Button type="button" />
        }
      >
        {isEdit ? t("sectionList.edit") : t("sectionList.newSection")}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("sectionForm.editTitle") : t("sectionForm.createTitle")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="section-label">{t("sectionForm.label")}</FieldLabel>
              <Input
                id="section-label"
                {...form.register("label", {
                  onChange: (e) => {
                    if (!isEdit && !form.formState.dirtyFields.slug) {
                      form.setValue("slug", slugify(e.target.value));
                    }
                  },
                })}
              />
              <FieldError errors={[form.formState.errors.label]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="section-slug">{t("sectionForm.slug")}</FieldLabel>
              <Input
                id="section-slug"
                readOnly={isEdit}
                disabled={isEdit}
                {...form.register("slug")}
              />
              <FieldError errors={[form.formState.errors.slug]} />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="section-blurb">{t("sectionForm.blurb")}</FieldLabel>
            <Textarea id="section-blurb" {...form.register("blurb")} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="section-icon">{t("sectionForm.icon")}</FieldLabel>
              <Input
                id="section-icon"
                placeholder={t("sectionForm.iconPlaceholder")}
                {...form.register("icon")}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="section-sort">{t("sectionForm.sortOrder")}</FieldLabel>
              <Input
                id="section-sort"
                type="number"
                {...form.register("sortOrder", { valueAsNumber: true })}
              />
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t("sectionForm.cancel")}
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting
                ? t("sectionForm.saving")
                : isEdit
                  ? t("sectionForm.update")
                  : t("sectionForm.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
