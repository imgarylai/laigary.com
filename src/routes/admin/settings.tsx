import { createFileRoute } from "@tanstack/react-router";
import { getSettingsFn } from "@/server/admin/reads";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { useI18n } from "@/i18n/I18nProvider";

export const Route = createFileRoute("/admin/settings")({
  loader: () => getSettingsFn(),
  component: SettingsPage,
});

function SettingsPage() {
  const { t } = useI18n();
  const settings = Route.useLoaderData();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">{t("admin.settings")}</h1>
      <SettingsForm settings={settings} />
    </div>
  );
}
