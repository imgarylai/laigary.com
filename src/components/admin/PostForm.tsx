import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/I18nProvider";
import { useSaveShortcut } from "@/hooks/use-save-shortcut";
import { slugify } from "@/lib/slug";
import { createPostFn, updatePostFn } from "@/server/admin/posts";
import {
  postFormSchema,
  type PostFormValues,
  TitleField,
  SlugField,
  ExcerptField,
  StatusField,
  TagsField,
  ContentField,
  CoverImageField,
} from "./form-fields";
import type { TagOption } from "./TagsCombobox";

export function PostForm({
  initialData,
  postId,
  availableTags,
  ogBrand,
}: {
  initialData?: PostFormValues;
  postId?: string;
  availableTags: TagOption[];
  ogBrand: string;
}) {
  const navigate = useNavigate();
  const router = useRouter();
  const { t } = useI18n();
  const isEdit = !!postId;

  const form = useForm<PostFormValues>({
    // zod v4 schemas are Standard Schema-compliant; the standard-schema resolver
    // types cleanly against them (zodResolver's overloads mis-infer under zod 4).
    resolver: standardSchemaResolver(postFormSchema),
    defaultValues: initialData ?? {
      title: "",
      slug: "",
      contentMd: "",
      excerpt: "",
      coverImageUrl: "",
      tagIds: [],
      status: "draft",
    },
  });

  const slugManuallyEdited = form.formState.dirtyFields.slug;

  function handleTitleChange(title: string) {
    // Auto-fill the slug from the title until the author edits it by hand, and
    // only for new posts (never rewrite an existing post's public URL).
    if (!slugManuallyEdited && !isEdit) {
      form.setValue("slug", slugify(title));
    }
  }

  async function onSubmit(values: PostFormValues) {
    const result = postId
      ? await updatePostFn({ data: { id: postId, ...values } })
      : await createPostFn({ data: values });

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(isEdit ? t("postForm.postUpdated") : t("postForm.postCreated"));

    if (isEdit) {
      // Stay on the editor; re-run the loader to pick up server-side changes.
      router.invalidate();
    } else {
      navigate({ to: "/admin/posts/$postId/edit", params: { postId: result.data.id } });
    }
  }

  const submit = form.handleSubmit(onSubmit);
  useSaveShortcut(() => {
    if (!form.formState.isSubmitting) submit();
  });

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <TitleField control={form.control} onValueChange={handleTitleChange} />
        <SlugField control={form.control} />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <ExcerptField control={form.control} />
        <StatusField control={form.control} />
      </div>

      <TagsField control={form.control} availableTags={availableTags} />

      <CoverImageField control={form.control} title={form.watch("title")} ogBrand={ogBrand} />

      <ContentField control={form.control} />

      <div className="flex gap-3">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting
            ? t("postForm.saving")
            : isEdit
              ? t("postForm.update")
              : t("postForm.create")}
        </Button>
        <Button type="button" variant="outline" onClick={() => navigate({ to: "/admin/posts" })}>
          {t("postForm.cancel")}
        </Button>
      </div>
    </form>
  );
}
