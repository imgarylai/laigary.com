import { useI18n } from "@/i18n/I18nProvider";

export type FooterSocial = {
  github: string | null;
  twitter: string | null;
  linkedin: string | null;
  email: string | null;
};

export function PublicFooter({ social }: { social: FooterSocial }) {
  const { t } = useI18n();
  return (
    <footer className="public-footer">
      <div className="public-social-links">
        {(["github", "linkedin", "twitter", "email"] as const).map(
          (network) =>
            social[network] && (
              <a
                key={network}
                href={social[network]}
                target={network === "email" ? undefined : "_blank"}
                rel="noreferrer"
              >
                {t(`public.${network}`)}
              </a>
            ),
        )}
        <a href="/feed.xml">{t("public.rss")}</a>
      </div>
      <div className="public-signature">
        <span className="public-fuel-signature">{t("public.fueledByTea")}</span>
        <span>
          © {new Date().getFullYear()} {t("public.brand")}
        </span>
        <span>{t("public.domain")}</span>
      </div>
    </footer>
  );
}
