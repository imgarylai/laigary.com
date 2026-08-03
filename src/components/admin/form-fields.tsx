import { Controller, type Control } from "react-hook-form";
import { z } from "zod";
import { Field, FieldLabel, FieldError, FieldDescription } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/i18n/I18nProvider";
import { useMounted } from "@/hooks/use-mounted";
import { datetimeLocalToUnix, unixToDatetimeLocal } from "@/lib/date";
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
  pinned: z.boolean(),
  // Unix seconds, NOT the input's `yyyy-MM-ddTHH:mm` string. Form state has to
  // survive a server render and a hydration in a different timezone, and only
  // the instant is the same on both sides — the wall-clock string is not.
  // `PublishedAtInput` owns the conversion, once, on the client.
  publishedAt: z.number().int().nullable(),
});
export type PostFormValues = z.infer<typeof postFormSchema>;

type Ctrl = Control<PostFormValues>;

/**
 * The title doubles as the page heading, so it carries no label and no chrome —
 * the placeholder is the only affordance it needs. Shared with NoteForm via the
 * className so both editors present the same writing surface.
 */
export const EDITOR_TITLE_CLASS =
  "h-auto rounded-none border-0 bg-transparent px-0 py-1 text-2xl font-bold tracking-tight shadow-none md:text-3xl focus-visible:border-0 focus-visible:ring-0 dark:bg-transparent";

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
          <Input
            id="post-title"
            aria-label={t("postForm.title")}
            placeholder={t("postForm.titlePlaceholder")}
            className={EDITOR_TITLE_CLASS}
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
          {/* Two states, so a switch rather than a select of two options — and
              it reads as a pair with Pinned directly below. Off is draft. */}
          <div className="flex items-center gap-3">
            <Switch
              id="post-status"
              checked={field.value === "published"}
              onCheckedChange={(checked) => field.onChange(checked ? "published" : "draft")}
            />
            <FieldLabel htmlFor="post-status">{t("postForm.published")}</FieldLabel>
          </div>
        </Field>
      )}
    />
  );
}

/**
 * The publish date/time control, shared by the post and note editors.
 *
 * Presentational (value in, value out) rather than a `Controller` like its
 * neighbours, because the two editors declare their own form types — NoteForm
 * has never used this file's `Ctrl`.
 *
 * The mount gate is load-bearing, not a loading nicety. The value is an
 * instant; the input speaks local wall-clock; and the server renders in UTC. A
 * value formatted during SSR would therefore differ from what the browser
 * formats for the same post, and React would hydrate over a `value` it did not
 * render. Holding the field empty until `mounted` makes the first client render
 * match the server's, and the real value arrives one render later.
 */
export function PublishedAtInput({
  id,
  value,
  onChange,
}: {
  id: string;
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  const { t } = useI18n();
  const mounted = useMounted();

  const scheduled = mounted && value !== null && value * 1000 > Date.now();

  return (
    <Field>
      <FieldLabel htmlFor={id}>{t("postForm.publishedAt")}</FieldLabel>
      <Input
        id={id}
        type="datetime-local"
        // Empty until mounted — see above. `disabled` moves in step so the
        // author cannot type into a field that is about to be overwritten.
        value={mounted && value !== null ? unixToDatetimeLocal(value) : ""}
        disabled={!mounted}
        onChange={(e) => onChange(datetimeLocalToUnix(e.target.value))}
      />
      <FieldDescription>
        {scheduled ? t("postForm.publishedAtScheduled") : t("postForm.publishedAtHint")}
      </FieldDescription>
    </Field>
  );
}

export function PublishedAtField({ control }: { control: Ctrl }) {
  return (
    <Controller
      control={control}
      name="publishedAt"
      render={({ field }) => (
        <PublishedAtInput id="post-published-at" value={field.value} onChange={field.onChange} />
      )}
    />
  );
}

export function PinnedField({ control }: { control: Ctrl }) {
  const { t } = useI18n();
  return (
    <Controller
      control={control}
      name="pinned"
      render={({ field }) => (
        <Field>
          <div className="flex items-center gap-3">
            <Switch
              id="post-pinned"
              checked={field.value}
              onCheckedChange={(checked) => field.onChange(checked)}
            />
            <FieldLabel htmlFor="post-pinned">{t("postForm.pinned")}</FieldLabel>
          </div>
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

export function ContentField({ control, showPreview }: { control: Ctrl; showPreview: boolean }) {
  return (
    <Controller
      control={control}
      name="contentMd"
      render={({ field, fieldState }) => (
        <Field>
          <TiptapEditor value={field.value} onChange={field.onChange} showPreview={showPreview} />
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
