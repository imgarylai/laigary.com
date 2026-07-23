import { useForm } from "react-hook-form";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/I18nProvider";
import { useSaveShortcut } from "@/hooks/use-save-shortcut";
import { updateSettingsFn } from "@/server/admin/settings";
import { SOCIAL_PREFIXES } from "@/lib/social";

type FieldDef = { key: string; labelKey: string; multiline?: boolean; prefix?: string };

// The known site_settings keys, grouped for the form. Settings are a free-form
// key/value map in the DB; this is the curated set the UI edits.
const SITE_FIELDS: FieldDef[] = [
  { key: "site_name", labelKey: "admin.siteName" },
  { key: "site_url", labelKey: "admin.siteUrl" },
  { key: "site_description", labelKey: "admin.siteDescription", multiline: true },
  { key: "title_template", labelKey: "admin.titleTemplate" },
  { key: "keywords", labelKey: "admin.keywords" },
  { key: "og_image_url", labelKey: "admin.ogImageUrl" },
  { key: "locale", labelKey: "admin.defaultLocale" },
  { key: "whoami", labelKey: "admin.whoami", multiline: true },
];

const AUTHOR_FIELDS: FieldDef[] = [
  { key: "author_name", labelKey: "admin.authorName" },
  { key: "author_location", labelKey: "admin.location" },
  { key: "author_email", labelKey: "admin.email" },
  // Social fields store the bare handle/slug; the visible prefix makes the
  // expected format obvious, and the mutation normalizes pasted URLs anyway.
  { key: "author_github", labelKey: "admin.github", prefix: SOCIAL_PREFIXES.author_github },
  { key: "author_twitter", labelKey: "admin.twitter", prefix: SOCIAL_PREFIXES.author_twitter },
  { key: "author_linkedin", labelKey: "admin.linkedin", prefix: SOCIAL_PREFIXES.author_linkedin },
];

// giscus comments (all four required for the widget to render; values come
// from giscus.app once Discussions are enabled on the repo).
const COMMENT_FIELDS: FieldDef[] = [
  { key: "giscus_repo", labelKey: "admin.giscusRepo" },
  { key: "giscus_repo_id", labelKey: "admin.giscusRepoId" },
  { key: "giscus_category", labelKey: "admin.giscusCategory" },
  { key: "giscus_category_id", labelKey: "admin.giscusCategoryId" },
];

const ALL_KEYS = [...SITE_FIELDS, ...AUTHOR_FIELDS, ...COMMENT_FIELDS].map((f) => f.key);

export function SettingsForm({ settings }: { settings: Record<string, string> }) {
  const { t } = useI18n();
  const router = useRouter();

  const form = useForm<Record<string, string>>({
    defaultValues: Object.fromEntries(ALL_KEYS.map((k) => [k, settings[k] ?? ""])),
  });

  const submit = form.handleSubmit(async (values) => {
    const result = await updateSettingsFn({ data: values });
    if (!result.ok) {
      toast.error(t("admin.settingsSaveFailed"));
      return;
    }
    toast.success(t("admin.settingsSaved"));
    router.invalidate();
  });

  useSaveShortcut(() => {
    if (!form.formState.isSubmitting) submit();
  });

  function renderFields(fields: FieldDef[]) {
    return fields.map((f) => (
      <Field key={f.key}>
        <FieldLabel htmlFor={`settings-${f.key}`}>{t(f.labelKey)}</FieldLabel>
        {f.multiline ? (
          <Textarea id={`settings-${f.key}`} {...form.register(f.key)} />
        ) : f.prefix ? (
          <InputGroup>
            <InputGroupAddon>
              <InputGroupText>{f.prefix}</InputGroupText>
            </InputGroupAddon>
            <InputGroupInput id={`settings-${f.key}`} {...form.register(f.key)} />
          </InputGroup>
        ) : (
          <Input id={`settings-${f.key}`} {...form.register(f.key)} />
        )}
      </Field>
    ));
  }

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-8">
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t("admin.siteSettings")}</h2>
        {renderFields(SITE_FIELDS)}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t("admin.author")}</h2>
        {renderFields(AUTHOR_FIELDS)}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t("admin.comments")}</h2>
        {renderFields(COMMENT_FIELDS)}
      </section>

      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? t("admin.saving") : t("admin.save")}
      </Button>
    </form>
  );
}
