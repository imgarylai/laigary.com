import { Controller, type Control } from "react-hook-form";
import { z } from "zod";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/i18n/I18nProvider";
import { TagsCombobox, type TagOption } from "./TagsCombobox";
import { TiptapEditor } from "./TiptapEditor";
import { CoverImageUpload } from "./CoverImageUpload";

// Shared post-form schema. Field names are camelCase to match the create/update
// server-function input directly (no snake_case mapping layer). Validation
// messages stay in English — they only surface to the author on invalid input.
export const postFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title must be 255 characters or less"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  contentMd: z.string().min(1, "Content is required"),
  excerpt: z.string(),
  coverImageUrl: z.string(),
  tagIds: z.array(z.string()),
  status: z.enum(["draft", "published"]),
});
export type PostFormValues = z.infer<typeof postFormSchema>;

type Ctrl = Control<PostFormValues>;

export function TitleField({
  control,
  onValueChange,
}: {
  control: Ctrl;
  onValueChange?: (value: string) => void;
}) {
  const { t } = useI18n();
  return (
    <Controller
      control={control}
      name="title"
      render={({ field, fieldState }) => (
        <Field>
          <FieldLabel htmlFor="post-title">{t("postForm.title")}</FieldLabel>
          <Input
            id="post-title"
            placeholder={t("postForm.titlePlaceholder")}
            {...field}
            onChange={(e) => {
              field.onChange(e);
              onValueChange?.(e.target.value);
            }}
          />
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}

export function SlugField({ control }: { control: Ctrl }) {
  const { t } = useI18n();
  return (
    <Controller
      control={control}
      name="slug"
      render={({ field, fieldState }) => (
        <Field>
          <FieldLabel htmlFor="post-slug">{t("postForm.slug")}</FieldLabel>
          <Input id="post-slug" placeholder={t("postForm.slugPlaceholder")} {...field} />
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}

export function ExcerptField({ control }: { control: Ctrl }) {
  const { t } = useI18n();
  return (
    <Controller
      control={control}
      name="excerpt"
      render={({ field, fieldState }) => (
        <Field>
          <FieldLabel htmlFor="post-excerpt">{t("postForm.excerpt")}</FieldLabel>
          <Textarea id="post-excerpt" placeholder={t("postForm.excerptPlaceholder")} {...field} />
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}

export function StatusField({ control }: { control: Ctrl }) {
  const { t } = useI18n();
  return (
    <Controller
      control={control}
      name="status"
      render={({ field }) => (
        <Field>
          <FieldLabel htmlFor="post-status">{t("postForm.status")}</FieldLabel>
          <Select value={field.value} onValueChange={(v) => field.onChange(v)}>
            <SelectTrigger id="post-status">
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
  );
}

export function TagsField({
  control,
  availableTags,
}: {
  control: Ctrl;
  availableTags: TagOption[];
}) {
  const { t } = useI18n();
  return (
    <Controller
      control={control}
      name="tagIds"
      render={({ field }) => (
        <Field>
          <FieldLabel>{t("postForm.tags")}</FieldLabel>
          <TagsCombobox options={availableTags} value={field.value} onChange={field.onChange} />
        </Field>
      )}
    />
  );
}

export function ContentField({ control }: { control: Ctrl }) {
  return (
    <Controller
      control={control}
      name="contentMd"
      render={({ field, fieldState }) => (
        <Field>
          <TiptapEditor value={field.value} onChange={field.onChange} />
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}

export function CoverImageField({
  control,
  title,
  ogBrand,
}: {
  control: Ctrl;
  title: string;
  ogBrand: string;
}) {
  const { t } = useI18n();
  return (
    <Controller
      control={control}
      name="coverImageUrl"
      render={({ field }) => (
        <Field>
          <FieldLabel>{t("postForm.coverImage")}</FieldLabel>
          <CoverImageUpload
            value={field.value}
            onChange={field.onChange}
            title={title}
            ogBrand={ogBrand}
          />
        </Field>
      )}
    />
  );
}
