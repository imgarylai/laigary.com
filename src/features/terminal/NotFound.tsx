import { Link } from "@tanstack/react-router";
import { TmPage } from "./layout";
import { useI18n } from "@/i18n/I18nProvider";

export function TmNotFound() {
  const { t } = useI18n();
  return (
    <TmPage narrow>
      <h1>{t("public.notFound")}</h1>
      <p className="mb-6 text-tm-muted">{t("public.notFoundHint")}</p>
      <Link to="/" className="text-tm-accent underline">
        {t("public.backHome")}
      </Link>
    </TmPage>
  );
}
